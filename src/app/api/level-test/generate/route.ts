import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-gateway';
import { LEVEL_CONFIG, type CEFRLevel } from '@/lib/leveltest-types';

export async function POST(req: NextRequest) {
    try {
        const { level, studentName } = await req.json() as { level: CEFRLevel; studentName: string };
        if (!level || !LEVEL_CONFIG[level]) {
            return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
        }

        const config = LEVEL_CONFIG[level];
        const sections = ['reading', 'vocabulary', 'conversation', 'grammar'] as const;

        const prompt = `You are a CEFR English test generator. Generate a ${level} level test with these exact sections and question counts:

${sections.map(s => `- ${s}: ${config[s]} questions`).join('\n')}
- writing: 1 prompt

For each multiple choice question, provide:
- "id": section prefix + number (R1, R2... V1, V2... C1, C2... G1, G2...)
- "text": the question text (include a reading passage for reading questions)
- "options": array of {"label": "A/B/C/D", "text": "option text"}
- "correct": the correct answer label (A, B, C, or D)
- "section": the section name

For the writing prompt, provide:
- "id": "W1"
- "prompt": a level-appropriate writing task
- "section": "writing"

IMPORTANT: 
- Distribute correct answers evenly across A, B, C, D
- Make all option lengths similar (no "longest answer is correct" pattern)
- Questions must match ${level} difficulty precisely

Respond with ONLY valid JSON:
{
  "sections": {
    "reading": {"title": "Part 1: Reading Comprehension", "questions": [...]},
    "vocabulary": {"title": "Part 2: Vocabulary", "questions": [...]},
    "conversation": {"title": "Part 3: Conversation", "questions": [...]},
    "grammar": {"title": "Part 4: Grammar", "questions": [...]},
    "writing": {"title": "Part 5: Writing", "questions": [{"id":"W1","prompt":"...","section":"writing"}]}
  },
  "answer_key": {"R1":"B","R2":"A",...}
}`;

        const response = await callLLM({
            task: 'level-test',
            userPrompt: prompt,
            systemPrompt: 'You are an expert CEFR English test creator. Output only valid JSON, no markdown fences.',
            temperature: 0.3,
            maxTokens: 8192,
        });

        // Parse LLM response
        let testData;
        try {
            const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            testData = JSON.parse(cleaned);
        } catch {
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        // Add metadata
        const totalQuestions = sections.reduce((sum, s) => sum + config[s], 0) + config.writing;
        const result = {
            metadata: {
                level,
                duration: config.duration,
                generated_at: new Date().toISOString(),
                total_questions: totalQuestions,
                student_name: studentName,
            },
            ...testData,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Test generation error:', error);
        return NextResponse.json({ error: 'Test generation failed' }, { status: 500 });
    }
}

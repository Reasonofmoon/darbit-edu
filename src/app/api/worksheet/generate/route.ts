import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-gateway';

export async function POST(req: NextRequest) {
    try {
        const { text, title, grade } = await req.json() as { text: string; title?: string; grade?: string };
        if (!text?.trim()) {
            return NextResponse.json({ error: 'text is required' }, { status: 400 });
        }

        const gradeLevel = grade || 'High School';
        const bookTitle = title || 'Untitled';

        const prompt = `You are an expert English worksheet generator for ${gradeLevel} students.

## Source Text
Title: ${bookTitle}
${text.slice(0, 8000)}

## Task
Create a comprehensive worksheet from this text. Respond with ONLY valid JSON:

{
  "title": "${bookTitle} Worksheet",
  "vocabulary": [
    {
      "word": "word from text",
      "definition": "clear definition",
      "partOfSpeech": "noun/verb/adj/etc",
      "exampleSentence": "example using the word",
      "contextSentence": "sentence from the text containing this word"
    }
  ],
  "multipleChoice": [
    {
      "question": "Based on the text...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A",
      "textEvidence": "relevant quote from text"
    }
  ],
  "shortAnswer": [
    {
      "question": "Analysis question requiring text evidence",
      "sampleAnswer": "Expected answer with key points",
      "textReference": "Relevant section of text"
    }
  ],
  "discussion": [
    {
      "prompt": "Open-ended discussion prompt connecting text to broader themes",
      "guidingQuestions": ["Sub-question 1", "Sub-question 2"]
    }
  ]
}

Generate:
- 8-12 vocabulary items with definitions and context
- 5-8 multiple choice questions with text evidence
- 3-5 short answer questions requiring analysis
- 2-3 discussion prompts connecting to real-world themes`;

        const response = await callLLM({
            task: 'worksheet',
            userPrompt: prompt,
            systemPrompt: 'You are an expert educational worksheet creator. Output only valid JSON. Make questions engaging and text-based.',
            temperature: 0.5,
            maxTokens: 6144,
        });

        let worksheet;
        try {
            const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            worksheet = JSON.parse(cleaned);
        } catch {
            return NextResponse.json({ error: 'Failed to parse worksheet', raw: response.content }, { status: 500 });
        }

        return NextResponse.json({ worksheet, model: response.model, tokensUsed: response.tokensUsed });
    } catch (error) {
        console.error('Worksheet generation error:', error);
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }
}

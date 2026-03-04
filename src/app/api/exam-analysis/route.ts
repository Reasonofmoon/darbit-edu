import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-gateway';

export async function POST(req: NextRequest) {
    try {
        const { questionText } = await req.json() as { questionText: string };
        if (!questionText?.trim()) {
            return NextResponse.json({ error: 'questionText is required' }, { status: 400 });
        }

        const prompt = `당신은 수능 영어 문항 분석 전문가입니다. 다음 문항을 과학적으로 분석해주세요.

## 분석할 문항
${questionText}

## 분석 항목

다음 JSON 형식으로 정확하게 응답하세요:
{
  "questionType": "문항 유형 (빈칸추론/주제/제목/순서/삽입/어법/어휘/내용일치 등)",
  "bloomLevel": {
    "level": "블룸 분류학 수준 (기억/이해/적용/분석/평가/창조 중 하나)",
    "code": 1-6,
    "justification": "해당 수준으로 분류한 근거"
  },
  "contentArea": {
    "topic": "내용 영역 (주제/소재)",
    "curriculum": "교육과정 연계 항목"
  },
  "difficulty": {
    "level": "상/중/하",
    "predictedCorrectRate": 0-100,
    "discriminationIndex": "상/중/하"
  },
  "validity": {
    "contentValidity": "내용 타당도 평가 (상/중/하, 설명)",
    "constructValidity": "구성 타당도 평가",
    "fairness": "공정성 검토"
  },
  "designPrinciples": {
    "intent": "출제 의도",
    "passageStructure": "지문 구조 분석",
    "distractorDesign": "선택지 설계 전략",
    "attractiveDistractors": "매력적 오답 설계 근거"
  },
  "solvingStrategy": {
    "steps": ["단계별 풀이 과정"],
    "keyEvidence": "정답 근거 문장/구절",
    "correctAnswer": "정답",
    "wrongAnswerAnalysis": {"A": "분석", "B": "분석", "C": "분석", "D": "분석", "E": "분석"}
  },
  "recommendations": {
    "conceptPoints": ["학습 개념 정리 포인트"],
    "relatedTypes": ["연관 문항 유형"],
    "studyStrategy": "학습 전략 제안"
  }
}`;

        const response = await callLLM({
            task: 'exam-analysis',
            userPrompt: prompt,
            systemPrompt: 'You are an expert in Korean CSAT (수능) English exam analysis. Analyze using Bloom\'s Taxonomy and 이원목적분류표. Output only valid JSON.',
            temperature: 0.2,
            maxTokens: 4096,
        });

        let analysis;
        try {
            const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            analysis = JSON.parse(cleaned);
        } catch {
            return NextResponse.json({ error: 'Failed to parse analysis', raw: response.content }, { status: 500 });
        }

        return NextResponse.json({ analysis, model: response.model, tokensUsed: response.tokensUsed });
    } catch (error) {
        console.error('Exam analysis error:', error);
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }
}

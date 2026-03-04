import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-gateway';

export async function POST(req: NextRequest) {
    try {
        const { activity, grade } = await req.json() as { activity: string; grade: string };
        if (!activity?.trim()) {
            return NextResponse.json({ error: 'activity is required' }, { status: 400 });
        }

        const prompt = `당신은 메타인지(Metacognition) 교육 전문가입니다.

## 학습 활동
${activity}

## 대상
${grade || '초등 고학년'}

## 요청
이 학습 활동 후 학생의 메타인지를 촉진하는 질문 8개를 생성하세요.

다음 6개 범주에서 고르게 생성하세요:
- 계획: 학습 전 목표 설정 및 전략 계획
- 모니터링: 학습 중 이해도 점검
- 평가: 학습 후 성과 판단
- 전략: 효과적인 학습 방법 성찰
- 동기: 학습 동기와 태도 성찰
- 전이: 다른 상황으로의 적용

JSON 배열로 응답하세요:
[
  {
    "category": "범주명",
    "question": "학생에게 던질 메타인지 질문 (한국어)",
    "purpose": "이 질문의 교육적 목적",
    "followUp": "학생 답변에 따른 후속 질문"
  }
]`;

        const response = await callLLM({
            task: 'meta-question',
            userPrompt: prompt,
            systemPrompt: 'You are a metacognition education expert. Output only valid JSON array.',
            temperature: 0.6,
            maxTokens: 3072,
        });

        let questions;
        try {
            const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            questions = JSON.parse(cleaned);
        } catch {
            return NextResponse.json({ error: 'Failed to parse questions' }, { status: 500 });
        }

        return NextResponse.json({ questions, model: response.model });
    } catch (error) {
        console.error('Meta question error:', error);
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }
}

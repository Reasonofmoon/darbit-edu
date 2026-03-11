import type {
    AssessmentQuestion,
    EssaySemiAutoQuestion,
    FillBlankQuestion,
    GradeContext,
    GradeResult,
    MultipleChoiceQuestion,
    RubricScore,
    ShortAnswerQuestion,
    TrueFalseQuestion,
} from '../grading-types';
import { clampScore, normalizeLooseText, normalizeStringArray, normalizeText, roundScore } from './normalizers';

export interface QuestionGrader<TQuestion extends AssessmentQuestion = AssessmentQuestion> {
    grade(question: TQuestion, answer: unknown, context: GradeContext): GradeResult;
}

function createBaseResult(
    question: AssessmentQuestion,
    answer: unknown,
    overrides: Partial<GradeResult>,
): GradeResult {
    return {
        questionId: question.id,
        type: question.type,
        earned: 0,
        max: question.points,
        isCorrect: false,
        confidence: 1,
        feedback: '',
        studentAnswer: answer,
        autoGraded: question.gradingMode !== 'manual',
        requiresTeacherReview: question.gradingMode !== 'auto',
        reviewStatus: question.gradingMode === 'auto' ? 'auto_graded' : 'pending_review',
        ...overrides,
    };
}

export class MultipleChoiceGrader implements QuestionGrader<MultipleChoiceQuestion> {
    grade(question: MultipleChoiceQuestion, answer: unknown): GradeResult {
        const studentAnswer = typeof answer === 'string' ? answer : '';
        const normalizedAnswer = normalizeText(studentAnswer);
        const normalizedCorrect = normalizeText(question.correctAnswer);
        const isCorrect = normalizedAnswer === normalizedCorrect;

        return createBaseResult(question, answer, {
            earned: isCorrect ? question.points : 0,
            isCorrect,
            feedback: isCorrect ? '정답입니다.' : `오답입니다. 정답: ${question.correctAnswer}`,
            feedbackCode: isCorrect ? 'correct' : 'wrong_choice',
            normalizedAnswer,
        });
    }
}

export class TrueFalseGrader implements QuestionGrader<TrueFalseQuestion> {
    grade(question: TrueFalseQuestion, answer: unknown): GradeResult {
        const studentAnswer = typeof answer === 'boolean' ? answer : false;
        const isCorrect = studentAnswer === question.correctAnswer;

        return createBaseResult(question, answer, {
            earned: isCorrect ? question.points : 0,
            isCorrect,
            feedback: isCorrect ? '정답입니다.' : `오답입니다. 정답: ${question.correctAnswer ? 'True' : 'False'}`,
            feedbackCode: isCorrect ? 'correct' : 'wrong_choice',
            normalizedAnswer: studentAnswer,
        });
    }
}

export class FillBlankGrader implements QuestionGrader<FillBlankQuestion> {
    grade(question: FillBlankQuestion, answer: unknown): GradeResult {
        const rawAnswers = Array.isArray(answer)
            ? answer.filter((value): value is string => typeof value === 'string')
            : typeof answer === 'string'
                ? answer.split('|').map((value) => value.trim())
                : [];
        const normalizedAnswer = rawAnswers.map((value) => normalizeLooseText(value));
        const totalWeight = question.blanks.reduce((sum, blank) => sum + (blank.weight ?? 1), 0);
        let earnedWeight = 0;
        let correctCount = 0;

        question.blanks.forEach((blank, index) => {
            const accepted = blank.answers.map((value) => normalizeLooseText(value));
            const submitted = normalizedAnswer[index] ?? '';
            if (accepted.includes(submitted)) {
                earnedWeight += blank.weight ?? 1;
                correctCount += 1;
            }
        });

        const earned = totalWeight > 0 ? roundScore((earnedWeight / totalWeight) * question.points) : 0;

        return createBaseResult(question, answer, {
            earned,
            isCorrect: correctCount === question.blanks.length && question.blanks.length > 0,
            feedback: `빈칸 ${correctCount}/${question.blanks.length} 정답`,
            feedbackCode: correctCount === question.blanks.length ? 'correct' : 'blank_partial',
            normalizedAnswer,
        });
    }
}

export class ShortAnswerGrader implements QuestionGrader<ShortAnswerQuestion> {
    grade(question: ShortAnswerQuestion, answer: unknown): GradeResult {
        const studentAnswer = typeof answer === 'string' ? answer : '';
        const normalizedAnswer = normalizeLooseText(studentAnswer);
        const answerLength = normalizeText(studentAnswer).length;

        if (question.minLength && answerLength < question.minLength) {
            return createBaseResult(question, answer, {
                feedback: `답변이 너무 짧습니다. 최소 ${question.minLength}자 이상 작성하세요.`,
                feedbackCode: 'answer_too_short',
                normalizedAnswer,
            });
        }

        const matchedWeight = question.keywords.reduce((sum, keyword) => {
            return normalizedAnswer.includes(normalizeLooseText(keyword.value)) ? sum + keyword.weight : sum;
        }, 0);
        const totalWeight = question.keywords.reduce((sum, keyword) => sum + keyword.weight, 0);
        const missingRequired = question.keywords.some((keyword) => {
            return keyword.required && !normalizedAnswer.includes(normalizeLooseText(keyword.value));
        });

        let earned = totalWeight > 0 ? roundScore((matchedWeight / totalWeight) * question.points) : 0;
        if (missingRequired) {
            earned = Math.min(earned, Math.floor(question.points * 0.6));
        }

        return createBaseResult(question, answer, {
            earned,
            isCorrect: earned === question.points && !missingRequired,
            feedback: `핵심 키워드 점수 ${earned}/${question.points}`,
            feedbackCode: missingRequired ? 'missing_required_keyword' : earned === question.points ? 'correct' : 'keyword_partial',
            normalizedAnswer,
            meta: {
                matchedWeight,
                totalWeight,
                missingRequired,
            },
        });
    }
}

export class EssaySemiAutoGrader implements QuestionGrader<EssaySemiAutoQuestion> {
    grade(question: EssaySemiAutoQuestion, answer: unknown): GradeResult {
        const studentAnswer = typeof answer === 'string' ? answer : '';
        const normalizedAnswer = normalizeLooseText(studentAnswer);
        const normalizedLength = normalizeText(studentAnswer).length;

        const rubricItems: RubricScore[] = question.rubric.map((item) => {
            const keywordHit = (item.keywords ?? []).some((keyword) =>
                normalizedAnswer.includes(normalizeLooseText(keyword)),
            );
            const phraseHit = (item.requiredPhrases ?? []).every((phrase) =>
                normalizedAnswer.includes(normalizeLooseText(phrase)),
            );
            const satisfied = keywordHit || phraseHit || ((item.keywords ?? []).length === 0 && (item.requiredPhrases ?? []).length === 0);

            return {
                code: item.code,
                label: item.label,
                earned: satisfied ? item.weight : 0,
                max: item.weight,
                comment: satisfied ? '충족' : '보완 필요',
            };
        });

        let earned = rubricItems.reduce((sum, item) => sum + item.earned, 0);
        if (question.minLength && normalizedLength < question.minLength) {
            earned = Math.min(earned, Math.floor(question.points * 0.5));
        }
        earned = clampScore(earned, question.points);

        const threshold = question.passingThreshold ?? Math.ceil(question.points * 0.7);
        return createBaseResult(question, answer, {
            earned,
            isCorrect: earned >= threshold,
            feedback: `루브릭 점수 ${earned}/${question.points}`,
            feedbackCode: earned >= threshold ? 'rubric_pass' : 'rubric_evidence_missing',
            rubricItems,
            normalizedAnswer,
            requiresTeacherReview: true,
            reviewStatus: 'pending_review',
        });
    }
}

export const sampleQuestions: AssessmentQuestion[] = [
    {
        id: 'mc-1',
        type: 'multiple_choice',
        gradingMode: 'auto',
        prompt: 'What does the word "radiant" most nearly mean?',
        points: 5,
        options: ['A. dark', 'B. bright', 'C. hidden', 'D. cold'],
        correctAnswer: 'B',
        skillCodes: ['vocab.inference'],
    },
    {
        id: 'tf-1',
        type: 'true_false',
        gradingMode: 'auto',
        prompt: 'Fern saves Wilbur at the beginning of the story.',
        points: 3,
        correctAnswer: true,
        skillCodes: ['reading.detail'],
    },
    {
        id: 'fib-1',
        type: 'fill_in_blank',
        gradingMode: 'auto',
        prompt: 'Charlotte is a ___ and Wilbur is a ___.',
        points: 6,
        blanks: [
            { answers: ['spider'], weight: 1 },
            { answers: ['pig'], weight: 1 },
        ],
        skillCodes: ['reading.detail'],
    },
    {
        id: 'sa-1',
        type: 'short_answer',
        gradingMode: 'auto',
        prompt: 'Why did Fern protect Wilbur? Use at least two key ideas.',
        points: 8,
        minLength: 20,
        keywords: [
            { value: 'small', weight: 1, required: true },
            { value: 'kill', weight: 1, required: true },
            { value: 'care', weight: 1 },
            { value: 'baby pig', weight: 1 },
        ],
        skillCodes: ['reading.reasoning'],
    },
    {
        id: 'essay-1',
        type: 'essay_semi_auto',
        gradingMode: 'semi_auto',
        prompt: 'Explain how Charlotte changes Wilbur throughout the story.',
        points: 10,
        minLength: 60,
        passingThreshold: 7,
        rubric: [
            { code: 'concept_friendship', label: 'friendship', weight: 3, keywords: ['friendship', 'friend'] },
            { code: 'concept_confidence', label: 'confidence', weight: 3, keywords: ['confidence', 'brave', 'special'] },
            { code: 'evidence_examples', label: 'supporting evidence', weight: 4, keywords: ['word', 'web', 'humble', 'radiant'] },
        ],
        skillCodes: ['reading.theme', 'writing.evidence'],
    },
];

export function normalizeMultiSelectAnswer(answer: unknown): string[] {
    if (!Array.isArray(answer)) {
        return [];
    }
    return normalizeStringArray(answer.filter((value): value is string => typeof value === 'string'));
}


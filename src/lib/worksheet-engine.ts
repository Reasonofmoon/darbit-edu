import type {
    FillQuestion,
    FSWorksheet,
    FSWorksheetAttempt,
    Grade,
    MCQuestion,
    Question,
    QuestionResult,
    ShortAnswerQuestion,
    TrueFalseQuestion,
} from './firestore-types';
import { gradeWorksheetWithEngine } from './grading';

export type StudentAnswers = Record<string, string | boolean>;

function normalizeText(value: string): string {
    return value.trim().toLowerCase();
}

function toFinitePoints(value: number): number {
    return Number.isFinite(value) ? value : 0;
}

/**
 * Grades a multiple-choice question by comparing the selected option with the correct answer.
 */
export function gradeMultipleChoice(q: MCQuestion, answer: string): QuestionResult {
    const normalizedAnswer = normalizeText(answer);
    const normalizedCorrect = normalizeText(q.correctAnswer);
    const isCorrect = normalizedAnswer === normalizedCorrect;
    const max = toFinitePoints(q.points);

    return {
        questionId: q.id,
        earned: isCorrect ? max : 0,
        max,
        isCorrect,
        studentAnswer: answer,
        feedback: isCorrect ? '✅ 정답입니다!' : `❌ 오답. 정답: ${q.correctAnswer}`,
    };
}

/**
 * Grades a fill-in-the-blank question and awards rounded partial credit by blank accuracy.
 */
export function gradeFillInBlank(q: FillQuestion, answers: string[]): QuestionResult {
    const correctCount = q.blanks.reduce((count, blank, index) => {
        const submitted = answers[index] ?? '';
        return normalizeText(submitted) === normalizeText(blank) ? count + 1 : count;
    }, 0);
    const total = q.blanks.length;
    const max = toFinitePoints(q.points);
    const earned = total > 0 ? Math.round((correctCount / total) * max) : 0;

    return {
        questionId: q.id,
        earned,
        max,
        isCorrect: total > 0 && correctCount === total,
        studentAnswer: answers.join(' | '),
        feedback: `빈칸 ${correctCount}/${total} 정답`,
    };
}

/**
 * Grades a short-answer question by checking how many target keywords appear in the response.
 */
export function gradeShortAnswer(q: ShortAnswerQuestion, answer: string): QuestionResult {
    const normalizedAnswer = answer.toLowerCase();
    const matchedKeywords = q.keywords.reduce((count, keyword) => {
        return normalizedAnswer.includes(keyword.toLowerCase()) ? count + 1 : count;
    }, 0);
    const total = q.keywords.length;
    const max = toFinitePoints(q.points);
    const earned = total > 0 ? Math.round((matchedKeywords / total) * max) : 0;

    return {
        questionId: q.id,
        earned,
        max,
        isCorrect: total > 0 && matchedKeywords === total,
        studentAnswer: answer,
        feedback: `핵심 키워드 ${matchedKeywords}/${total} 포함`,
    };
}

/**
 * Grades a true/false question by exact boolean match.
 */
export function gradeTrueFalse(q: TrueFalseQuestion, answer: boolean): QuestionResult {
    const isCorrect = q.correct === answer;
    const max = toFinitePoints(q.points);

    return {
        questionId: q.id,
        earned: isCorrect ? max : 0,
        max,
        isCorrect,
        studentAnswer: answer,
        feedback: isCorrect ? '✅ 정답' : `❌ 오답. 정답: ${q.correct ? 'True' : 'False'}`,
    };
}

function gradeQuestion(question: Question, rawAnswer: string | boolean | undefined): QuestionResult {
    switch (question.type) {
        case 'multiple_choice':
            return gradeMultipleChoice(question, typeof rawAnswer === 'string' ? rawAnswer : '');
        case 'fill_in_blank': {
            const answers =
                typeof rawAnswer === 'string'
                    ? rawAnswer.split('|').map((part) => part.trim())
                    : [];
            return gradeFillInBlank(question, answers);
        }
        case 'short_answer':
            return gradeShortAnswer(question, typeof rawAnswer === 'string' ? rawAnswer : '');
        case 'true_false':
            return gradeTrueFalse(question, typeof rawAnswer === 'boolean' ? rawAnswer : false);
        default: {
            const exhaustive: never = question;
            throw new Error(`Unsupported question type: ${String(exhaustive)}`);
        }
    }
}

function toGrade(percentage: number): Grade {
    if (percentage >= 90) {
        return 'A';
    }
    if (percentage >= 80) {
        return 'B';
    }
    if (percentage >= 70) {
        return 'C';
    }
    if (percentage >= 60) {
        return 'D';
    }
    return 'F';
}

/**
 * Grades an entire worksheet attempt and returns a Firestore-ready attempt payload.
 */
export function gradeWorksheet(
    worksheet: FSWorksheet,
    answers: StudentAnswers,
    studentId: string,
    timeSec: number,
    studentName: string = '',
): Omit<FSWorksheetAttempt, 'id'> {
    return gradeWorksheetWithEngine(worksheet, answers, studentId, timeSec, studentName);
}

/**
 * Formats milliseconds as an ISO 8601 duration using hours, minutes, and seconds.
 */
export function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `PT${hours}H${minutes}M${seconds}S`;
    }
    if (minutes > 0) {
        return `PT${minutes}M${seconds}S`;
    }
    return `PT${seconds}S`;
}

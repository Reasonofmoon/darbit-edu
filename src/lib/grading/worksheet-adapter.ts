import type {
    FillQuestion,
    FSWorksheet,
    FSWorksheetAttempt,
    MCQuestion,
    Question,
    QuestionResult,
    ShortAnswerQuestion,
    TrueFalseQuestion,
} from '../firestore-types';
import type {
    AnswerMap,
    AssessmentQuestion,
    EssaySemiAutoQuestion,
    FillBlankQuestion,
    GradeContext,
    MultipleChoiceQuestion,
    ShortAnswerQuestion as EngineShortAnswerQuestion,
    TrueFalseQuestion as EngineTrueFalseQuestion,
} from '../grading-types';
import { GradingEngine } from './engine';

export type WorksheetStudentAnswers = Record<string, string | boolean>;

function toMultipleChoiceQuestion(question: MCQuestion): MultipleChoiceQuestion {
    return {
        id: question.id,
        type: 'multiple_choice',
        gradingMode: 'auto',
        prompt: question.question,
        points: question.points,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
    };
}

function toFillBlankQuestion(question: FillQuestion): FillBlankQuestion {
    return {
        id: question.id,
        type: 'fill_in_blank',
        gradingMode: 'auto',
        prompt: question.question,
        points: question.points,
        blanks: question.blanks.map((answer) => ({ answers: [answer], weight: 1 })),
    };
}

function toShortAnswerQuestion(question: ShortAnswerQuestion): EngineShortAnswerQuestion {
    return {
        id: question.id,
        type: 'short_answer',
        gradingMode: 'auto',
        prompt: question.question,
        points: question.points,
        keywords: question.keywords.map((value) => ({ value, weight: 1 })),
    };
}

function toTrueFalseQuestion(question: TrueFalseQuestion): EngineTrueFalseQuestion {
    return {
        id: question.id,
        type: 'true_false',
        gradingMode: 'auto',
        prompt: question.statement,
        points: question.points,
        correctAnswer: question.correct,
        explanation: question.explanation,
    };
}

function toAssessmentQuestion(question: Question): AssessmentQuestion {
    switch (question.type) {
        case 'multiple_choice':
            return toMultipleChoiceQuestion(question);
        case 'fill_in_blank':
            return toFillBlankQuestion(question);
        case 'short_answer':
            return toShortAnswerQuestion(question);
        case 'true_false':
            return toTrueFalseQuestion(question);
        default: {
            const exhaustive: never = question;
            throw new Error(`Unsupported worksheet question type: ${String(exhaustive)}`);
        }
    }
}

function toQuestionResult(result: ReturnType<GradingEngine['gradeQuestion']>): QuestionResult {
    return {
        questionId: result.questionId,
        earned: result.earned,
        max: result.max,
        isCorrect: result.isCorrect,
        studentAnswer:
            typeof result.studentAnswer === 'boolean'
                ? result.studentAnswer
                : String(result.studentAnswer ?? ''),
        feedback: result.feedback,
    };
}

export function toWorksheetAnswerMap(answers: WorksheetStudentAnswers): AnswerMap {
    return { ...answers };
}

export function gradeWorksheetWithEngine(
    worksheet: FSWorksheet,
    answers: WorksheetStudentAnswers,
    studentId: string,
    timeSec: number,
    studentName: string = '',
): Omit<FSWorksheetAttempt, 'id'> {
    const engine = new GradingEngine();
    const questions = worksheet.questions.map((question) => toAssessmentQuestion(question));
    const context: GradeContext = {
        studentId,
        assessmentId: worksheet.id,
        attemptId: `${worksheet.id}_${studentId}_${Date.now()}`,
        attemptNumber: 1,
        submittedAt: new Date().toISOString(),
        timeSec,
    };
    const graded = engine.gradeAssessment(questions, toWorksheetAnswerMap(answers), context);

    return {
        worksheetId: worksheet.id,
        studentId,
        studentName: studentName || studentId,
        score: graded.totalEarned,
        maxScore: graded.totalMax,
        percentage: graded.percentage,
        grade: graded.grade,
        questionResults: graded.results.map((result) => toQuestionResult(result)),
        timeSec,
        submittedAt: graded.submittedAt,
    };
}

export function toEssaySeedQuestion(
    id: string,
    prompt: string,
    points: number,
): EssaySemiAutoQuestion {
    return {
        id,
        type: 'essay_semi_auto',
        gradingMode: 'semi_auto',
        prompt,
        points,
        rubric: [],
    };
}


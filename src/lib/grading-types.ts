export type QuestionType =
    | 'multiple_choice'
    | 'multi_select'
    | 'true_false'
    | 'fill_in_blank'
    | 'short_answer'
    | 'ordering'
    | 'matching'
    | 'essay_semi_auto';

export type GradingMode = 'auto' | 'semi_auto' | 'manual';
export type ScoreAggregation = 'latest' | 'best' | 'average';
export type RevealAnswerMode = 'immediate' | 'after_submit' | 'manual';
export type ReviewStatus = 'auto_graded' | 'pending_review' | 'reviewed';
export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface AttemptPolicy {
    maxAttempts: number | null;
    scoring: ScoreAggregation;
    revealAnswer: RevealAnswerMode;
}

export interface QuestionBase {
    id: string;
    type: QuestionType;
    gradingMode: GradingMode;
    prompt: string;
    points: number;
    difficulty?: number;
    skillCodes?: string[];
    explanation?: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
    type: 'multiple_choice';
    correctAnswer: string;
    options: string[];
}

export interface MultiSelectQuestion extends QuestionBase {
    type: 'multi_select';
    correctAnswers: string[];
    partialPolicy: 'all_or_nothing' | 'proportional' | 'penalty';
    options: string[];
}

export interface TrueFalseQuestion extends QuestionBase {
    type: 'true_false';
    correctAnswer: boolean;
}

export interface FillBlankQuestion extends QuestionBase {
    type: 'fill_in_blank';
    blanks: Array<{
        answers: string[];
        weight?: number;
    }>;
}

export interface ShortAnswerQuestion extends QuestionBase {
    type: 'short_answer';
    keywords: Array<{
        value: string;
        weight: number;
        required?: boolean;
    }>;
    minLength?: number;
}

export interface OrderingQuestion extends QuestionBase {
    type: 'ordering';
    correctOrder: string[];
}

export interface MatchingQuestion extends QuestionBase {
    type: 'matching';
    pairs: Array<{
        left: string;
        right: string;
    }>;
}

export interface EssaySemiAutoQuestion extends QuestionBase {
    type: 'essay_semi_auto';
    rubric: Array<{
        code: string;
        label: string;
        weight: number;
        keywords?: string[];
        requiredPhrases?: string[];
    }>;
    minLength?: number;
    passingThreshold?: number;
}

export type AssessmentQuestion =
    | MultipleChoiceQuestion
    | MultiSelectQuestion
    | TrueFalseQuestion
    | FillBlankQuestion
    | ShortAnswerQuestion
    | OrderingQuestion
    | MatchingQuestion
    | EssaySemiAutoQuestion;

export interface GradeContext {
    studentId: string;
    assessmentId: string;
    attemptId: string;
    submittedAt: string;
    attemptNumber: number;
    timeSec?: number;
}

export interface RubricScore {
    code: string;
    label: string;
    earned: number;
    max: number;
    comment?: string;
}

export interface GradeResult {
    questionId: string;
    type: QuestionType;
    earned: number;
    max: number;
    isCorrect: boolean;
    confidence: number;
    feedback: string;
    feedbackCode?: string;
    rubricItems?: RubricScore[];
    studentAnswer: unknown;
    normalizedAnswer?: unknown;
    meta?: Record<string, unknown>;
    autoGraded: boolean;
    requiresTeacherReview: boolean;
    reviewStatus: ReviewStatus;
}

export interface AssessmentGradeResult {
    attemptId: string;
    studentId: string;
    totalEarned: number;
    totalMax: number;
    percentage: number;
    grade: LetterGrade;
    results: GradeResult[];
    improvementScore?: number;
    submittedAt: string;
}

export type AnswerMap = Record<string, unknown>;

export interface StoredAttemptAnswer {
    id: string;
    attemptId: string;
    questionId: string;
    rawAnswer: unknown;
    normalizedAnswer?: unknown;
    answeredAt: string;
}

export interface StoredGradingResult {
    id: string;
    attemptId: string;
    questionId: string;
    autoScore: number;
    teacherScore?: number;
    finalScore: number;
    maxScore: number;
    isCorrect: boolean;
    confidence: number;
    autoGraded: boolean;
    requiresTeacherReview: boolean;
    reviewStatus: ReviewStatus;
    feedback: string;
    feedbackCode?: string;
    rubricItems?: RubricScore[];
    gradedAt: string;
    reviewedAt?: string;
}

export interface StoredFeedbackItem {
    id: string;
    attemptId: string;
    questionId: string;
    code: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    createdAt: string;
}


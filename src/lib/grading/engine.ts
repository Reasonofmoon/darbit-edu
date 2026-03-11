import type {
    AnswerMap,
    AssessmentGradeResult,
    AssessmentQuestion,
    GradeContext,
    GradeResult,
    QuestionType,
} from '../grading-types';
import {
    EssaySemiAutoGrader,
    FillBlankGrader,
    MultipleChoiceGrader,
    QuestionGrader,
    ShortAnswerGrader,
    TrueFalseGrader,
} from './graders';
import { toLetterGrade } from './normalizers';

export class GradingEngine {
    private readonly graders: Partial<Record<QuestionType, QuestionGrader>> = {
        multiple_choice: new MultipleChoiceGrader(),
        true_false: new TrueFalseGrader(),
        fill_in_blank: new FillBlankGrader(),
        short_answer: new ShortAnswerGrader(),
        essay_semi_auto: new EssaySemiAutoGrader(),
    };

    gradeQuestion(question: AssessmentQuestion, answer: unknown, context: GradeContext): GradeResult {
        const grader = this.graders[question.type];
        if (!grader) {
            throw new Error(`Unsupported question type: ${question.type}`);
        }
        return grader.grade(question as never, answer, context);
    }

    gradeAssessment(
        questions: AssessmentQuestion[],
        answers: AnswerMap,
        context: GradeContext,
    ): AssessmentGradeResult {
        const results = questions.map((question) =>
            this.gradeQuestion(question, answers[question.id], context),
        );
        const totalEarned = results.reduce((sum, result) => sum + result.earned, 0);
        const totalMax = results.reduce((sum, result) => sum + result.max, 0);
        const percentage = totalMax > 0 ? Number(((totalEarned / totalMax) * 100).toFixed(1)) : 0;

        return {
            attemptId: context.attemptId,
            studentId: context.studentId,
            totalEarned,
            totalMax,
            percentage,
            grade: toLetterGrade(percentage),
            results,
            submittedAt: context.submittedAt,
        };
    }
}


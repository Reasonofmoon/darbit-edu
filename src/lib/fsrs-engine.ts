import { createEmptyCard, fsrs, Rating } from 'ts-fsrs';

import type { FSVocabCard, FSRSState } from './firestore-types';

type ReviewRating = 1 | 2 | 3 | 4;

function toDate(value: string | undefined): Date | undefined {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toFSRSState(card: {
    due: Date;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: 0 | 1 | 2 | 3;
    last_review?: Date;
}): FSRSState {
    return {
        due: card.due.toISOString(),
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state,
        last_review: card.last_review?.toISOString(),
    };
}

function toSchedulerCard(state: FSRSState) {
    return {
        due: new Date(state.due),
        stability: state.stability,
        difficulty: state.difficulty,
        elapsed_days: state.elapsed_days,
        scheduled_days: state.scheduled_days,
        reps: state.reps,
        lapses: state.lapses,
        state: state.state,
        last_review: toDate(state.last_review),
    };
}

function toFsrsRating(rating: ReviewRating): ReviewRating {
    switch (rating) {
        case 1:
            return Rating.Again as ReviewRating;
        case 2:
            return Rating.Hard as ReviewRating;
        case 3:
            return Rating.Good as ReviewRating;
        case 4:
            return Rating.Easy as ReviewRating;
        default:
            return Rating.Good as ReviewRating;
    }
}

/**
 * Creates a new vocabulary card with an initial FSRS state suitable for Firestore.
 */
export function createVocabCard(data: {
    word: string;
    definition: string;
    partOfSpeech: string;
    contextSentence: string;
    bookId: string;
    bookTitle: string;
    studentId: string;
}): Omit<FSVocabCard, 'id'> {
    const now = new Date();
    const emptyCard = createEmptyCard(now);

    return {
        ...data,
        fsrsState: {
            due: now.toISOString(),
            stability: 0,
            difficulty: 5,
            elapsed_days: 0,
            scheduled_days: 0,
            reps: emptyCard.reps,
            lapses: emptyCard.lapses,
            state: 0,
        },
        createdAt: now.toISOString(),
    };
}

/**
 * Reviews a vocabulary card with an FSRS rating and returns the next scheduled state.
 */
export function reviewCard(
    card: FSVocabCard,
    rating: ReviewRating,
): { updatedState: FSRSState; intervalDays: number; nextReview: Date } {
    const scheduler = fsrs();
    const now = new Date();
    const record = scheduler.repeat(toSchedulerCard(card.fsrsState), now);
    const scheduled = record[toFsrsRating(rating)].card;
    const updatedState = toFSRSState({
        ...scheduled,
        state: scheduled.state as 0 | 1 | 2 | 3,
    });

    return {
        updatedState,
        intervalDays: scheduled.scheduled_days,
        nextReview: scheduled.due,
    };
}

/**
 * Returns cards whose review due time has passed, sorted by the oldest due date first.
 */
export function getDueCards(cards: FSVocabCard[]): FSVocabCard[] {
    const now = Date.now();

    return [...cards]
        .filter((card) => new Date(card.fsrsState.due).getTime() <= now)
        .sort((a, b) => new Date(a.fsrsState.due).getTime() - new Date(b.fsrsState.due).getTime());
}

/**
 * Aggregates study statistics from a collection of vocabulary cards.
 */
export function getStudyStats(cards: FSVocabCard[]): {
    total: number;
    dueToday: number;
    learned: number;
    mastered: number;
    retentionRate: number;
} {
    const total = cards.length;
    const dueToday = getDueCards(cards).length;
    const learned = cards.filter((card) => card.fsrsState.reps >= 1).length;
    const mastered = cards.filter((card) => card.fsrsState.stability >= 21).length;
    const retentionRate = total === 0 ? 0 : Math.round((mastered / total) * 100);

    return {
        total,
        dueToday,
        learned,
        mastered,
        retentionRate,
    };
}

/**
 * Maps an FSRS learning state to a UI badge label.
 */
export function getCardBadgeLabel(state: 0 | 1 | 2 | 3): string {
    switch (state) {
        case 0:
            return '신규';
        case 1:
            return '학습중';
        case 2:
            return '복습';
        case 3:
            return '재학습';
        default:
            return '신규';
    }
}

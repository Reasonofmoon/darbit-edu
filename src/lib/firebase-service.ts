/**
 * Firebase Firestore 서비스 레이어
 * 모든 컬렉션의 CRUD 헬퍼 함수
 */
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
    FSBook,
    FSCheckout,
    FSReadingProgress,
    FSAnnotation,
    FSVocabCard,
    FSWorksheet,
    FSWorksheetAttempt,
    FSClass,
    FSUser,
} from './firestore-types';
import type {
    AssessmentGradeResult,
    AnswerMap,
    StoredAttemptAnswer,
    StoredFeedbackItem,
    StoredGradingResult,
} from './grading-types';

// ── 유틸 ──────────────────────────────────────────────
function toISO(val: unknown): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
}

function col(path: string) {
    return collection(db(), path);
}

// ── 사용자 ──────────────────────────────────────────
export const userService = {
    async get(uid: string): Promise<FSUser | null> {
        const snap = await getDoc(doc(db(), 'users', uid));
        if (!snap.exists()) return null;
        const d = snap.data();
        return { ...d, id: snap.id, createdAt: toISO(d.createdAt), lastActiveAt: toISO(d.lastActiveAt) } as FSUser;
    },

    async upsert(uid: string, data: Partial<FSUser>): Promise<void> {
        await setDoc(doc(db(), 'users', uid), {
            ...data,
            lastActiveAt: serverTimestamp(),
        }, { merge: true });
    },

    async listByClass(className: string): Promise<FSUser[]> {
        const q = query(col('users'), where('className', '==', className), where('role', '==', 'student'));
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSUser));
    },
};

// ── 원서 ──────────────────────────────────────────────
export const bookService = {
    async list(): Promise<FSBook[]> {
        const snaps = await getDocs(col('books'));
        return snaps.docs.map(s => ({ ...s.data(), id: s.id, createdAt: toISO((s.data() as FSBook).createdAt) } as FSBook));
    },

    async get(bookId: string): Promise<FSBook | null> {
        const snap = await getDoc(doc(db(), 'books', bookId));
        if (!snap.exists()) return null;
        return { ...snap.data(), id: snap.id } as FSBook;
    },

    async create(data: Omit<FSBook, 'id' | 'createdAt'>): Promise<string> {
        const ref = await addDoc(col('books'), { ...data, createdAt: serverTimestamp() });
        return ref.id;
    },

    async update(bookId: string, data: Partial<FSBook>): Promise<void> {
        await updateDoc(doc(db(), 'books', bookId), data);
    },

    async updateAvailability(bookId: string, delta: number): Promise<void> {
        const book = await bookService.get(bookId);
        if (!book) return;
        const newAvailable = Math.max(0, Math.min(book.copies, book.available + delta));
        await updateDoc(doc(db(), 'books', bookId), { available: newAvailable });
    },
};

// ── 도서 대출 ─────────────────────────────────────────
export const checkoutService = {
    async listActive(): Promise<FSCheckout[]> {
        const q = query(col('checkouts'), where('returned', '==', false), orderBy('dueDate', 'asc'));
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSCheckout));
    },

    async listByStudent(studentId: string): Promise<FSCheckout[]> {
        const q = query(col('checkouts'), where('studentId', '==', studentId));
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSCheckout));
    },

    async create(data: Omit<FSCheckout, 'id'>): Promise<string> {
        const ref = await addDoc(col('checkouts'), data);
        // 재고 감소
        await bookService.updateAvailability(data.bookId, -1);
        return ref.id;
    },

    async returnBook(checkoutId: string, bookId: string): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        await updateDoc(doc(db(), 'checkouts', checkoutId), {
            returned: true,
            returnedDate: today,
        });
        // 재고 증가
        await bookService.updateAvailability(bookId, +1);
    },
};

// ── 읽기 진도 ─────────────────────────────────────────
export const readingService = {
    async get(studentId: string, bookId: string): Promise<FSReadingProgress | null> {
        const id = `${studentId}_${bookId}`;
        const snap = await getDoc(doc(db(), 'readingProgress', id));
        if (!snap.exists()) return null;
        return { ...snap.data(), id: snap.id } as FSReadingProgress;
    },

    async upsert(studentId: string, bookId: string, data: Partial<FSReadingProgress>): Promise<void> {
        const id = `${studentId}_${bookId}`;
        await setDoc(doc(db(), 'readingProgress', id), {
            studentId,
            bookId,
            ...data,
            lastReadAt: new Date().toISOString(),
        }, { merge: true });
    },

    async listByStudent(studentId: string): Promise<FSReadingProgress[]> {
        const q = query(col('readingProgress'), where('studentId', '==', studentId));
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSReadingProgress));
    },

    async listByBook(bookId: string): Promise<FSReadingProgress[]> {
        const q = query(col('readingProgress'), where('bookId', '==', bookId));
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSReadingProgress));
    },
};

// ── 하이라이트/주석 ───────────────────────────────────
export const annotationService = {
    async listByStudent(studentId: string, bookId?: string): Promise<FSAnnotation[]> {
        const constraints: QueryConstraint[] = [where('studentId', '==', studentId)];
        if (bookId) constraints.push(where('bookId', '==', bookId));
        const q = query(col('annotations'), ...constraints, orderBy('createdAt', 'desc'));
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSAnnotation));
    },

    async create(data: Omit<FSAnnotation, 'id'>): Promise<string> {
        const ref = await addDoc(col('annotations'), {
            ...data,
            createdAt: new Date().toISOString(),
        });
        return ref.id;
    },

    async delete(annotationId: string): Promise<void> {
        await deleteDoc(doc(db(), 'annotations', annotationId));
    },
};

// ── 어휘 카드 (FSRS) ──────────────────────────────────
export const vocabService = {
    async listByStudent(studentId: string): Promise<FSVocabCard[]> {
        const q = query(col('vocab'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSVocabCard));
    },

    async getDueToday(studentId: string): Promise<FSVocabCard[]> {
        const today = new Date().toISOString().split('T')[0];
        const q = query(
            col('vocab'),
            where('studentId', '==', studentId),
            where('fsrsState.due', '<=', today + 'T23:59:59.999Z'),
        );
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSVocabCard));
    },

    async create(data: Omit<FSVocabCard, 'id'>): Promise<string> {
        const ref = await addDoc(col('vocab'), data);
        return ref.id;
    },

    async updateFSRS(cardId: string, fsrsState: FSVocabCard['fsrsState']): Promise<void> {
        await updateDoc(doc(db(), 'vocab', cardId), { fsrsState });
    },
};

// ── 워크시트 ──────────────────────────────────────────
export const worksheetService = {
    async list(filters?: { bookId?: string; teacherId?: string }): Promise<FSWorksheet[]> {
        const constraints: QueryConstraint[] = [];
        if (filters?.bookId) constraints.push(where('bookId', '==', filters.bookId));
        if (filters?.teacherId) constraints.push(where('teacherId', '==', filters.teacherId));
        constraints.push(orderBy('createdAt', 'desc'));
        const q = query(col('worksheets'), ...constraints);
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSWorksheet));
    },

    async get(worksheetId: string): Promise<FSWorksheet | null> {
        const snap = await getDoc(doc(db(), 'worksheets', worksheetId));
        if (!snap.exists()) return null;
        return { ...snap.data(), id: snap.id } as FSWorksheet;
    },

    async create(data: Omit<FSWorksheet, 'id' | 'createdAt'>): Promise<string> {
        const ref = await addDoc(col('worksheets'), {
            ...data,
            createdAt: new Date().toISOString(),
        });
        return ref.id;
    },

    async saveAttempt(data: Omit<FSWorksheetAttempt, 'id'>): Promise<string> {
        const ref = await addDoc(col('worksheetAttempts'), data);
        return ref.id;
    },

    async listAttempts(worksheetId: string, studentId?: string): Promise<FSWorksheetAttempt[]> {
        const constraints: QueryConstraint[] = [where('worksheetId', '==', worksheetId)];
        if (studentId) constraints.push(where('studentId', '==', studentId));
        const q = query(col('worksheetAttempts'), ...constraints, orderBy('submittedAt', 'desc'));
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSWorksheetAttempt));
    },

    async listAttemptsByStudent(studentId: string, limitCount = 10): Promise<FSWorksheetAttempt[]> {
        const q = query(
            col('worksheetAttempts'),
            where('studentId', '==', studentId),
            orderBy('submittedAt', 'desc'),
            limit(limitCount),
        );
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSWorksheetAttempt));
    },
};

// ── 평가 채점 결과 ───────────────────────────────────
export const gradingService = {
    async saveAttemptAnswers(attemptId: string, answers: AnswerMap): Promise<string[]> {
        const entries = Object.entries(answers);
        const ids = await Promise.all(entries.map(async ([questionId, rawAnswer]) => {
            const ref = await addDoc(col('attemptAnswers'), {
                attemptId,
                questionId,
                rawAnswer,
                normalizedAnswer: rawAnswer,
                answeredAt: new Date().toISOString(),
            });
            return ref.id;
        }));
        return ids;
    },

    async saveAssessmentResult(result: AssessmentGradeResult): Promise<string[]> {
        const ids = await Promise.all(result.results.map(async (item) => {
            const ref = await addDoc(col('gradingResults'), {
                attemptId: result.attemptId,
                questionId: item.questionId,
                autoScore: item.earned,
                finalScore: item.earned,
                maxScore: item.max,
                isCorrect: item.isCorrect,
                confidence: item.confidence,
                autoGraded: item.autoGraded,
                requiresTeacherReview: item.requiresTeacherReview,
                reviewStatus: item.reviewStatus,
                feedback: item.feedback,
                feedbackCode: item.feedbackCode,
                rubricItems: item.rubricItems ?? [],
                gradedAt: result.submittedAt,
            });
            return ref.id;
        }));
        return ids;
    },

    async saveFeedbackItems(items: Omit<StoredFeedbackItem, 'id'>[]): Promise<string[]> {
        const ids = await Promise.all(items.map(async (item) => {
            const ref = await addDoc(col('feedbackItems'), item);
            return ref.id;
        }));
        return ids;
    },

    async listAttemptAnswers(attemptId: string): Promise<StoredAttemptAnswer[]> {
        const q = query(col('attemptAnswers'), where('attemptId', '==', attemptId), orderBy('answeredAt', 'asc'));
        const snaps = await getDocs(q);
        return snaps.docs.map((snap) => ({ ...snap.data(), id: snap.id } as StoredAttemptAnswer));
    },

    async listGradingResults(attemptId: string): Promise<StoredGradingResult[]> {
        const q = query(col('gradingResults'), where('attemptId', '==', attemptId), orderBy('gradedAt', 'asc'));
        const snaps = await getDocs(q);
        return snaps.docs.map((snap) => ({ ...snap.data(), id: snap.id } as StoredGradingResult));
    },
};

// ── 반 관리 ──────────────────────────────────────────
export const classService = {
    async listByTeacher(teacherId: string): Promise<FSClass[]> {
        const q = query(col('classes'), where('teacherId', '==', teacherId));
        const snaps = await getDocs(q);
        return snaps.docs.map(s => ({ ...s.data(), id: s.id } as FSClass));
    },

    async get(classId: string): Promise<FSClass | null> {
        const snap = await getDoc(doc(db(), 'classes', classId));
        if (!snap.exists()) return null;
        return { ...snap.data(), id: snap.id } as FSClass;
    },
};

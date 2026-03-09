/**
 * Firestore 컬렉션 타입 정의
 * dalbit-edu 영어원서 독서 + 워크시트 + 어휘 플랫폼
 */

// ── 사용자 ──────────────────────────────────────────
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface FSUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    className?: string;       // 학생용: 소속 반
    photoURL?: string;
    createdAt: string;        // ISO
    lastActiveAt: string;
}

// ── 원서 ──────────────────────────────────────────────
export type BookLevel = 'A1' | 'A1-A2' | 'A2' | 'A2-B1' | 'B1' | 'B1-B2' | 'B2' | 'C1';

export interface FSBook {
    id: string;
    title: string;
    author: string;
    level: BookLevel;
    genre: string;
    isbn?: string;
    epubUrl?: string;         // Firebase Storage URL (EPUB 파일)
    coverUrl?: string;        // 커버 이미지 URL
    coverEmoji?: string;      // 이모지 대체 커버 (로컬 더미용)
    copies: number;           // 물리적 보유 권수
    available: number;        // 대출 가능 수
    wordCount?: number;
    createdAt: string;
}

// ── 도서 대출 ─────────────────────────────────────────
export interface FSCheckout {
    id: string;
    bookId: string;
    studentId: string;
    studentName: string;
    studentClass: string;
    checkedOut: string;       // YYYY-MM-DD
    dueDate: string;
    returned: boolean;
    returnedDate?: string;
}

// ── 읽기 진도 ─────────────────────────────────────────
export interface FSReadingProgress {
    id: string;               // `${studentId}_${bookId}`
    studentId: string;
    bookId: string;
    cfiPosition?: string;     // epub.js CFI
    progressPercent: number;  // 0~100
    totalReadingSeconds: number;
    lastReadAt: string;
    completed: boolean;
}

// ── 하이라이트/주석 ───────────────────────────────────
export type AnnotationType = 'highlight' | 'note' | 'question';

export interface FSAnnotation {
    id: string;
    studentId: string;
    bookId: string;
    cfiStart?: string;
    cfiEnd?: string;
    highlightedText: string;
    note?: string;
    type: AnnotationType;
    color?: 'yellow' | 'green' | 'blue' | 'pink';
    isPublic: boolean;        // 반 공유 여부
    createdAt: string;
}

// ── 어휘 카드 (FSRS) ──────────────────────────────────
export interface FSRSState {
    due: string;              // ISO date — 다음 복습일
    stability: number;        // 기억 안정성 (일 단위)
    difficulty: number;       // 난이도 (1~10)
    elapsed_days: number;
    scheduled_days: number;
    reps: number;             // 총 복습 횟수
    lapses: number;           // 망각 횟수
    state: 0 | 1 | 2 | 3;    // New/Learning/Review/Relearning
    last_review?: string;
}

export interface FSVocabCard {
    id: string;
    studentId: string;
    bookId: string;
    bookTitle: string;
    word: string;
    definition: string;       // 한국어 뜻
    partOfSpeech: string;     // noun, verb, adj, adv, etc.
    contextSentence: string;  // 원서에서 추출한 예문
    pronunciation?: string;   // /ˈsæl.jʊ.teɪ.ʃən/
    fsrsState: FSRSState;
    createdAt: string;
}

// ── 워크시트 ──────────────────────────────────────────
export type QuestionType = 'multiple_choice' | 'fill_in_blank' | 'short_answer' | 'true_false';
export type WorksheetType = 'ai_generated' | 'teacher_made' | 'template';

export interface MCQuestion {
    id: string;
    type: 'multiple_choice';
    question: string;
    options: string[];          // ['A. ...', 'B. ...', 'C. ...', 'D. ...']
    correctAnswer: string;      // 'A' | 'B' | 'C' | 'D'
    explanation?: string;
    points: number;
}

export interface FillQuestion {
    id: string;
    type: 'fill_in_blank';
    question: string;           // "The ___ swam in the ___."
    blanks: string[];           // 허용 정답 목록 (각 빈칸)
    points: number;
}

export interface ShortAnswerQuestion {
    id: string;
    type: 'short_answer';
    question: string;
    keywords: string[];         // 핵심 키워드 (부분 점수)
    sampleAnswer?: string;
    points: number;
}

export interface TrueFalseQuestion {
    id: string;
    type: 'true_false';
    statement: string;
    correct: boolean;
    explanation?: string;
    points: number;
}

export type Question = MCQuestion | FillQuestion | ShortAnswerQuestion | TrueFalseQuestion;

export interface FSWorksheet {
    id: string;
    title: string;
    bookId: string;
    bookTitle: string;
    teacherId: string;
    type: WorksheetType;
    grade?: string;             // Elementary / Middle School / High School / Advanced
    questions: Question[];
    totalPoints: number;
    chapterRef?: string;        // 관련 챕터
    createdAt: string;
    isPublished: boolean;
}

// ── 워크시트 풀이 결과 ────────────────────────────────
export interface QuestionResult {
    questionId: string;
    earned: number;
    max: number;
    isCorrect: boolean;
    studentAnswer: string | boolean;
    feedback: string;
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface FSWorksheetAttempt {
    id: string;
    worksheetId: string;
    studentId: string;
    studentName: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade: Grade;
    questionResults: QuestionResult[];
    timeSec: number;
    submittedAt: string;
}

// ── 반 (Class) ──────────────────────────────────────
export interface FSClass {
    id: string;
    name: string;
    teacherId: string;
    teacherName: string;
    studentIds: string[];
    academyId?: string;
    createdAt: string;
}

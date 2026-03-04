// CEFR Level Test Types — ported from darlbit-lv-test-system/rubric_system.py + test_generator.py

export type CEFRLevel = 'PRE-A1' | 'A1' | 'A2' | 'B1' | 'B2';
export type TestSection = 'reading' | 'vocabulary' | 'conversation' | 'grammar' | 'writing';

export interface QuestionOption {
    label: string; // A, B, C, D
    text: string;
}

export interface Question {
    id: string;
    text: string;
    options: QuestionOption[];
    correct: string;
    section: TestSection;
}

export interface WritingQuestion {
    id: string;
    prompt: string;
    section: 'writing';
}

export interface TestSection_Data {
    title: string;
    questions: (Question | WritingQuestion)[];
}

export interface TestData {
    metadata: {
        level: CEFRLevel;
        duration: number;
        generated_at: string;
        total_questions: number;
    };
    sections: Record<string, TestSection_Data>;
    answer_key: Record<string, string>;
}

// 20 Assessment Criteria — exact port from rubric_system.py
export const ASSESSMENT_CRITERIA: Record<string, { criterion: string; description: string; category: string }> = {
    R1: { criterion: 'Main Idea Comprehension', description: 'Identify the main idea of a short text.', category: 'Reading' },
    R2: { criterion: 'Detail Comprehension', description: 'Locate key details within a passage.', category: 'Reading' },
    R3: { criterion: 'Inference Skills', description: 'Infer meaning or intent from context.', category: 'Reading' },
    R4: { criterion: 'Vocabulary in Context', description: 'Interpret vocabulary using textual clues.', category: 'Reading' },
    V1: { criterion: 'Vocabulary Range', description: 'Use a range of level-appropriate words.', category: 'Vocabulary' },
    V2: { criterion: 'Vocabulary Precision', description: 'Choose precise words for meaning.', category: 'Vocabulary' },
    V3: { criterion: 'Collocations and Idioms', description: 'Understand common collocations and idioms.', category: 'Vocabulary' },
    V4: { criterion: 'Word Formation', description: 'Recognize derived forms and affixes.', category: 'Vocabulary' },
    G1: { criterion: 'Sentence Structure', description: 'Construct well-formed sentences.', category: 'Grammar' },
    G2: { criterion: 'Verb Tenses', description: 'Use tenses appropriate to context.', category: 'Grammar' },
    G3: { criterion: 'Subject-Verb Agreement', description: 'Maintain agreement across subjects and verbs.', category: 'Grammar' },
    G4: { criterion: 'Articles and Determiners', description: 'Use articles and determiners accurately.', category: 'Grammar' },
    C1: { criterion: 'Pragmatic Appropriacy', description: 'Select responses suited to context.', category: 'Conversation' },
    C2: { criterion: 'Turn-Taking and Interaction', description: 'Manage turns in dialogue politely.', category: 'Conversation' },
    C3: { criterion: 'Register and Formality', description: 'Match register to the situation.', category: 'Conversation' },
    C4: { criterion: 'Conversational Strategies', description: 'Use repair and clarification strategies.', category: 'Conversation' },
    W1: { criterion: 'Task Achievement', description: 'Address the prompt fully.', category: 'Writing' },
    W2: { criterion: 'Coherence and Cohesion', description: 'Organize ideas logically with linking.', category: 'Writing' },
    W3: { criterion: 'Grammatical Accuracy', description: 'Maintain grammatical control in writing.', category: 'Writing' },
    W4: { criterion: 'Lexical Resource', description: 'Use varied and accurate vocabulary in writing.', category: 'Writing' },
};

// Level config — question counts per section (from test_generator.py LEVEL_CONFIG)
export const LEVEL_CONFIG: Record<CEFRLevel, { duration: number; reading: number; vocabulary: number; conversation: number; grammar: number; writing: number }> = {
    'PRE-A1': { duration: 45, reading: 5, vocabulary: 8, conversation: 5, grammar: 7, writing: 1 },
    'A1': { duration: 50, reading: 6, vocabulary: 10, conversation: 6, grammar: 10, writing: 1 },
    'A2': { duration: 55, reading: 8, vocabulary: 12, conversation: 7, grammar: 10, writing: 1 },
    'B1': { duration: 60, reading: 10, vocabulary: 12, conversation: 8, grammar: 12, writing: 1 },
    'B2': { duration: 60, reading: 12, vocabulary: 15, conversation: 8, grammar: 12, writing: 1 },
};

// Level thresholds for determining CEFR level from total score
export const LEVEL_THRESHOLDS: [CEFRLevel, number][] = [
    ['B2', 71], ['B1', 59], ['A2', 46], ['A1', 31], ['PRE-A1', 0],
];

export function determineLevel(totalScore: number): CEFRLevel {
    for (const [level, cutoff] of LEVEL_THRESHOLDS) {
        if (totalScore >= cutoff) return level;
    }
    return 'PRE-A1';
}

export const LEVEL_COLORS: Record<CEFRLevel, string> = {
    'PRE-A1': '#ef4444',
    'A1': '#f97316',
    'A2': '#eab308',
    'B1': '#22c55e',
    'B2': '#3b82f6',
};

export const LEVEL_DESCRIPTIONS: Record<CEFRLevel, { ko: string; en: string; grade: string }> = {
    'PRE-A1': { ko: '입문', en: 'Basic Beginner', grade: 'K-1.5 grade reading' },
    'A1': { ko: '초급', en: 'Beginner', grade: '1.5-3.5 grade reading' },
    'A2': { ko: '초중급', en: 'Elementary', grade: '3.5-5.0 grade reading' },
    'B1': { ko: '중급', en: 'Intermediate', grade: '5.0-7.0 grade reading' },
    'B2': { ko: '중상급', en: 'Upper Intermediate', grade: '7.0+ grade reading' },
};

export interface TestResult {
    studentName: string;
    level: CEFRLevel;
    date: string;
    answers: Record<string, string>;       // questionId → selected answer
    writingResponse: string;
    scores: {
        reading: number;
        vocabulary: number;
        conversation: number;
        grammar: number;
        writing: number;
        total: number;
        maxTotal: number;
        percentage: number;
    };
    rubricScores: Record<string, number>;   // criterion code → 0-4
    determinedLevel: CEFRLevel;
    recommendations: string[];
}

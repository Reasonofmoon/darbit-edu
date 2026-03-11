# Grading Engine Schema

This document defines a practical MVP schema for the `dalbit-edu` grading engine.

## Core Concepts

- `assessment`: a test, worksheet, or check-up
- `question`: a reusable question definition
- `attempt`: one student's submission session
- `answer`: one student's answer for one question
- `grading_result`: auto-graded and teacher-adjusted score state
- `feedback_item`: structured feedback for analytics and reporting
- `student_mastery`: per-skill rolling proficiency summary

## Firestore Collections

### `assessments`

```ts
{
  id: string;
  title: string;
  mode: 'practice' | 'exam';
  questionIds: string[];
  attemptPolicy: {
    maxAttempts: number | null;
    scoring: 'latest' | 'best' | 'average';
    revealAnswer: 'immediate' | 'after_submit' | 'manual';
  };
  totalPoints: number;
  createdAt: string;
  publishedAt?: string;
}
```

### `questions`

```ts
{
  id: string;
  version: number;
  type: string;
  gradingMode: 'auto' | 'semi_auto' | 'manual';
  prompt: string;
  points: number;
  skillCodes: string[];
  payload: Record<string, unknown>;
  explanation?: string;
  createdAt: string;
  updatedAt: string;
}
```

### `attempts`

```ts
{
  id: string;
  assessmentId: string;
  studentId: string;
  attemptNumber: number;
  status: 'in_progress' | 'submitted' | 'graded' | 'reviewed';
  firstScore?: number;
  latestScore?: number;
  bestScore?: number;
  totalEarned: number;
  totalMax: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  improvementScore?: number;
  timeSec?: number;
  submittedAt: string;
}
```

### `attempt_answers`

```ts
{
  id: string;
  attemptId: string;
  questionId: string;
  rawAnswer: unknown;
  normalizedAnswer?: unknown;
  answeredAt: string;
}
```

### `grading_results`

```ts
{
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
  reviewStatus: 'auto_graded' | 'pending_review' | 'reviewed';
  feedback: string;
  feedbackCode?: string;
  rubricItems?: Array<{
    code: string;
    label: string;
    earned: number;
    max: number;
    comment?: string;
  }>;
  gradedAt: string;
  reviewedAt?: string;
}
```

### `feedback_items`

```ts
{
  id: string;
  attemptId: string;
  questionId: string;
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}
```

### `student_mastery`

```ts
{
  id: string; // `${studentId}_${skillCode}`
  studentId: string;
  skillCode: string;
  masteryScore: number; // 0~100
  recentAverage: number;
  totalAttempts: number;
  lastUpdatedAt: string;
}
```

## PostgreSQL Tables

### `assessments`

```sql
create table assessments (
  id uuid primary key,
  title text not null,
  mode text not null check (mode in ('practice', 'exam')),
  attempt_policy jsonb not null,
  total_points integer not null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);
```

### `questions`

```sql
create table questions (
  id uuid primary key,
  version integer not null default 1,
  type text not null,
  grading_mode text not null check (grading_mode in ('auto', 'semi_auto', 'manual')),
  prompt text not null,
  points integer not null,
  skill_codes text[] not null default '{}',
  payload jsonb not null,
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `assessment_questions`

```sql
create table assessment_questions (
  assessment_id uuid not null references assessments(id) on delete cascade,
  question_id uuid not null references questions(id) on delete restrict,
  sort_order integer not null,
  primary key (assessment_id, question_id)
);
```

### `attempts`

```sql
create table attempts (
  id uuid primary key,
  assessment_id uuid not null references assessments(id) on delete cascade,
  student_id text not null,
  attempt_number integer not null,
  status text not null check (status in ('in_progress', 'submitted', 'graded', 'reviewed')),
  first_score integer,
  latest_score integer,
  best_score integer,
  total_earned integer not null default 0,
  total_max integer not null default 0,
  percentage numeric(5,1) not null default 0,
  grade char(1) not null,
  improvement_score integer,
  time_sec integer,
  submitted_at timestamptz not null
);
```

### `attempt_answers`

```sql
create table attempt_answers (
  id uuid primary key,
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete restrict,
  raw_answer jsonb not null,
  normalized_answer jsonb,
  answered_at timestamptz not null default now()
);
```

### `grading_results`

```sql
create table grading_results (
  id uuid primary key,
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete restrict,
  auto_score integer not null default 0,
  teacher_score integer,
  final_score integer not null default 0,
  max_score integer not null,
  is_correct boolean not null default false,
  confidence numeric(4,2) not null default 1,
  auto_graded boolean not null default true,
  requires_teacher_review boolean not null default false,
  review_status text not null check (review_status in ('auto_graded', 'pending_review', 'reviewed')),
  feedback text not null,
  feedback_code text,
  rubric_items jsonb,
  graded_at timestamptz not null default now(),
  reviewed_at timestamptz
);
```

### `feedback_items`

```sql
create table feedback_items (
  id uuid primary key,
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete restrict,
  code text not null,
  message text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  created_at timestamptz not null default now()
);
```

### `student_mastery`

```sql
create table student_mastery (
  id uuid primary key,
  student_id text not null,
  skill_code text not null,
  mastery_score numeric(5,2) not null default 0,
  recent_average numeric(5,2) not null default 0,
  total_attempts integer not null default 0,
  last_updated_at timestamptz not null default now(),
  unique (student_id, skill_code)
);
```

## Aggregation Rules

- `first_score`: score from first submitted attempt
- `latest_score`: score from latest attempt
- `best_score`: max score across attempts
- `improvement_score`: `latest_score - first_score`
- `mastery_score`: rolling weighted average of recent `skillCodes`

## Implementation Notes

- Use Firestore for fast MVP iteration if the rest of the app stays Firebase-first.
- Use PostgreSQL if you need complex teacher dashboards, cohort analysis, and SQL-based reporting.
- Keep `questions.payload` as JSON so question-type-specific structures stay extensible.


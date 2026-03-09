'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, Send } from 'lucide-react';
import type { FSWorksheet, Question } from '@/lib/firestore-types';

export type StudentAnswers = Record<string, string | boolean>;

interface WorksheetPlayerProps {
    worksheet: FSWorksheet;
    onSubmit: (answers: StudentAnswers, timeSec: number) => void;
    onBack: () => void;
}

// ── 개별 문제 UI ──────────────────────────────────────
function QuestionCard({
    question,
    index,
    answer,
    onChange,
}: {
    question: Question;
    index: number;
    answer: string | boolean | undefined;
    onChange: (id: string, value: string | boolean) => void;
}) {
    const labels = ['A', 'B', 'C', 'D'];

    const baseLabel = (
        <p className="text-sm font-semibold text-foreground mb-3">
            <span className="mr-2 text-muted-foreground">{index + 1}.</span>
            {question.type === 'true_false' ? (question as { statement: string }).statement : question.question}
        </p>
    );

    if (question.type === 'multiple_choice') {
        return (
            <div>
                {baseLabel}
                <div className="space-y-2">
                    {question.options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => onChange(question.id, labels[i])}
                            className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-all ${answer === labels[i]
                                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-medium'
                                    : 'border-border hover:border-border/80 hover:bg-accent'
                                }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (question.type === 'fill_in_blank') {
        // 빈칸 개수만큼 Input 생성
        const blankCount = question.blanks.length;
        const currentAnswers = typeof answer === 'string'
            ? answer.split('|').map(s => s.trim())
            : Array(blankCount).fill('');

        const handleBlankChange = (i: number, val: string) => {
            const updated = [...currentAnswers];
            updated[i] = val;
            onChange(question.id, updated.join(' | '));
        };

        // 문장에서 ___ 위치에 Input 삽입
        const parts = question.question.split('___');
        return (
            <div>
                {baseLabel}
                <div className="flex flex-wrap items-center gap-1 text-sm">
                    {parts.map((part, i) => (
                        <span key={i} className="flex items-center gap-1">
                            <span>{part}</span>
                            {i < parts.length - 1 && (
                                <Input
                                    value={currentAnswers[i] || ''}
                                    onChange={e => handleBlankChange(i, e.target.value)}
                                    className="h-7 w-28 text-sm px-2 inline-block"
                                    placeholder={`빈칸 ${i + 1}`}
                                />
                            )}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    if (question.type === 'short_answer') {
        return (
            <div>
                {baseLabel}
                <Textarea
                    value={typeof answer === 'string' ? answer : ''}
                    onChange={e => onChange(question.id, e.target.value)}
                    placeholder="답변을 입력하세요..."
                    className="text-sm resize-none"
                    rows={3}
                    maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                    {typeof answer === 'string' ? answer.length : 0}/500
                </p>
            </div>
        );
    }

    // true_false
    return (
        <div>
            {baseLabel}
            <div className="flex gap-3">
                {[true, false].map(val => (
                    <button
                        key={String(val)}
                        onClick={() => onChange(question.id, val)}
                        className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all ${answer === val
                                ? val
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                    : 'border-red-500 bg-red-500/10 text-red-400'
                                : 'border-border hover:bg-accent'
                            }`}
                    >
                        {val ? '⭕ True' : '❌ False'}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── 메인 플레이어 ─────────────────────────────────────
export function WorksheetPlayer({ worksheet, onSubmit, onBack }: WorksheetPlayerProps) {
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<StudentAnswers>({});
    const [elapsed, setElapsed] = useState(0);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const startRef = useRef(Date.now());

    // 타이머
    useEffect(() => {
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
        return () => clearInterval(id);
    }, []);

    const totalQ = worksheet.questions.length;
    const progress = ((current + 1) / totalQ) * 100;
    const answeredCount = Object.keys(answers).length;

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    const handleAnswer = useCallback((id: string, value: string | boolean) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    }, []);

    const handleSubmit = () => {
        setConfirmOpen(false);
        onSubmit(answers, elapsed);
    };

    const q = worksheet.questions[current];

    return (
        <div className="min-h-screen bg-background">
            {/* 헤더 */}
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="flex-1 text-sm font-bold truncate">{worksheet.title}</h1>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {formatTime(elapsed)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            {current + 1} / {totalQ}
                        </Badge>
                    </div>
                </div>
                <Progress value={progress} className="h-1 rounded-none" />
            </header>

            {/* 문제 */}
            <main className="mx-auto max-w-2xl px-4 py-6">
                <Card className="border-border/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{q.type.replace('_', ' ')}</Badge>
                            {q.points}점
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <QuestionCard
                            question={q}
                            index={current}
                            answer={answers[q.id]}
                            onChange={handleAnswer}
                        />
                    </CardContent>
                </Card>

                {/* 네비게이션 */}
                <div className="mt-4 flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrent(c => c - 1)}
                        disabled={current === 0}
                        className="gap-1"
                    >
                        <ArrowLeft className="h-4 w-4" /> 이전
                    </Button>

                    {/* 문제 점프 */}
                    <div className="flex gap-1">
                        {worksheet.questions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-7 w-7 rounded text-xs font-medium transition-all ${i === current
                                        ? 'bg-indigo-500 text-white'
                                        : answers[worksheet.questions[i].id] !== undefined
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-accent text-muted-foreground'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    {current < totalQ - 1 ? (
                        <Button onClick={() => setCurrent(c => c + 1)} className="gap-1">
                            다음 <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setConfirmOpen(true)}
                            className="gap-1 bg-emerald-600 hover:bg-emerald-500"
                        >
                            <Send className="h-4 w-4" /> 제출하기
                        </Button>
                    )}
                </div>

                {answeredCount < totalQ && (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                        미답변 {totalQ - answeredCount}문항 — 제출 전 확인해주세요
                    </p>
                )}
            </main>

            {/* 제출 확인 */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            워크시트 제출
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                        <p>답변 완료: <strong>{answeredCount}/{totalQ}</strong>문항</p>
                        <p>소요 시간: <strong>{formatTime(elapsed)}</strong></p>
                        {answeredCount < totalQ && (
                            <p className="rounded bg-amber-500/10 px-3 py-2 text-amber-400 text-xs">
                                ⚠️ {totalQ - answeredCount}개 문항이 미답변입니다.
                            </p>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>취소</Button>
                        <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-500">
                            제출하기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

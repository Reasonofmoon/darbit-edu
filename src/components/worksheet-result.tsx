'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import type { FSWorksheetAttempt, FSWorksheet } from '@/lib/firestore-types';

interface WorksheetResultProps {
    result: Omit<FSWorksheetAttempt, 'id'>;
    worksheet: Pick<FSWorksheet, 'title' | 'questions'>;
    onRetry: () => void;
    onBack: () => void;
}

const GRADE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    B: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    C: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    D: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    F: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};

const GRADE_MESSAGES: Record<string, string> = {
    A: '🎉 훌륭합니다! 완벽한 이해!',
    B: '👍 잘했어요! 조금만 더!',
    C: '📚 괜찮아요. 복습해 봐요.',
    D: '💪 다시 도전해 봐요!',
    F: '📖 원서를 다시 읽어봐요.',
};

export function WorksheetResult({ result, worksheet, onRetry, onBack }: WorksheetResultProps) {
    const style = GRADE_STYLES[result.grade] ?? GRADE_STYLES.F;
    const correctCount = result.questionResults.filter(r => r.isCorrect).length;

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-2xl items-center gap-4 px-4">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="flex-1 text-sm font-bold truncate">📊 채점 결과 — {worksheet.title}</h1>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-6 space-y-5">
                {/* 히어로 점수 카드 */}
                <Card className={`border ${style.border} ${style.bg}`}>
                    <CardContent className="flex flex-col items-center gap-3 py-8">
                        <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${style.border} ${style.bg}`}>
                            <span className={`text-4xl font-black ${style.text}`}>{result.grade}</span>
                        </div>
                        <p className={`text-3xl font-bold ${style.text}`}>
                            {result.score} <span className="text-lg font-normal text-muted-foreground">/ {result.maxScore}점</span>
                        </p>
                        <p className="text-sm text-muted-foreground">{result.percentage}% — {GRADE_MESSAGES[result.grade]}</p>
                        <div className="flex gap-3 text-xs">
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-400">
                                ✅ 정답 {correctCount}
                            </span>
                            <span className="rounded-full bg-red-500/10 px-3 py-1 text-red-400">
                                ❌ 오답 {result.questionResults.length - correctCount}
                            </span>
                            <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                                ⏱ {Math.floor(result.timeSec / 60)}분 {result.timeSec % 60}초
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* 문제별 상세 */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">문제별 결과</h2>
                    {result.questionResults.map((qr, i) => {
                        const question = worksheet.questions.find(q => q.id === qr.questionId);
                        return (
                            <Card key={qr.questionId} className={`border-border/50 ${!qr.isCorrect ? 'border-l-4 border-l-red-500' : ''}`}>
                                <CardContent className="flex gap-3 p-3">
                                    <div className="pt-0.5">
                                        {qr.isCorrect
                                            ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                            : <XCircle className="h-5 w-5 text-red-500" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-0.5">문제 {i + 1}</p>
                                        <p className="text-sm text-foreground truncate">
                                            {'question' in (question ?? {}) ? (question as { question: string }).question : (question as { statement?: string } | undefined)?.statement ?? ''}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">{qr.feedback}</p>
                                    </div>
                                    <Badge variant="outline" className={`shrink-0 text-xs ${qr.isCorrect ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>
                                        {qr.earned}/{qr.max}점
                                    </Badge>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Separator />

                {/* 하단 버튼 */}
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 gap-2" onClick={onRetry}>
                        <RotateCcw className="h-4 w-4" /> 다시 풀기
                    </Button>
                    <Button className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-500" onClick={onBack}>
                        <Trophy className="h-4 w-4" /> 목록으로
                    </Button>
                </div>
            </main>
        </div>
    );
}

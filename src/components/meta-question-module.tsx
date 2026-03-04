'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft, Brain, BookOpen, Wand2, Loader2, Copy, RefreshCw,
    Lightbulb, MessageSquare, HelpCircle,
} from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ACTIVITY_PRESETS = [
    { id: 'reading', label: '📖 독서 활동', prompt: '학생이 영어 원서를 읽고 난 후' },
    { id: 'vocab', label: '📝 어휘 학습', prompt: '학생이 새로운 어휘를 학습한 후' },
    { id: 'grammar', label: '✏️ 문법 학습', prompt: '학생이 문법 규칙을 배운 후' },
    { id: 'test', label: '📊 시험 후', prompt: '학생이 영어 시험을 본 후' },
    { id: 'conversation', label: '💬 회화 연습', prompt: '학생이 영어 회화 연습을 한 후' },
    { id: 'writing', label: '📄 작문 활동', prompt: '학생이 영어 에세이를 작성한 후' },
];

interface MetaQuestion {
    category: string;
    question: string;
    purpose: string;
    followUp: string;
}

export function MetaQuestionModule({ onBack }: { onBack: () => void }) {
    const [activity, setActivity] = useState('');
    const [customActivity, setCustomActivity] = useState('');
    const [grade, setGrade] = useState('초등 고학년');
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<MetaQuestion[]>([]);
    const [error, setError] = useState('');

    const generate = async () => {
        const activityText = customActivity.trim() || ACTIVITY_PRESETS.find(a => a.id === activity)?.prompt || '';
        if (!activityText) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/meta-questions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activity: activityText, grade }),
            });
            if (!res.ok) throw new Error('Generation failed');
            const data = await res.json();
            setQuestions(data.questions || []);
        } catch {
            setError('메타인지 질문 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const copyAll = () => {
        const text = questions.map((q, i) =>
            `${i + 1}. [${q.category}] ${q.question}\n   목적: ${q.purpose}\n   후속질문: ${q.followUp}`
        ).join('\n\n');
        navigator.clipboard.writeText(text);
    };

    const CATEGORY_COLORS: Record<string, string> = {
        '계획': '#3b82f6', '모니터링': '#22c55e', '평가': '#f59e0b',
        '전략': '#8b5cf6', '동기': '#ec4899', '전이': '#06b6d4',
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-6">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="flex-1 text-lg font-bold">🧠 메타인지 질문</h1>
                    <Badge variant="secondary" className="bg-violet-500/10 text-violet-500">Gemini</Badge>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-6 py-6 space-y-6">
                {/* Activity Selection */}
                <Card className="border-border/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">학습 활동 선택</CardTitle>
                        <CardDescription className="text-xs">메타인지 질문을 생성할 학습 활동을 선택하거나 직접 입력하세요</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {ACTIVITY_PRESETS.map((a) => (
                                <button key={a.id} onClick={() => { setActivity(a.id); setCustomActivity(''); }}
                                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${activity === a.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-border/50 hover:bg-accent/50'
                                        }`}>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">또는 직접 입력</Label>
                            <Input
                                value={customActivity}
                                onChange={(e) => { setCustomActivity(e.target.value); setActivity(''); }}
                                placeholder="예: 학생이 영어 프레젠테이션을 준비한 후..."
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">대상 학년</Label>
                                <select value={grade} onChange={(e) => setGrade(e.target.value)}
                                    className="h-8 rounded-md border border-border bg-background px-2 text-sm">
                                    <option>초등 저학년</option>
                                    <option>초등 고학년</option>
                                    <option>중학생</option>
                                    <option>고등학생</option>
                                </select>
                            </div>
                            <Button className="mt-5 bg-violet-600 hover:bg-violet-500" onClick={generate}
                                disabled={loading || (!activity && !customActivity.trim())}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />생성중...</> : <><Wand2 className="mr-2 h-4 w-4" />질문 생성</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {error && <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">{error}</div>}

                {/* Generated Questions */}
                {questions.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold">생성된 메타인지 질문 ({questions.length}개)</h2>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={copyAll}><Copy className="mr-1 h-3 w-3" />전체 복사</Button>
                                <Button size="sm" variant="outline" onClick={generate}><RefreshCw className="mr-1 h-3 w-3" />재생성</Button>
                            </div>
                        </div>
                        {questions.map((q, i) => (
                            <Card key={i} className="border-border/50 border-l-4" style={{ borderLeftColor: CATEGORY_COLORS[q.category] || '#6366f1' }}>
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge style={{ backgroundColor: (CATEGORY_COLORS[q.category] || '#6366f1') + '20', color: CATEGORY_COLORS[q.category] || '#6366f1' }}
                                            className="text-xs">{q.category}</Badge>
                                        <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                                    </div>
                                    <p className="text-sm font-medium flex items-start gap-2">
                                        <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />{q.question}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                                        <Lightbulb className="h-3 w-3 shrink-0 mt-0.5" />목적: {q.purpose}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                                        <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />후속: {q.followUp}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

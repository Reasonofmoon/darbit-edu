'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft, Send, FileText, Target, Brain, TrendingUp, BookOpen,
    Copy, Loader2,
} from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

const BLOOM_LEVELS = ['기억', '이해', '적용', '분석', '평가', '창조'];
const BLOOM_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export function ExamAnalysisModule({ onBack }: { onBack: () => void }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [error, setError] = useState('');

    const analyze = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/exam-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionText: input }),
            });
            if (!res.ok) throw new Error('Analysis failed');
            const data = await res.json();
            setAnalysis(data.analysis);
        } catch {
            setError('문항 분석에 실패했습니다. API 키를 확인하세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-6">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="flex-1 text-lg font-bold">📝 수능 문항 분석</h1>
                    <Badge variant="secondary" className="bg-violet-500/10 text-violet-500">Claude Sonnet</Badge>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-6 py-6 space-y-6">
                {/* Input */}
                <Card className="border-border/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">문항 입력</CardTitle>
                        <CardDescription className="text-xs">수능/모의고사 영어 문항을 붙여넣으세요 (지문 + 문제 + 선택지)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <textarea
                            className="w-full min-h-[200px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="예) 다음 글의 밑줄 친 부분 중, 어법상 틀린 것은?&#10;&#10;The ability to accurately assess..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <Button className="w-full bg-violet-600 hover:bg-violet-500" onClick={analyze} disabled={loading || !input.trim()}>
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />AI 분석중...</> : <><Send className="mr-2 h-4 w-4" />문항 분석</>}
                        </Button>
                    </CardContent>
                </Card>

                {error && <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">{error}</div>}

                {/* Results */}
                {analysis && (
                    <Tabs defaultValue="overview">
                        <TabsList className="w-full justify-start overflow-x-auto">
                            <TabsTrigger value="overview" className="gap-1 text-xs"><Target className="h-3 w-3" />종합</TabsTrigger>
                            <TabsTrigger value="bloom" className="gap-1 text-xs"><Brain className="h-3 w-3" />블룸</TabsTrigger>
                            <TabsTrigger value="solving" className="gap-1 text-xs"><TrendingUp className="h-3 w-3" />풀이</TabsTrigger>
                            <TabsTrigger value="learning" className="gap-1 text-xs"><BookOpen className="h-3 w-3" />학습</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 mt-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Card className="border-border/50">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-xs text-muted-foreground">문항 유형</p>
                                        <p className="text-lg font-bold">{analysis.questionType}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-border/50">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-xs text-muted-foreground">난이도</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={analysis.difficulty?.level === '상' ? 'destructive' : analysis.difficulty?.level === '중' ? 'default' : 'secondary'}>
                                                {analysis.difficulty?.level}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">예상 정답률 {analysis.difficulty?.predictedCorrectRate}%</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <Card className="border-border/50">
                                <CardContent className="p-4 space-y-2">
                                    <p className="text-xs text-muted-foreground">내용 영역</p>
                                    <p className="text-sm">{analysis.contentArea?.topic}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{analysis.contentArea?.curriculum}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-border/50">
                                <CardContent className="p-4 space-y-2">
                                    <p className="text-xs text-muted-foreground">출제 의도</p>
                                    <p className="text-sm">{analysis.designPrinciples?.intent}</p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="bloom" className="space-y-4 mt-4">
                            <Card className="border-border/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-white text-xl font-bold"
                                            style={{ backgroundColor: BLOOM_COLORS[(analysis.bloomLevel?.code || 1) - 1] }}>
                                            {analysis.bloomLevel?.code}
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{analysis.bloomLevel?.level}</p>
                                            <p className="text-sm text-muted-foreground">블룸 분류학 수준</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 mb-3">
                                        {BLOOM_LEVELS.map((lv, i) => (
                                            <div key={lv} className="flex-1 rounded py-1 text-center text-[10px] text-white"
                                                style={{ backgroundColor: (analysis.bloomLevel?.code || 1) - 1 >= i ? BLOOM_COLORS[i] : '#374151' }}>
                                                {lv}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{analysis.bloomLevel?.justification}</p>
                                </CardContent>
                            </Card>
                            {analysis.validity && (
                                <Card className="border-border/50">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">타당도 분석</CardTitle></CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <p><span className="text-muted-foreground">내용 타당도:</span> {analysis.validity.contentValidity}</p>
                                        <p><span className="text-muted-foreground">구성 타당도:</span> {analysis.validity.constructValidity}</p>
                                        <p><span className="text-muted-foreground">공정성:</span> {analysis.validity.fairness}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="solving" className="space-y-4 mt-4">
                            <Card className="border-border/50">
                                <CardHeader className="pb-2"><CardTitle className="text-sm">단계별 풀이 전략</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {analysis.solvingStrategy?.steps?.map((step: string, i: number) => (
                                        <div key={i} className="flex gap-2 text-sm">
                                            <Badge variant="outline" className="shrink-0">{i + 1}</Badge>
                                            <p>{step}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                            <Card className="border-border/50">
                                <CardContent className="p-4 space-y-2">
                                    <p className="text-xs text-muted-foreground">정답</p>
                                    <Badge className="bg-emerald-500 text-lg px-4 py-1">{analysis.solvingStrategy?.correctAnswer}</Badge>
                                    <p className="text-xs text-muted-foreground mt-2">근거</p>
                                    <p className="text-sm italic">"{analysis.solvingStrategy?.keyEvidence}"</p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="learning" className="space-y-4 mt-4">
                            <Card className="border-border/50">
                                <CardHeader className="pb-2"><CardTitle className="text-sm">학습 전략</CardTitle></CardHeader>
                                <CardContent className="text-sm">{analysis.recommendations?.studyStrategy}</CardContent>
                            </Card>
                            {analysis.recommendations?.conceptPoints?.length > 0 && (
                                <Card className="border-border/50">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">개념 정리 포인트</CardTitle></CardHeader>
                                    <CardContent className="space-y-1">
                                        {analysis.recommendations.conceptPoints.map((p: string, i: number) => (
                                            <p key={i} className="text-sm">• {p}</p>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </main>
        </div>
    );
}

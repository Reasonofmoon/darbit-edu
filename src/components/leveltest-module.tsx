'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft, Play, Clock, BarChart3, BookOpen, MessageSquare, PenLine,
    CheckCircle2, XCircle, ChevronRight, Award, Download, RefreshCw,
} from 'lucide-react';
import {
    type CEFRLevel, type TestData, type Question, type WritingQuestion, type TestResult,
    LEVEL_CONFIG, LEVEL_COLORS, LEVEL_DESCRIPTIONS, ASSESSMENT_CRITERIA,
    determineLevel,
} from '@/lib/leveltest-types';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';

// ── Phase: Level Selection ──────────────────────────────────
function LevelSelector({ onStart }: { onStart: (level: CEFRLevel, name: string) => void }) {
    const [name, setName] = useState('');
    const levels: CEFRLevel[] = ['PRE-A1', 'A1', 'A2', 'B1', 'B2'];

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>학생 이름</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" className="max-w-xs" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {levels.map((lv) => {
                    const desc = LEVEL_DESCRIPTIONS[lv];
                    const cfg = LEVEL_CONFIG[lv];
                    const total = cfg.reading + cfg.vocabulary + cfg.conversation + cfg.grammar + cfg.writing;
                    return (
                        <Card key={lv} className="group cursor-pointer border-border/50 transition-all hover:shadow-lg" onClick={() => name.trim() && onStart(lv, name.trim())}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <Badge style={{ backgroundColor: LEVEL_COLORS[lv] + '20', color: LEVEL_COLORS[lv] }} className="text-sm font-bold">{lv}</Badge>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                                <CardTitle className="text-base mt-2">{desc.ko} ({desc.en})</CardTitle>
                                <CardDescription className="text-xs">{desc.grade}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{cfg.duration}분</span>
                                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{total}문항</span>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            {!name.trim() && <p className="text-sm text-amber-500">⚠ 이름을 입력해야 레벨을 선택할 수 있습니다.</p>}
        </div>
    );
}

// ── Phase: Test Taking ──────────────────────────────────────
function TestTaking({
    testData, onSubmit,
}: {
    testData: TestData;
    onSubmit: (answers: Record<string, string>, writingResponse: string) => void;
}) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [writingResponse, setWritingResponse] = useState('');
    const [timeLeft, setTimeLeft] = useState(testData.metadata.duration * 60);
    const [currentTab, setCurrentTab] = useState('reading');

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const sectionOrder = ['reading', 'vocabulary', 'conversation', 'grammar', 'writing'];
    const sectionIcons: Record<string, React.ReactNode> = {
        reading: <BookOpen className="h-3 w-3" />, vocabulary: <PenLine className="h-3 w-3" />,
        conversation: <MessageSquare className="h-3 w-3" />, grammar: <BarChart3 className="h-3 w-3" />,
        writing: <PenLine className="h-3 w-3" />,
    };

    const answeredCount = Object.keys(answers).length + (writingResponse.trim() ? 1 : 0);

    return (
        <div className="space-y-4">
            {/* Timer bar */}
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-accent/30 px-4 py-2">
                <Badge style={{ backgroundColor: LEVEL_COLORS[testData.metadata.level] + '20', color: LEVEL_COLORS[testData.metadata.level] }}>
                    {testData.metadata.level}
                </Badge>
                <span className={`font-mono text-lg font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : ''}`}>
                    ⏱ {formatTime(timeLeft)}
                </span>
                <span className="text-sm text-muted-foreground">{answeredCount}/{testData.metadata.total_questions} 답변</span>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="w-full justify-start overflow-x-auto">
                    {sectionOrder.filter(s => testData.sections[s]).map((s) => (
                        <TabsTrigger key={s} value={s} className="gap-1 text-xs">
                            {sectionIcons[s]} {testData.sections[s].title.split(': ')[1] || s}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {sectionOrder.filter(s => testData.sections[s]).map((sectionKey) => {
                    const section = testData.sections[sectionKey];
                    return (
                        <TabsContent key={sectionKey} value={sectionKey} className="space-y-4 mt-4">
                            {section.questions.map((q) => {
                                if ('prompt' in q) {
                                    // Writing question
                                    return (
                                        <Card key={q.id} className="border-border/50">
                                            <CardHeader className="pb-2"><CardTitle className="text-sm">{q.id}: Writing Task</CardTitle></CardHeader>
                                            <CardContent className="space-y-3">
                                                <p className="text-sm text-muted-foreground">{q.prompt}</p>
                                                <textarea
                                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[150px] focus:outline-none focus:ring-1 focus:ring-ring"
                                                    placeholder="Write your response here..."
                                                    value={writingResponse}
                                                    onChange={(e) => setWritingResponse(e.target.value)}
                                                />
                                            </CardContent>
                                        </Card>
                                    );
                                }

                                const mcq = q as Question;
                                return (
                                    <Card key={mcq.id} className="border-border/50">
                                        <CardHeader className="pb-2"><CardTitle className="text-sm">{mcq.id}</CardTitle></CardHeader>
                                        <CardContent className="space-y-2">
                                            <p className="text-sm">{mcq.text}</p>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {mcq.options?.map((opt) => (
                                                    <button
                                                        key={opt.label}
                                                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${answers[mcq.id] === opt.label
                                                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600'
                                                                : 'border-border/50 hover:border-border hover:bg-accent/50'
                                                            }`}
                                                        onClick={() => setAnswers((prev) => ({ ...prev, [mcq.id]: opt.label }))}
                                                    >
                                                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${answers[mcq.id] === opt.label ? 'bg-indigo-500 text-white' : 'bg-accent'
                                                            }`}>{opt.label}</span>
                                                        {opt.text}
                                                    </button>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </TabsContent>
                    );
                })}
            </Tabs>

            <Button className="w-full bg-indigo-600 hover:bg-indigo-500" onClick={() => onSubmit(answers, writingResponse)}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> 시험 제출
            </Button>
        </div>
    );
}

// ── Phase: Results ──────────────────────────────────────────
function TestResults({ result, onRetry }: { result: TestResult; onRetry: () => void }) {
    const categories = ['Reading', 'Vocabulary', 'Grammar', 'Conversation', 'Writing'];
    const radarData = categories.map((cat) => {
        const codes = Object.entries(ASSESSMENT_CRITERIA).filter(([, v]) => v.category === cat);
        const avg = codes.length > 0
            ? codes.reduce((sum, [code]) => sum + (result.rubricScores[code] ?? 0), 0) / codes.length
            : 0;
        return { category: cat, score: avg, fullMark: 4 };
    });

    const barData = Object.entries(ASSESSMENT_CRITERIA).map(([code, info]) => ({
        code, criterion: info.criterion, score: result.rubricScores[code] ?? 0, category: info.category,
    }));

    const catColors: Record<string, string> = {
        Reading: '#3b82f6', Vocabulary: '#8b5cf6', Grammar: '#f59e0b', Conversation: '#10b981', Writing: '#ec4899',
    };

    return (
        <div className="space-y-6">
            {/* Score summary */}
            <Card className="border-border/50 overflow-hidden">
                <div className="h-2" style={{ backgroundColor: LEVEL_COLORS[result.determinedLevel] }} />
                <CardContent className="pt-6 text-center">
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: LEVEL_COLORS[result.determinedLevel] + '20' }}>
                            <span className="text-2xl font-bold" style={{ color: LEVEL_COLORS[result.determinedLevel] }}>
                                {result.determinedLevel}
                            </span>
                        </div>
                        <div className="text-left">
                            <p className="text-3xl font-bold">{result.scores.percentage}%</p>
                            <p className="text-sm text-muted-foreground">{result.scores.total}/{result.scores.maxTotal}점</p>
                            <p className="text-xs text-muted-foreground">{result.studentName} • {result.date}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card className="border-border/50">
                <CardHeader><CardTitle className="text-sm">영역별 능력 프로필</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                            <PolarRadiusAxis angle={90} domain={[0, 4]} tick={{ fontSize: 10 }} />
                            <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 20-criteria bar chart */}
            <Card className="border-border/50">
                <CardHeader><CardTitle className="text-sm">20항목 상세 루브릭</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={barData} layout="vertical" margin={{ left: 120 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 10 }} />
                            <YAxis dataKey="criterion" type="category" tick={{ fontSize: 10 }} width={120} />
                            <Tooltip />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                                {barData.map((entry) => (
                                    <Cell key={entry.code} fill={catColors[entry.category] || '#6366f1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
                <Card className="border-border/50">
                    <CardHeader><CardTitle className="text-sm">📋 개선 권장사항</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                            <p key={i} className="text-sm text-muted-foreground">• {rec}</p>
                        ))}
                    </CardContent>
                </Card>
            )}

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onRetry}>
                    <RefreshCw className="mr-2 h-4 w-4" /> 다시 시험
                </Button>
                <Button className="flex-1" disabled>
                    <Download className="mr-2 h-4 w-4" /> PDF 다운로드 (준비중)
                </Button>
            </div>
        </div>
    );
}

// ── Main Module ─────────────────────────────────────────────
export function LevelTestModule({ onBack }: { onBack: () => void }) {
    const [phase, setPhase] = useState<'select' | 'loading' | 'test' | 'results'>('select');
    const [testData, setTestData] = useState<TestData | null>(null);
    const [result, setResult] = useState<TestResult | null>(null);
    const [studentName, setStudentName] = useState('');
    const [error, setError] = useState('');

    const startTest = useCallback(async (level: CEFRLevel, name: string) => {
        setStudentName(name);
        setPhase('loading');
        setError('');
        try {
            const res = await fetch('/api/level-test/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level, studentName: name }),
            });
            if (!res.ok) throw new Error('Test generation failed');
            const data = await res.json();
            setTestData(data);
            setPhase('test');
        } catch (err) {
            setError('시험 생성에 실패했습니다. API 키를 확인하세요.');
            setPhase('select');
        }
    }, []);

    const handleSubmit = useCallback((answers: Record<string, string>, writingResponse: string) => {
        if (!testData) return;

        // Score the test
        const answerKey = testData.answer_key;
        const sectionScores = { reading: 0, vocabulary: 0, conversation: 0, grammar: 0, writing: 0 };
        const sectionMax = { reading: 0, vocabulary: 0, conversation: 0, grammar: 0, writing: 0 };

        for (const [qId, correctAns] of Object.entries(answerKey)) {
            const section = qId.startsWith('R') ? 'reading' : qId.startsWith('V') ? 'vocabulary'
                : qId.startsWith('C') ? 'conversation' : qId.startsWith('G') ? 'grammar' : 'writing';
            sectionMax[section]++;
            if (answers[qId] === correctAns) sectionScores[section]++;
        }

        // Convert writing to a basic score (placeholder until AI grading)
        sectionMax.writing = 4; // 0-4 rubric
        sectionScores.writing = writingResponse.trim().length > 50 ? 3 : writingResponse.trim().length > 20 ? 2 : writingResponse.trim().length > 0 ? 1 : 0;

        const maxTotal = Object.values(sectionMax).reduce((a, b) => a + b, 0);
        const total = Object.values(sectionScores).reduce((a, b) => a + b, 0);
        const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

        // Generate rubric scores (0-4) per criterion
        const rubricScores: Record<string, number> = {};
        const categorySections: Record<string, string> = {
            Reading: 'reading', Vocabulary: 'vocabulary', Grammar: 'grammar', Conversation: 'conversation', Writing: 'writing',
        };
        for (const [code, info] of Object.entries(ASSESSMENT_CRITERIA)) {
            const sectionKey = categorySections[info.category] as keyof typeof sectionScores;
            const proportion = sectionMax[sectionKey] > 0 ? sectionScores[sectionKey] / sectionMax[sectionKey] : 0;
            rubricScores[code] = Math.round(proportion * 4);
        }

        const determinedLevel = determineLevel(percentage);
        const recommendations: string[] = [];
        const sorted = Object.entries(sectionScores).sort(([, a], [, b]) => a - b);
        for (const [sec] of sorted.slice(0, 2)) {
            if (sec === 'reading') recommendations.push('Read short texts daily and summarize main ideas.');
            if (sec === 'vocabulary') recommendations.push('Grow vocabulary with spaced repetition and sentence usage.');
            if (sec === 'grammar') recommendations.push('Review target tenses and agreement; rewrite errors.');
            if (sec === 'conversation') recommendations.push('Role-play dialogues with polite, concise replies.');
            if (sec === 'writing') recommendations.push('Practice timed writing with clear paragraphs and revise for grammar.');
        }

        const testResult: TestResult = {
            studentName,
            level: testData.metadata.level,
            date: new Date().toLocaleDateString('ko-KR'),
            answers,
            writingResponse,
            scores: { ...sectionScores, total, maxTotal, percentage },
            rubricScores,
            determinedLevel,
            recommendations,
        };

        setResult(testResult);
        setPhase('results');
    }, [testData, studentName]);

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-6">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold">📊 CEFR 레벨 테스트</h1>
                    </div>
                    {phase !== 'select' && (
                        <Badge variant="outline">{studentName}</Badge>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-6 py-6">
                {error && <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">{error}</div>}

                {phase === 'select' && <LevelSelector onStart={startTest} />}

                {phase === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                        <p className="mt-4 text-muted-foreground">AI가 시험을 생성하고 있습니다...</p>
                        <p className="text-xs text-muted-foreground mt-1">약 10-20초 소요</p>
                    </div>
                )}

                {phase === 'test' && testData && <TestTaking testData={testData} onSubmit={handleSubmit} />}

                {phase === 'results' && result && <TestResults result={result} onRetry={() => { setPhase('select'); setResult(null); setTestData(null); }} />}
            </main>
        </div>
    );
}

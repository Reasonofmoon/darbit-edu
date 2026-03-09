'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, BookOpen, FileText, Brain, AlertTriangle } from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── 더미 데이터 ─────────────────────────────────────
const STUDENTS = [
    { id: 's1', name: '전주형', class: 'Halfmoon A', book: "Charlotte's Web", progress: 72, score: 88, lastActive: 2026_03_09 },
    { id: 's2', name: '김시연', class: 'Halfmoon A', book: 'The Giver', progress: 45, score: 74, lastActive: 2026_03_07 },
    { id: 's3', name: '김정우', class: 'Halfmoon A', book: 'Matilda', progress: 91, score: 95, lastActive: 2026_03_09 },
    { id: 's4', name: '조유주', class: 'Halfmoon A', book: 'The Giver', progress: 30, score: 62, lastActive: 2026_03_05 },
    { id: 's5', name: '강현우', class: 'Halfmoon A', book: 'Wonder', progress: 55, score: 81, lastActive: 2026_03_09 },
];

const READING_TIME_DATA = STUDENTS.map(s => ({
    name: s.name,
    minutes: [45, 12, 82, 8, 55][STUDENTS.indexOf(s)],
}));

const WEEKLY_SCORE_DATA = [
    { week: '2/17', avg: 71 },
    { week: '2/24', avg: 76 },
    { week: '3/03', avg: 79 },
    { week: '3/09', avg: 80 },
];

const VOCAB_PIE = [
    { name: '마스터', value: 18, color: '#22c55e' },
    { name: '복습중', value: 27, color: '#6366f1' },
    { name: '신규', value: 10, color: '#71717a' },
];

// ── KPI 카드 ──────────────────────────────────────
function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
    return (
        <Card className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

// ── 날짜 차이 계산 ────────────────────────────────
function daysSince(ymd: number): number {
    const d = String(ymd);
    const date = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`);
    return Math.floor((Date.now() - date.getTime()) / 86400000);
}

// ── 점수 배지 ─────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
    const cls = score >= 90
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : score >= 70
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20';
    return <Badge className={`border text-xs ${cls}`}>{score}점</Badge>;
}

// ── 메인 ─────────────────────────────────────────
export function AnalyticsDashboard({ onBack }: { onBack: () => void }) {
    const [range, setRange] = useState<'week' | 'month'>('week');

    const avgScore = Math.round(STUDENTS.reduce((s, st) => s + st.score, 0) / STUDENTS.length);
    const readingDone = STUDENTS.filter(s => s.progress >= 50).length;
    const vocabDone = STUDENTS.filter(s => daysSince(s.lastActive) <= 1).length;

    const customTooltipStyle = { backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="flex-1 text-lg font-bold">📊 학습 분석 대시보드</h1>
                    <select
                        value={range}
                        onChange={e => setRange(e.target.value as 'week' | 'month')}
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                        <option value="week">이번 주</option>
                        <option value="month">이번 달</option>
                    </select>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
                {/* KPI 카드 */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <KpiCard icon={<Users className="h-5 w-5 text-indigo-400" />} label="총 학생" value={STUDENTS.length} />
                    <KpiCard icon={<BookOpen className="h-5 w-5 text-emerald-400" />} label="이번 주 읽기 50%+" value={readingDone} sub={`${STUDENTS.length}명 중`} />
                    <KpiCard icon={<FileText className="h-5 w-5 text-amber-400" />} label="평균 워크시트 점수" value={`${avgScore}점`} />
                    <KpiCard icon={<Brain className="h-5 w-5 text-violet-400" />} label="어휘 복습 완료" value={vocabDone} sub="어제~오늘 접속" />
                </div>

                {/* 차트 그리드 */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* 막대: 독서 시간 */}
                    <Card className="border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">이번 주 독서 시간 (분)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={READING_TIME_DATA} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* 라인: 주간 점수 추이 */}
                    <Card className="border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">최근 4주 평균 점수 추이</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={WEEKLY_SCORE_DATA} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Line type="monotone" dataKey="avg" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* 파이: 어휘 */}
                    <Card className="border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">어휘 습득 현황 (전체 55개)</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <ResponsiveContainer width="50%" height={160}>
                                <PieChart>
                                    <Pie data={VOCAB_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                                        {VOCAB_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={customTooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {VOCAB_PIE.map(v => (
                                    <div key={v.name} className="flex items-center gap-2 text-xs">
                                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                                        <span className="text-muted-foreground">{v.name}</span>
                                        <span className="font-semibold">{v.value}개</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 이탈 경고 요약 */}
                    <Card className="border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-400" /> 주의 학생
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {STUDENTS.filter(s => daysSince(s.lastActive) >= 3 || s.score < 70).map(s => (
                                <div key={s.id} className="flex items-center gap-3 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{s.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {daysSince(s.lastActive) >= 3 ? `${daysSince(s.lastActive)}일 미접속` : '점수 낮음'}
                                        </p>
                                    </div>
                                    <ScoreBadge score={s.score} />
                                </div>
                            ))}
                            {STUDENTS.filter(s => daysSince(s.lastActive) >= 3 || s.score < 70).length === 0 && (
                                <p className="text-center text-xs text-muted-foreground py-4">모든 학생 정상 학습 중 ✅</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 학생 전체 테이블 */}
                <Card className="border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">학생 현황</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 text-xs text-muted-foreground">
                                        <th className="pb-2 text-left font-medium">학생</th>
                                        <th className="pb-2 text-left font-medium">현재 원서</th>
                                        <th className="pb-2 text-center font-medium">진도</th>
                                        <th className="pb-2 text-center font-medium">점수</th>
                                        <th className="pb-2 text-center font-medium">최근 접속</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {STUDENTS.map(s => {
                                        const inactive = daysSince(s.lastActive) >= 3;
                                        return (
                                            <tr key={s.id} className={inactive ? 'bg-red-500/5' : ''}>
                                                <td className="py-2.5 pr-4">
                                                    <div className="flex items-center gap-1.5">
                                                        {inactive && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                                                        <span className="font-medium">{s.name}</span>
                                                        <span className="text-xs text-muted-foreground">{s.class}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 pr-4 text-xs text-muted-foreground truncate max-w-[120px]">{s.book}</td>
                                                <td className="py-2.5 text-center">
                                                    <div className="flex items-center gap-1 justify-center">
                                                        <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                                                            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${s.progress}%` }} />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{s.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 text-center"><ScoreBadge score={s.score} /></td>
                                                <td className="py-2.5 text-center text-xs text-muted-foreground">
                                                    {daysSince(s.lastActive) === 0 ? '오늘' : `${daysSince(s.lastActive)}일 전`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

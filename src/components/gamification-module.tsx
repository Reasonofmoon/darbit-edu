'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft, Trophy, Star, Medal, Flame, Crown, Target, Zap,
    TrendingUp, Award, Gift, Users,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────
interface StudentXP {
    id: number;
    name: string;
    class: string;
    xp: number;
    level: number;
    streak: number;
    badges: string[];
    weeklyXP: number;
}

interface BadgeDef {
    id: string;
    name: string;
    icon: string;
    description: string;
    condition: string;
    xpBonus: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const BADGES: BadgeDef[] = [
    { id: 'first-hw', name: '첫 숙제 제출', icon: '📝', description: '첫 번째 숙제를 제출했습니다', condition: '숙제 1회 제출', xpBonus: 10, rarity: 'common' },
    { id: 'hw-streak-5', name: '5일 연속 출석', icon: '🔥', description: '5일 연속 수업에 참여했습니다', condition: '5일 연속 출석', xpBonus: 25, rarity: 'common' },
    { id: 'hw-streak-20', name: '20일 연속 출석', icon: '💎', description: '20일 연속 수업에 참여했습니다', condition: '20일 연속 출석', xpBonus: 100, rarity: 'rare' },
    { id: 'vocab-master', name: '어휘 마스터', icon: '📖', description: '어휘 테스트 10회 합격', condition: '어휘시험 10회 합격', xpBonus: 50, rarity: 'rare' },
    { id: 'perfect-week', name: '완벽한 한 주', icon: '⭐', description: '1주일 모든 과제를 합격', condition: '주간 완벽 수행', xpBonus: 75, rarity: 'epic' },
    { id: 'level-up-10', name: '레벨 10 달성', icon: '🏆', description: '경험치 레벨 10에 도달했습니다', condition: '레벨 10 도달', xpBonus: 200, rarity: 'epic' },
    { id: 'grammar-king', name: '문법왕', icon: '👑', description: '문법 완료 20회 달성', condition: '문법 20회 완료', xpBonus: 150, rarity: 'legendary' },
    { id: 'top-3', name: '리더보드 TOP 3', icon: '🥇', description: '주간 리더보드 3위 안에 진입', condition: '주간 TOP 3', xpBonus: 100, rarity: 'legendary' },
];

const RARITY_COLORS: Record<string, string> = {
    common: '#a1a1aa', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b',
};

function xpToLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 50)) + 1;
}
function levelProgress(xp: number): number {
    const lvl = xpToLevel(xp);
    const currLvlXP = (lvl - 1) ** 2 * 50;
    const nextLvlXP = lvl ** 2 * 50;
    return Math.round(((xp - currLvlXP) / (nextLvlXP - currLvlXP)) * 100);
}

// Seed data
const SEED_XP: StudentXP[] = [
    { id: 1, name: '전주형', class: 'Halfmoon A', xp: 1250, level: 5, streak: 12, badges: ['first-hw', 'hw-streak-5', 'vocab-master'], weeklyXP: 180 },
    { id: 2, name: '김시은', class: 'Halfmoon A', xp: 980, level: 4, streak: 8, badges: ['first-hw', 'hw-streak-5'], weeklyXP: 150 },
    { id: 3, name: '김시연', class: '가니메데', xp: 2100, level: 6, streak: 22, badges: ['first-hw', 'hw-streak-5', 'hw-streak-20', 'vocab-master', 'perfect-week'], weeklyXP: 240 },
    { id: 4, name: '김정우', class: '유로파 A', xp: 1800, level: 6, streak: 15, badges: ['first-hw', 'hw-streak-5', 'vocab-master', 'perfect-week'], weeklyXP: 210 },
    { id: 5, name: '신민경', class: '가니메데', xp: 1650, level: 5, streak: 18, badges: ['first-hw', 'hw-streak-5', 'vocab-master'], weeklyXP: 195 },
    { id: 6, name: '김석준', class: '칼리스토 A', xp: 1400, level: 5, streak: 10, badges: ['first-hw', 'hw-streak-5'], weeklyXP: 160 },
    { id: 7, name: '구도윤', class: '칼리스토 C', xp: 1100, level: 4, streak: 7, badges: ['first-hw', 'hw-streak-5'], weeklyXP: 130 },
    { id: 8, name: '조유주', class: '유로파 B', xp: 1550, level: 5, streak: 14, badges: ['first-hw', 'hw-streak-5', 'vocab-master'], weeklyXP: 175 },
    { id: 9, name: '강현우', class: '타이탄 B', xp: 900, level: 4, streak: 5, badges: ['first-hw', 'hw-streak-5'], weeklyXP: 120 },
    { id: 10, name: '백서준', class: '크레센트 A', xp: 720, level: 3, streak: 3, badges: ['first-hw'], weeklyXP: 90 },
];

// ── Main Module ─────────────────────────────────────────────
export function GamificationModule({ onBack }: { onBack: () => void }) {
    const [students] = useState(SEED_XP);

    const leaderboard = useMemo(() =>
        [...students].sort((a, b) => b.xp - a.xp), [students]
    );
    const weeklyBoard = useMemo(() =>
        [...students].sort((a, b) => b.weeklyXP - a.weeklyXP), [students]
    );

    const totalXP = students.reduce((sum, s) => sum + s.xp, 0);
    const avgStreak = Math.round(students.reduce((sum, s) => sum + s.streak, 0) / students.length);
    const totalBadges = students.reduce((sum, s) => sum + s.badges.length, 0);

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-6">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="flex-1 text-lg font-bold">🏆 게이미피케이션</h1>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                        { label: '총 XP', value: totalXP.toLocaleString(), icon: <Star className="h-4 w-4 text-amber-500" /> },
                        { label: '평균 연속 출석', value: `${avgStreak}일`, icon: <Flame className="h-4 w-4 text-orange-500" /> },
                        { label: '획득 배지', value: totalBadges, icon: <Medal className="h-4 w-4 text-indigo-500" /> },
                        { label: '참여 학생', value: students.length, icon: <Users className="h-4 w-4 text-emerald-500" /> },
                    ].map((s) => (
                        <Card key={s.label} className="border-border/50">
                            <CardContent className="flex items-center gap-3 p-4">
                                {s.icon}
                                <div>
                                    <p className="text-xl font-bold">{s.value}</p>
                                    <p className="text-xs text-muted-foreground">{s.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs defaultValue="leaderboard">
                    <TabsList className="w-full justify-start">
                        <TabsTrigger value="leaderboard" className="gap-1 text-xs"><Trophy className="h-3 w-3" />리더보드</TabsTrigger>
                        <TabsTrigger value="badges" className="gap-1 text-xs"><Medal className="h-3 w-3" />배지 컬렉션</TabsTrigger>
                        <TabsTrigger value="weekly" className="gap-1 text-xs"><TrendingUp className="h-3 w-3" />주간 랭킹</TabsTrigger>
                    </TabsList>

                    {/* Leaderboard */}
                    <TabsContent value="leaderboard" className="mt-4 space-y-2">
                        {leaderboard.map((s, i) => (
                            <Card key={s.id} className={`border-border/50 transition-all ${i < 3 ? 'border-l-4' : ''}`}
                                style={i < 3 ? { borderLeftColor: ['#f59e0b', '#94a3b8', '#cd7f32'][i] } : {}}>
                                <CardContent className="flex items-center gap-4 p-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                                        style={{ backgroundColor: i < 3 ? ['#f59e0b20', '#94a3b820', '#cd7f3220'][i] : 'hsl(var(--accent))' }}>
                                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">{s.name}</p>
                                        <p className="text-xs text-muted-foreground">{s.class}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Flame className="h-3 w-3 text-orange-500" />
                                        <span className="text-xs">{s.streak}일</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">Lv.{xpToLevel(s.xp)}</Badge>
                                    <div className="w-20 text-right">
                                        <p className="text-sm font-bold text-indigo-500">{s.xp.toLocaleString()} XP</p>
                                        <div className="mt-1 h-1.5 w-full rounded-full bg-accent">
                                            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${levelProgress(s.xp)}%` }} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* Badges */}
                    <TabsContent value="badges" className="mt-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {BADGES.map((b) => {
                                const holders = students.filter((s) => s.badges.includes(b.id)).length;
                                return (
                                    <Card key={b.id} className="border-border/50 text-center">
                                        <CardContent className="p-4 space-y-2">
                                            <div className="text-3xl">{b.icon}</div>
                                            <p className="text-sm font-bold">{b.name}</p>
                                            <Badge style={{ backgroundColor: RARITY_COLORS[b.rarity] + '20', color: RARITY_COLORS[b.rarity] }} className="text-[10px]">
                                                {b.rarity.toUpperCase()}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">{b.description}</p>
                                            <Separator />
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">+{b.xpBonus} XP</span>
                                                <span className="text-muted-foreground">{holders}/{students.length} 획득</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* Weekly */}
                    <TabsContent value="weekly" className="mt-4 space-y-2">
                        {weeklyBoard.map((s, i) => (
                            <Card key={s.id} className="border-border/50">
                                <CardContent className="flex items-center gap-4 p-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold">{i + 1}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">{s.name}</p>
                                        <p className="text-xs text-muted-foreground">{s.class}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Zap className="h-3 w-3 text-amber-500" />
                                        <span className="text-sm font-bold text-amber-500">{s.weeklyXP} XP</span>
                                    </div>
                                    <div className="w-24">
                                        <div className="h-2 w-full rounded-full bg-accent">
                                            <div className="h-full rounded-full bg-amber-500" style={{ width: `${(s.weeklyXP / 250) * 100}%` }} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

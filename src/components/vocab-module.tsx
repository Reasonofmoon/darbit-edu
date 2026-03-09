'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Brain, BarChart2, Search, CheckCircle2 } from 'lucide-react';

// ── 더미 데이터 (Firebase 연동 전) ─────────────────────
const DUMMY_VOCAB = [
    {
        id: '1', word: 'salutations', definition: '인사, 경의', partOfSpeech: 'noun',
        contextSentence: '"Salutations!" said the voice. — Charlotte\'s Web',
        bookTitle: "Charlotte's Web",
        fsrsState: { due: new Date(Date.now() - 86400000).toISOString(), stability: 1, difficulty: 5, reps: 1, lapses: 0, state: 1 as const },
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
        id: '2', word: 'radiant', definition: '빛나는, 밝은', partOfSpeech: 'adj',
        contextSentence: 'The word RADIANT shimmered in the web.',
        bookTitle: "Charlotte's Web",
        fsrsState: { due: new Date(Date.now() + 2 * 86400000).toISOString(), stability: 4, difficulty: 3, reps: 3, lapses: 0, state: 2 as const },
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
        id: '3', word: 'humble', definition: '겸손한, 초라한', partOfSpeech: 'adj',
        contextSentence: '"Humble" was the last word Charlotte wove.',
        bookTitle: "Charlotte's Web",
        fsrsState: { due: new Date().toISOString(), stability: 2, difficulty: 4, reps: 2, lapses: 1, state: 2 as const },
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
        id: '4', word: 'languishing', definition: '시들어가는, 약해지는', partOfSpeech: 'verb',
        contextSentence: 'Wilbur was languishing in the yard.',
        bookTitle: "Charlotte's Web",
        fsrsState: { due: new Date(Date.now() + 86400000).toISOString(), stability: 0, difficulty: 7, reps: 0, lapses: 0, state: 0 as const },
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
        id: '5', word: 'magnificent', definition: '장엄한, 훌륭한', partOfSpeech: 'adj',
        contextSentence: 'What a magnificent pig!',
        bookTitle: "Charlotte's Web",
        fsrsState: { due: new Date(Date.now() - 2 * 86400000).toISOString(), stability: 21, difficulty: 2, reps: 8, lapses: 0, state: 2 as const },
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
];

type VocabCard = typeof DUMMY_VOCAB[0];

const STATE_LABELS: Record<number, string> = { 0: '신규', 1: '학습중', 2: '복습', 3: '재학습' };
const STATE_COLORS: Record<number, string> = {
    0: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    1: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    2: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    3: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const RATING_BUTTONS = [
    { label: '다시', rating: 1, cls: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20' },
    { label: '어렵다', rating: 2, cls: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/20' },
    { label: '알겠다', rating: 3, cls: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20' },
    { label: '쉬웠다', rating: 4, cls: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20' },
];

// ── 플래시카드 ───────────────────────────────────────
function FlashCard({ card, onRate }: { card: VocabCard; onRate: (rating: 1 | 2 | 3 | 4) => void }) {
    const [flipped, setFlipped] = useState(false);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* 카드 */}
            <div
                className="relative w-full max-w-md cursor-pointer"
                style={{ perspective: '1000px' }}
                onClick={() => setFlipped(f => !f)}
            >
                <div
                    style={{
                        transition: 'transform 0.45s',
                        transformStyle: 'preserve-3d',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        height: '220px',
                    }}
                >
                    {/* 앞면 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card p-6 text-center"
                        style={{ backfaceVisibility: 'hidden' }}>
                        <Badge className={`mb-3 text-[10px] border ${STATE_COLORS[card.fsrsState.state]}`}>
                            {STATE_LABELS[card.fsrsState.state]}
                        </Badge>
                        <p className="mb-1 text-3xl font-bold tracking-wide">{card.word}</p>
                        <p className="text-xs text-muted-foreground">{card.partOfSpeech}</p>
                        <p className="mt-4 text-xs text-muted-foreground/60 italic">탭하면 뜻을 확인</p>
                    </div>
                    {/* 뒷면 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <p className="mb-2 text-2xl font-bold text-indigo-300">{card.definition}</p>
                        <p className="text-xs text-muted-foreground">{card.partOfSpeech}</p>
                        <p className="mt-4 text-xs italic text-muted-foreground leading-relaxed">
                            "{card.contextSentence}"
                        </p>
                        <p className="mt-2 text-[10px] text-muted-foreground/50">{card.bookTitle}</p>
                    </div>
                </div>
            </div>

            {/* 평가 버튼 */}
            {flipped && (
                <div className="grid w-full max-w-md grid-cols-4 gap-2">
                    {RATING_BUTTONS.map(({ label, rating, cls }) => (
                        <button
                            key={rating}
                            onClick={() => { setFlipped(false); onRate(rating as 1 | 2 | 3 | 4); }}
                            className={`rounded-lg border py-2.5 text-sm font-medium transition-all ${cls}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── 메인 모듈 ─────────────────────────────────────────
export function VocabModule({ onBack }: { onBack: () => void }) {
    const [cards, setCards] = useState(DUMMY_VOCAB);
    const [dueIdx, setDueIdx] = useState(0);
    const [searchQ, setSearchQ] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'word' | 'due'>('due');
    const [doneToday, setDoneToday] = useState(0);

    const dueCards = useMemo(
        () => cards.filter(c => new Date(c.fsrsState.due) <= new Date()),
        [cards],
    );

    const sortedAll = useMemo(() => {
        const filtered = searchQ
            ? cards.filter(c => c.word.toLowerCase().includes(searchQ.toLowerCase()) || c.definition.includes(searchQ))
            : [...cards];
        return filtered.sort((a, b) => {
            if (sortBy === 'word') return a.word.localeCompare(b.word);
            if (sortBy === 'due') return a.fsrsState.due.localeCompare(b.fsrsState.due);
            return b.createdAt.localeCompare(a.createdAt);
        });
    }, [cards, searchQ, sortBy]);

    const stats = {
        total: cards.length,
        dueToday: dueCards.length,
        learned: cards.filter(c => c.fsrsState.reps >= 1).length,
        mastered: cards.filter(c => c.fsrsState.stability >= 21).length,
    };

    const handleRate = (_rating: 1 | 2 | 3 | 4) => {
        // TODO: FSRS 알고리즘 적용 후 Firebase 업데이트
        setDoneToday(d => d + 1);
        if (dueIdx + 1 < dueCards.length) {
            setDueIdx(i => i + 1);
        } else {
            setDueIdx(dueCards.length); // 완료
        }
    };

    const isSessionDone = dueIdx >= dueCards.length;

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-2xl items-center gap-4 px-4">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="flex-1 text-lg font-bold">🧠 어휘 복습</h1>
                    {dueCards.length > 0 && (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 border">
                            오늘 {dueCards.length}개
                        </Badge>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-6">
                <Tabs defaultValue="review">
                    <TabsList className="w-full justify-start mb-4">
                        <TabsTrigger value="review" className="gap-1 text-xs"><Brain className="h-3 w-3" />오늘 복습</TabsTrigger>
                        <TabsTrigger value="list" className="gap-1 text-xs"><BookOpen className="h-3 w-3" />내 단어장</TabsTrigger>
                        <TabsTrigger value="stats" className="gap-1 text-xs"><BarChart2 className="h-3 w-3" />통계</TabsTrigger>
                    </TabsList>

                    {/* 오늘 복습 탭 */}
                    <TabsContent value="review">
                        {dueCards.length === 0 ? (
                            <div className="py-16 text-center">
                                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                                <p className="font-semibold">오늘 복습할 단어가 없어요!</p>
                                <p className="text-sm text-muted-foreground mt-1">원서를 읽다가 모르는 단어를 추가해보세요.</p>
                            </div>
                        ) : isSessionDone ? (
                            <div className="py-16 text-center">
                                <p className="text-4xl mb-3">🎉</p>
                                <p className="font-bold text-lg">복습 완료!</p>
                                <p className="text-sm text-muted-foreground mt-1">오늘 {doneToday}개 단어를 복습했어요.</p>
                                <Button className="mt-4" onClick={() => { setDueIdx(0); setDoneToday(0); }}>
                                    다시 복습
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* 진행률 */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{dueIdx + 1} / {dueCards.length}</span>
                                    <div className="flex-1 mx-3 h-1.5 rounded-full bg-border">
                                        <div
                                            className="h-full rounded-full bg-indigo-500 transition-all"
                                            style={{ width: `${(dueIdx / dueCards.length) * 100}%` }}
                                        />
                                    </div>
                                    <span>{Math.round((dueIdx / dueCards.length) * 100)}%</span>
                                </div>
                                <FlashCard card={dueCards[dueIdx]} onRate={handleRate} />
                            </div>
                        )}
                    </TabsContent>

                    {/* 내 단어장 탭 */}
                    <TabsContent value="list" className="space-y-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                                    placeholder="단어 검색..." className="h-9 pl-9 text-sm" />
                            </div>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                                className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                                <option value="due">복습일순</option>
                                <option value="date">최신순</option>
                                <option value="word">단어순</option>
                            </select>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {sortedAll.map(card => {
                                const isDue = new Date(card.fsrsState.due) <= new Date();
                                return (
                                    <Card key={card.id} className="border-border/50">
                                        <CardContent className="p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-sm">{card.word}</span>
                                                <Badge className={`text-[10px] border ${STATE_COLORS[card.fsrsState.state]}`}>
                                                    {STATE_LABELS[card.fsrsState.state]}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{card.definition}</p>
                                            <p className="text-[10px] text-muted-foreground/60 mt-1">{card.bookTitle}</p>
                                            <div className="mt-2 flex items-center gap-1">
                                                {isDue
                                                    ? <span className="text-[10px] text-red-400 font-medium">🔴 복습 필요</span>
                                                    : <span className="text-[10px] text-muted-foreground/60">
                                                        복습: {new Date(card.fsrsState.due).toLocaleDateString('ko-KR')}
                                                    </span>
                                                }
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* 통계 탭 */}
                    <TabsContent value="stats" className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: '전체 단어', value: stats.total, color: 'text-foreground' },
                                { label: '오늘 복습', value: stats.dueToday, color: 'text-red-400' },
                                { label: '학습 완료', value: stats.learned, color: 'text-blue-400' },
                                { label: '마스터', value: stats.mastered, color: 'text-emerald-400' },
                            ].map(s => (
                                <Card key={s.label} className="border-border/50">
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <div>
                                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                            <p className="text-xs text-muted-foreground">{s.label}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            평균 기억 유지율:{' '}
                            <strong className="text-emerald-400">
                                {stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0}%
                            </strong>
                        </p>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

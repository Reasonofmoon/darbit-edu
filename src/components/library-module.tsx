'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowLeft, Library, Search, BookOpen, BookMarked, Clock, User,
    Plus, ArrowRightLeft, CheckCircle2, XCircle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────
interface Book {
    id: number;
    title: string;
    author: string;
    level: string;
    genre: string;
    isbn: string;
    copies: number;
    available: number;
    cover: string; // emoji
}

interface Checkout {
    id: number;
    bookId: number;
    studentName: string;
    studentClass: string;
    checkedOut: string;
    dueDate: string;
    returned: boolean;
    returnedDate?: string;
}

// ── Seed Data ────────────────────────────────────────────────
const BOOKS: Book[] = [
    { id: 1, title: 'Charlotte\'s Web', author: 'E.B. White', level: 'A2', genre: 'Fiction', isbn: '978-0061124952', copies: 3, available: 2, cover: '🕸️' },
    { id: 2, title: 'Matilda', author: 'Roald Dahl', level: 'A2-B1', genre: 'Fiction', isbn: '978-0142410370', copies: 4, available: 3, cover: '📚' },
    { id: 3, title: 'The Giver', author: 'Lois Lowry', level: 'B1', genre: 'Dystopian', isbn: '978-0544336261', copies: 3, available: 1, cover: '🌅' },
    { id: 4, title: 'Wonder', author: 'R.J. Palacio', level: 'B1', genre: 'Fiction', isbn: '978-0375869020', copies: 5, available: 4, cover: '⭐' },
    { id: 5, title: 'Holes', author: 'Louis Sachar', level: 'A2-B1', genre: 'Adventure', isbn: '978-0440414803', copies: 3, available: 2, cover: '🕳️' },
    { id: 6, title: 'The Outsiders', author: 'S.E. Hinton', level: 'B1-B2', genre: 'Fiction', isbn: '978-0142407332', copies: 2, available: 0, cover: '🏍️' },
    { id: 7, title: 'Animal Farm', author: 'George Orwell', level: 'B2', genre: 'Satire', isbn: '978-0451526342', copies: 4, available: 3, cover: '🐷' },
    { id: 8, title: 'The Little Prince', author: 'Saint-Exupéry', level: 'A2', genre: 'Fantasy', isbn: '978-0156012195', copies: 5, available: 5, cover: '🌹' },
    { id: 9, title: 'Diary of a Wimpy Kid', author: 'Jeff Kinney', level: 'A1-A2', genre: 'Humor', isbn: '978-0141324906', copies: 6, available: 5, cover: '📓' },
    { id: 10, title: '1984', author: 'George Orwell', level: 'B2', genre: 'Dystopian', isbn: '978-0451524935', copies: 3, available: 2, cover: '👁️' },
];

const SEED_CHECKOUTS: Checkout[] = [
    { id: 1, bookId: 1, studentName: '전주형', studentClass: 'Halfmoon A', checkedOut: '2026-02-25', dueDate: '2026-03-11', returned: false },
    { id: 2, bookId: 3, studentName: '김시연', studentClass: '가니메데', checkedOut: '2026-02-20', dueDate: '2026-03-06', returned: false },
    { id: 3, bookId: 6, studentName: '김정우', studentClass: '유로파 A', checkedOut: '2026-02-22', dueDate: '2026-03-08', returned: false },
    { id: 4, bookId: 6, studentName: '조유주', studentClass: '유로파 B', checkedOut: '2026-02-23', dueDate: '2026-03-09', returned: false },
    { id: 5, bookId: 3, studentName: '강현우', studentClass: '타이탄 B', checkedOut: '2026-02-18', dueDate: '2026-03-04', returned: true, returnedDate: '2026-03-03' },
];

const LEVEL_COLORS: Record<string, string> = {
    'A1': '#ef4444', 'A1-A2': '#f97316', 'A2': '#eab308', 'A2-B1': '#84cc16',
    'B1': '#22c55e', 'B1-B2': '#14b8a6', 'B2': '#3b82f6',
};

// ── Main Module ─────────────────────────────────────────────
export function LibraryModule({ onBack }: { onBack: () => void }) {
    const [books] = useState(BOOKS);
    const [checkouts, setCheckouts] = useState(SEED_CHECKOUTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [checkoutDialog, setCheckoutDialog] = useState<{ open: boolean; book?: Book }>({ open: false });
    const [checkoutName, setCheckoutName] = useState('');
    const [checkoutClass, setCheckoutClass] = useState('');

    const filteredBooks = useMemo(() => {
        return books.filter((b) => {
            const matchSearch = !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase());
            const matchLevel = levelFilter === 'all' || b.level === levelFilter;
            return matchSearch && matchLevel;
        });
    }, [books, searchQuery, levelFilter]);

    const activeCheckouts = checkouts.filter((c) => !c.returned);
    const overdueCount = activeCheckouts.filter((c) => new Date(c.dueDate) < new Date()).length;

    const handleCheckout = () => {
        if (!checkoutDialog.book || !checkoutName.trim()) return;
        const newCheckout: Checkout = {
            id: checkouts.length + 1,
            bookId: checkoutDialog.book.id,
            studentName: checkoutName,
            studentClass: checkoutClass,
            checkedOut: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            returned: false,
        };
        setCheckouts((prev) => [...prev, newCheckout]);
        setCheckoutDialog({ open: false });
        setCheckoutName('');
        setCheckoutClass('');
    };

    const handleReturn = (checkoutId: number) => {
        setCheckouts((prev) => prev.map((c) =>
            c.id === checkoutId ? { ...c, returned: true, returnedDate: new Date().toISOString().split('T')[0] } : c
        ));
    };

    const levels = [...new Set(books.map((b) => b.level))].sort();

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-6">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="flex-1 text-lg font-bold">📚 도서관 / LMS</h1>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                        { label: '전체 도서', value: books.length, icon: <Library className="h-4 w-4 text-indigo-500" /> },
                        { label: '대출 중', value: activeCheckouts.length, icon: <BookMarked className="h-4 w-4 text-amber-500" /> },
                        { label: '연체', value: overdueCount, icon: <Clock className="h-4 w-4 text-red-500" /> },
                        { label: '총 재고', value: books.reduce((s, b) => s + b.copies, 0), icon: <BookOpen className="h-4 w-4 text-emerald-500" /> },
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

                <Tabs defaultValue="catalog">
                    <TabsList className="w-full justify-start">
                        <TabsTrigger value="catalog" className="gap-1 text-xs"><BookOpen className="h-3 w-3" />도서 카탈로그</TabsTrigger>
                        <TabsTrigger value="checkouts" className="gap-1 text-xs"><ArrowRightLeft className="h-3 w-3" />대출/반납</TabsTrigger>
                    </TabsList>

                    {/* Catalog */}
                    <TabsContent value="catalog" className="mt-4 space-y-4">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="제목 또는 저자 검색..." className="h-9 pl-9 text-sm" />
                            </div>
                            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
                                className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                                <option value="all">전체 레벨</option>
                                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredBooks.map((book) => (
                                <Card key={book.id} className="border-border/50 transition-all hover:shadow-md">
                                    <CardContent className="p-4">
                                        <div className="flex gap-3">
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-accent text-2xl">
                                                {book.cover}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{book.title}</p>
                                                <p className="text-xs text-muted-foreground">{book.author}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge style={{ backgroundColor: (LEVEL_COLORS[book.level] || '#6366f1') + '20', color: LEVEL_COLORS[book.level] || '#6366f1' }}
                                                        className="text-[10px]">{book.level}</Badge>
                                                    <span className="text-[10px] text-muted-foreground">{book.genre}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {book.available > 0 ? `${book.available}/${book.copies} 대출가능` : '전부 대출중'}
                                            </span>
                                            <Button size="sm" variant={book.available > 0 ? 'default' : 'secondary'}
                                                disabled={book.available === 0} className="h-7 text-xs"
                                                onClick={() => setCheckoutDialog({ open: true, book })}>
                                                <Plus className="mr-1 h-3 w-3" />대출
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Checkouts */}
                    <TabsContent value="checkouts" className="mt-4 space-y-2">
                        {checkouts.filter(c => !c.returned).length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-8">현재 대출 중인 도서가 없습니다.</p>
                        )}
                        {checkouts.filter(c => !c.returned).map((co) => {
                            const book = books.find((b) => b.id === co.bookId);
                            const overdue = new Date(co.dueDate) < new Date();
                            return (
                                <Card key={co.id} className={`border-border/50 ${overdue ? 'border-l-4 border-l-red-500' : ''}`}>
                                    <CardContent className="flex items-center gap-4 p-3">
                                        <div className="text-2xl">{book?.cover}</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">{book?.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                <User className="mr-1 inline h-3 w-3" />{co.studentName} ({co.studentClass})
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs">{co.checkedOut} ~ {co.dueDate}</p>
                                            {overdue && <Badge variant="destructive" className="text-[10px]">연체</Badge>}
                                        </div>
                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReturn(co.id)}>
                                            <CheckCircle2 className="mr-1 h-3 w-3" />반납
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {checkouts.filter(c => c.returned).length > 0 && (
                            <>
                                <Separator className="my-4" />
                                <p className="text-xs text-muted-foreground font-semibold">반납 완료</p>
                                {checkouts.filter(c => c.returned).map((co) => {
                                    const book = books.find((b) => b.id === co.bookId);
                                    return (
                                        <Card key={co.id} className="border-border/50 opacity-60">
                                            <CardContent className="flex items-center gap-4 p-3">
                                                <div className="text-2xl">{book?.cover}</div>
                                                <div className="flex-1">
                                                    <p className="text-sm">{book?.title}</p>
                                                    <p className="text-xs text-muted-foreground">{co.studentName}</p>
                                                </div>
                                                <Badge variant="secondary" className="text-[10px]">✅ {co.returnedDate} 반납</Badge>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </main>

            {/* Checkout Dialog */}
            <Dialog open={checkoutDialog.open} onOpenChange={(open) => setCheckoutDialog((p) => ({ ...p, open }))}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>📖 도서 대출 — {checkoutDialog.book?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">학생 이름</label>
                            <Input value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} placeholder="이름" className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">반</label>
                            <Input value={checkoutClass} onChange={(e) => setCheckoutClass(e.target.value)} placeholder="반 이름" className="h-8 text-sm" />
                        </div>
                        <p className="text-xs text-muted-foreground">반납 예정일: {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}</p>
                        <Button className="w-full" onClick={handleCheckout} disabled={!checkoutName.trim()}>대출 확인</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

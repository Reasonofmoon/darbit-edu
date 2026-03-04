'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft, Upload, Wand2, Copy, BookOpen, CheckCircle2, MessageSquare,
    Loader2, HelpCircle,
} from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function WorksheetModule({ onBack }: { onBack: () => void }) {
    const [text, setText] = useState('');
    const [title, setTitle] = useState('');
    const [grade, setGrade] = useState('High School');
    const [loading, setLoading] = useState(false);
    const [worksheet, setWorksheet] = useState<any>(null);
    const [error, setError] = useState('');

    const generate = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/worksheet/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, title: title || 'Untitled', grade }),
            });
            if (!res.ok) throw new Error('Generation failed');
            const data = await res.json();
            setWorksheet(data.worksheet);
        } catch {
            setError('워크시트 생성에 실패했습니다. API 키를 확인하세요.');
        } finally {
            setLoading(false);
        }
    };

    const copyAll = () => {
        if (!worksheet) return;
        let out = `# ${worksheet.title}\n\n`;
        out += `## Vocabulary\n`;
        worksheet.vocabulary?.forEach((v: any, i: number) => {
            out += `${i + 1}. **${v.word}** (${v.partOfSpeech}) — ${v.definition}\n   _"${v.contextSentence}"_\n\n`;
        });
        out += `## Multiple Choice\n`;
        worksheet.multipleChoice?.forEach((q: any, i: number) => {
            out += `${i + 1}. ${q.question}\n${q.options?.join('\n')}\n\n`;
        });
        out += `## Short Answer\n`;
        worksheet.shortAnswer?.forEach((q: any, i: number) => {
            out += `${i + 1}. ${q.question}\n\n`;
        });
        out += `## Discussion\n`;
        worksheet.discussion?.forEach((d: any, i: number) => {
            out += `${i + 1}. ${d.prompt}\n`;
        });
        navigator.clipboard.writeText(out);
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-6">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="flex-1 text-lg font-bold">📄 워크시트 생성</h1>
                    <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500">Gemini Flash</Badge>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-6 py-6 space-y-6">
                {/* Input */}
                <Card className="border-border/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">텍스트 입력</CardTitle>
                        <CardDescription className="text-xs">교재/원서 텍스트를 붙여넣으세요. AI가 자동으로 워크시트를 생성합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs">제목</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="텍스트 제목" className="h-8 text-sm" />
                            </div>
                            <div className="w-40 space-y-1">
                                <Label className="text-xs">학년 수준</Label>
                                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm">
                                    <option>Elementary</option>
                                    <option>Middle School</option>
                                    <option>High School</option>
                                    <option>Advanced</option>
                                </select>
                            </div>
                        </div>
                        <textarea
                            className="w-full min-h-[200px] rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Once upon a time, in a land far away..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500" onClick={generate} disabled={loading || !text.trim()}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />생성중...</> : <><Wand2 className="mr-2 h-4 w-4" />워크시트 생성</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {error && <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">{error}</div>}

                {/* Generated Worksheet */}
                {worksheet && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">{worksheet.title}</h2>
                            <Button size="sm" variant="outline" onClick={copyAll}>
                                <Copy className="mr-1 h-3 w-3" /> 전체 복사
                            </Button>
                        </div>

                        {/* Vocabulary */}
                        {worksheet.vocabulary?.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-indigo-500" /> Vocabulary ({worksheet.vocabulary.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {worksheet.vocabulary.map((v: any, i: number) => (
                                        <div key={i} className="rounded-lg border border-border/30 p-3">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                                                <span className="font-semibold text-sm">{v.word}</span>
                                                <span className="text-xs text-muted-foreground">({v.partOfSpeech})</span>
                                            </div>
                                            <p className="text-sm mt-1">{v.definition}</p>
                                            {v.contextSentence && <p className="text-xs italic text-muted-foreground mt-1">"{v.contextSentence}"</p>}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Multiple Choice */}
                        {worksheet.multipleChoice?.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Multiple Choice ({worksheet.multipleChoice.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {worksheet.multipleChoice.map((q: any, i: number) => (
                                        <div key={i} className="space-y-2">
                                            <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                                            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 pl-4">
                                                {q.options?.map((opt: string, j: number) => (
                                                    <p key={j} className="text-sm text-muted-foreground">{opt}</p>
                                                ))}
                                            </div>
                                            {i < worksheet.multipleChoice.length - 1 && <Separator />}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Short Answer */}
                        {worksheet.shortAnswer?.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2"><HelpCircle className="h-4 w-4 text-amber-500" /> Short Answer ({worksheet.shortAnswer.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {worksheet.shortAnswer.map((q: any, i: number) => (
                                        <div key={i}><p className="text-sm">{i + 1}. {q.question}</p></div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Discussion */}
                        {worksheet.discussion?.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-violet-500" /> Discussion ({worksheet.discussion.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {worksheet.discussion.map((d: any, i: number) => (
                                        <div key={i} className="space-y-1">
                                            <p className="text-sm font-medium">{i + 1}. {d.prompt}</p>
                                            {d.guidingQuestions?.map((gq: string, j: number) => (
                                                <p key={j} className="text-xs text-muted-foreground pl-4">• {gq}</p>
                                            ))}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

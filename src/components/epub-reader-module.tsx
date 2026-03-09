'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Moon, Plus, Sun } from 'lucide-react';
import type Book from 'epubjs/types/book';
import type Contents from 'epubjs/types/contents';
import type Rendition from 'epubjs/types/rendition';
import type { Location } from 'epubjs/types/rendition';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface EpubReaderModuleProps {
    bookUrl: string;
    bookTitle: string;
    onBack: () => void;
    onVocabAdd?: (word: string, sentence: string) => void;
}

interface SelectionMenuState {
    cfiRange: string;
    text: string;
    sentence: string;
    x: number;
    y: number;
}

function clampFontSize(size: number): number {
    return Math.min(28, Math.max(14, size));
}

function extractSentence(contents: Contents): string {
    const selection = contents.window.getSelection();
    const anchorNode = selection?.anchorNode;
    const parent =
        anchorNode instanceof Element
            ? anchorNode
            : anchorNode?.parentElement ?? null;
    const text = parent?.closest('p, div, li, blockquote')?.textContent ?? parent?.textContent ?? '';

    return text.trim() || selection?.toString().trim() || '';
}

function getSelectionPosition(contents: Contents, container: HTMLElement): { x: number; y: number } | null {
    const selection = contents.window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const frameElement = contents.window.frameElement;

    if (!(frameElement instanceof HTMLElement)) {
        return null;
    }

    const frameRect = frameElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return {
        x: frameRect.left - containerRect.left + rect.left + rect.width / 2,
        y: frameRect.top - containerRect.top + rect.top - 12,
    };
}

function getChapterLabel(location: Location | null): string {
    const href = location?.start?.href ?? '';
    const matchedNumber = href.match(/(\d+)/);
    const chapterValue = matchedNumber?.[1] ?? String(location?.start?.displayed?.page ?? 1);
    return `Chapter ${chapterValue}`;
}

function applyTheme(rendition: Rendition, fontSize: number, darkMode: boolean): void {
    rendition.themes.fontSize(`${fontSize}px`);
    (rendition.themes as unknown as { override: (name: string, styles: Record<string, string>) => void }).override(
        'body',
        darkMode
            ? { background: '#1a1a2e', color: '#e0e0e0' }
            : { background: '#ffffff', color: '#000000' },
    );
}

export function EpubReaderModule({
    bookUrl,
    bookTitle,
    onBack,
    onVocabAdd,
}: EpubReaderModuleProps) {
    const viewerRef = useRef<HTMLDivElement | null>(null);
    const shellRef = useRef<HTMLDivElement | null>(null);
    const bookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);

    const [fontSize, setFontSize] = useState(18);
    const [darkMode, setDarkMode] = useState(false);
    const [progress, setProgress] = useState(0);
    const [chapterLabel, setChapterLabel] = useState('Chapter 1');
    const [selectionMenu, setSelectionMenu] = useState<SelectionMenuState | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!bookUrl || typeof window === 'undefined' || !viewerRef.current || !shellRef.current) {
            return;
        }

        let disposed = false;
        let removeRelocated: (() => void) | null = null;
        let removeSelected: (() => void) | null = null;

        const initialize = async () => {
            try {
                setErrorMessage('');
                setSelectionMenu(null);
                viewerRef.current!.innerHTML = '';

                const epubModule = await import('epubjs');
                if (disposed || !viewerRef.current) {
                    return;
                }

                const ePub = epubModule.default;
                const book = ePub(bookUrl);
                const rendition = book.renderTo('#epub-viewer', {
                    width: '100%',
                    height: '100%',
                });

                bookRef.current = book;
                renditionRef.current = rendition;

                const handleRelocated = (location: Location) => {
                    if (disposed) {
                        return;
                    }

                    const percentage = location.start?.percentage ?? 0;
                    setProgress(Number((percentage * 100).toFixed(0)));
                    setChapterLabel(getChapterLabel(location));
                    setSelectionMenu(null);
                };

                const handleSelected = (cfiRange: string, contents: Contents) => {
                    if (disposed || !shellRef.current) {
                        return;
                    }

                    const selectedText = contents.window.getSelection()?.toString().trim() ?? '';
                    const sentence = extractSentence(contents);
                    const position = getSelectionPosition(contents, shellRef.current);

                    if (!selectedText || !position) {
                        setSelectionMenu(null);
                        return;
                    }

                    setSelectionMenu({
                        cfiRange,
                        text: selectedText,
                        sentence,
                        x: position.x,
                        y: position.y,
                    });
                };

                rendition.on('relocated', handleRelocated);
                rendition.on('selected', handleSelected);
                removeRelocated = () => rendition.off('relocated', handleRelocated);
                removeSelected = () => rendition.off('selected', handleSelected);

                applyTheme(rendition, fontSize, darkMode);
                await rendition.display();
            } catch (error) {
                if (disposed) {
                    return;
                }

                const message = error instanceof Error ? error.message : 'EPUB을 불러오지 못했습니다.';
                setErrorMessage(message);
            }
        };

        void initialize();

        return () => {
            disposed = true;
            removeRelocated?.();
            removeSelected?.();
            renditionRef.current?.destroy();
            bookRef.current?.destroy();
            renditionRef.current = null;
            bookRef.current = null;
        };
    }, [bookUrl]);

    useEffect(() => {
        if (!renditionRef.current) {
            return;
        }

        applyTheme(renditionRef.current, fontSize, darkMode);
    }, [fontSize, darkMode]);

    useEffect(() => {
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                void renditionRef.current?.prev();
            }
            if (event.key === 'ArrowRight') {
                void renditionRef.current?.next();
            }
        };

        document.addEventListener('keydown', handleKeydown);
        return () => document.removeEventListener('keydown', handleKeydown);
    }, []);

    if (!bookUrl) {
        return (
            <div className="min-h-screen bg-background">
                <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                    <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="flex-1 truncate text-lg font-bold">{bookTitle}</h1>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled>A-</Button>
                            <Button variant="outline" size="sm" disabled>A+</Button>
                            <Button variant="outline" size="icon" disabled>
                                <Sun className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl px-4 py-10">
                    <Card className="border-dashed border-border/70 bg-card/60">
                        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                            <div className="text-4xl">📚</div>
                            <p className="text-lg font-semibold">EPUB 파일 URL을 설정하세요</p>
                            <p className="text-sm text-muted-foreground">
                                데모 환경에서는 `bookUrl`에 공개 EPUB 주소를 넣으면 바로 리더가 열립니다.
                            </p>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="flex-1 truncate text-lg font-bold">{bookTitle}</h1>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFontSize((current) => clampFontSize(current - 2))}
                        >
                            A-
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFontSize((current) => clampFontSize(current + 2))}
                        >
                            A+
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDarkMode((current) => !current)}
                            aria-label={darkMode ? '라이트 모드' : '다크 모드'}
                        >
                            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-4">
                <div
                    ref={shellRef}
                    className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
                >
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <Badge variant="outline" className="text-xs">{chapterLabel}</Badge>
                        <Badge variant="secondary" className="text-xs">{fontSize}px</Badge>
                    </div>

                    <div className="relative h-[calc(100vh-12rem)] min-h-[560px] bg-background">
                        <div id="epub-viewer" ref={viewerRef} className="h-full w-full" />

                        {errorMessage && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-6">
                                <Card className="w-full max-w-md border-red-500/20">
                                    <CardContent className="space-y-2 p-6 text-center">
                                        <p className="text-lg font-semibold text-red-400">EPUB 로드 실패</p>
                                        <p className="text-sm text-muted-foreground">{errorMessage}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {selectionMenu && (
                            <div
                                className="absolute z-20 flex -translate-x-1/2 gap-2 rounded-full border border-border/60 bg-background/95 p-2 shadow-lg backdrop-blur"
                                style={{ left: selectionMenu.x, top: selectionMenu.y }}
                            >
                                <Button
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => {
                                        onVocabAdd?.(selectionMenu.text, selectionMenu.sentence);
                                        setSelectionMenu(null);
                                        renditionRef.current?.annotations.remove(selectionMenu.cfiRange, 'highlight');
                                    }}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    단어장 추가
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const query = encodeURIComponent(selectionMenu.text);
                                        window.open(`https://dictionary.cambridge.org/dictionary/english/${query}`, '_blank', 'noopener,noreferrer');
                                    }}
                                >
                                    📖 사전
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
                        <Button variant="outline" className="gap-1" onClick={() => void renditionRef.current?.prev()}>
                            <ChevronLeft className="h-4 w-4" />
                            이전
                        </Button>
                        <Button variant="outline" className="gap-1" onClick={() => void renditionRef.current?.next()}>
                            다음
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </main>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/92 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                            {chapterLabel} | {progress}%
                        </p>
                        <Progress value={progress} className="mt-2 h-2" />
                    </div>
                    <Badge variant="secondary">{progress}%</Badge>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CalendarDays,
    Filter,
    Save,
    Copy,
    MessageSquare,
    ChevronDown,
    ChevronRight,
    Check,
    Users,
    TrendingUp,
    ClipboardCheck,
    ArrowLeft,
} from 'lucide-react';
import {
    Student,
    HomeworkEntry,
    StudentProgress,
    SEED_STUDENTS,
    isSpecialClass,
    createDefaultHomework,
    createDefaultProgress,
} from '@/lib/homework-types';

function getToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Feedback Generator ───────────────────────────────────────
function generateParentFeedback(student: Student, hw: HomeworkEntry, progress: StudentProgress): string {
    const today = new Date();
    const dateStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const special = isSpecialClass(student.class);
    let fb = `📚 ${student.name} 학생 오늘의 학습 결과 (${dateStr})\n\n`;
    fb += `안녕하세요, ${student.name} 학생의 학부모님! 오늘 학습 결과를 말씀드립니다.\n\n`;
    fb += `👤 학생 정보\n• 이름: ${student.name}\n• 학교: ${student.school}\n• 학년: ${student.grade}\n• 반: ${student.class}\n\n`;
    fb += `📝 오늘의 학습 활동\n`;

    if (special) {
        if (hw.vocabularyTest) fb += `• 어휘시험: ${hw.vocabularyTest} (${hw.vocabularyPass ? '✅ 합격' : '❌ 미달'})\n`;
        if (hw.phonics) fb += `• 소리 훈련: ${hw.phonics} (${hw.phonicsPass ? '✅ 합격' : '❌ 미달'})\n`;
        if (hw.reading) fb += `• 원서 수업: ${hw.reading}\n`;
        if (hw.grammar) fb += `• 문법 학습: ${hw.grammar} (${hw.grammarComplete ? '✅ 완료' : '❌ 미완료'})\n`;
        if (hw.quizletEnabled && hw.quizletUrl) fb += `• 퀴즐릿: ${hw.quizletPass ? '✅ 합격' : '❌ 미달'}\n`;
    } else {
        if (hw.vocabulary) fb += `• 어휘 학습: ${hw.vocabulary}\n`;
        if (hw.phonics) fb += `• 소리 훈련: ${hw.phonics}\n`;
        if (hw.reading) fb += `• 독서/원서: ${hw.reading}\n`;
        if (hw.other) fb += `• 기타 활동: ${hw.other}\n`;
    }

    fb += `\n📊 현재 진도\n• 어휘: Unit ${progress.vocabulary.currentUnit} - Stage ${progress.vocabulary.currentStage}\n`;

    // completion rate
    let done = 0, total = 0;
    if (special) {
        if (hw.vocabularyTest) { total++; if (hw.vocabularyPass) done++; }
        if (hw.phonics) { total++; if (hw.phonicsPass) done++; }
        if (hw.reading) { total++; done++; }
        if (hw.grammar) { total++; if (hw.grammarComplete) done++; }
        if (hw.quizletEnabled) { total++; if (hw.quizletPass) done++; }
    } else {
        if (hw.vocabulary) { total++; done++; }
        if (hw.phonics) { total++; done++; }
        if (hw.reading) { total++; done++; }
        if (hw.other) { total++; done++; }
    }
    const rate = total > 0 ? Math.round((done / total) * 100) : 100;
    fb += `\n🎯 종합 평가\n`;
    if (rate >= 90) fb += `• 🌟 우수: 모든 학습 활동을 훌륭하게 수행했습니다! (${rate}%)\n`;
    else if (rate >= 70) fb += `• 👍 양호: 대부분 잘 수행했습니다. (${rate}%)\n`;
    else fb += `• 📢 관심필요: 학습 참여도가 아쉽습니다. (${rate}%)\n`;

    if (hw.feedback?.trim()) fb += `\n💬 선생님 피드백\n${hw.feedback}\n`;
    fb += `\n📞 문의사항이 있으시면 연락주세요. 감사합니다. 😊\n`;
    return fb;
}

// ── Student Card ─────────────────────────────────────────────
function StudentCard({
    student,
    homework,
    progress,
    onUpdate,
    onCopyFeedback,
    onFinalize,
}: {
    student: Student;
    homework: HomeworkEntry;
    progress: StudentProgress;
    onUpdate: (field: keyof HomeworkEntry, value: string | boolean) => void;
    onCopyFeedback: () => void;
    onFinalize: () => void;
}) {
    const special = isSpecialClass(student.class);

    return (
        <Card className="border-border/50 transition-all hover:shadow-md">
            {/* Header */}
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">{student.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            {student.school} {student.grade}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            Unit {progress.vocabulary.currentUnit}-{progress.vocabulary.currentStage}차
                        </Badge>
                        {homework.finalized && (
                            <Badge className="bg-emerald-500/10 text-emerald-500">✅ 완료</Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Homework fields */}
                {special ? (
                    <>
                        <HwField label="📝 어휘시험" value={homework.vocabularyTest} onChange={(v) => onUpdate('vocabularyTest', v)} />
                        <HwField label="🔤 소리" value={homework.phonics} onChange={(v) => onUpdate('phonics', v)} />
                        <HwField label="📚 원서수업" value={homework.reading} onChange={(v) => onUpdate('reading', v)} />
                        <HwField label="📖 문법" value={homework.grammar} onChange={(v) => onUpdate('grammar', v)} />

                        {/* Evaluation checkboxes */}
                        <div className="flex flex-wrap gap-3 pt-2">
                            <CheckField label="어휘합격" checked={homework.vocabularyPass} onChange={(v) => onUpdate('vocabularyPass', v)} />
                            <CheckField label="소리합격" checked={homework.phonicsPass} onChange={(v) => onUpdate('phonicsPass', v)} />
                            <CheckField label="퀴즐릿합격" checked={homework.quizletPass} onChange={(v) => onUpdate('quizletPass', v)} />
                            <CheckField label="문법완료" checked={homework.grammarComplete} onChange={(v) => onUpdate('grammarComplete', v)} />
                        </div>
                    </>
                ) : (
                    <>
                        <HwField label="📝 어휘" value={homework.vocabulary} onChange={(v) => onUpdate('vocabulary', v)} />
                        <HwField label="🔤 소리" value={homework.phonics} onChange={(v) => onUpdate('phonics', v)} />
                        <HwField label="📚 독서/원서" value={homework.reading} onChange={(v) => onUpdate('reading', v)} />
                        <HwField label="📋 기타" value={homework.other} onChange={(v) => onUpdate('other', v)} />
                    </>
                )}

                {/* Feedback */}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">💬 피드백</Label>
                    <textarea
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        rows={2}
                        placeholder="학생 피드백..."
                        value={homework.feedback}
                        onChange={(e) => onUpdate('feedback', e.target.value)}
                    />
                </div>

                {/* Actions */}
                <Separator />
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onCopyFeedback}>
                        <MessageSquare className="mr-1 h-3 w-3" /> 부모님 피드백
                    </Button>
                    {!homework.finalized ? (
                        <Button size="sm" className="flex-1 bg-emerald-600 text-xs hover:bg-emerald-500" onClick={onFinalize}>
                            <Check className="mr-1 h-3 w-3" /> 최종완료
                        </Button>
                    ) : (
                        <Button size="sm" variant="secondary" className="flex-1 text-xs" disabled>
                            ✅ 완료됨
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function HwField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input
                className="h-8 text-sm"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`${label} 입력`}
            />
        </div>
    );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border"
            />
            <span className={checked ? 'text-emerald-500' : 'text-muted-foreground'}>{label}</span>
        </label>
    );
}

// ── Main Homework Page ───────────────────────────────────────
export function HomeworkModule({ onBack }: { onBack: () => void }) {
    const [date, setDate] = useState(getToday());
    const [classFilter, setClassFilter] = useState('all');
    const [students] = useState<Student[]>(SEED_STUDENTS);
    const [homeworkData, setHomeworkData] = useState<Record<string, Record<number, HomeworkEntry>>>({});
    const [progressData, setProgressData] = useState<Record<number, StudentProgress>>({});
    const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; text: string; studentName: string }>({ open: false, text: '', studentName: '' });
    const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(new Set());
    const [notification, setNotification] = useState('');

    const showNotification = useCallback((msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(''), 3000);
    }, []);

    const getHomework = useCallback((studentId: number): HomeworkEntry => {
        return homeworkData[date]?.[studentId] ?? createDefaultHomework();
    }, [homeworkData, date]);

    const getProgress = useCallback((studentId: number): StudentProgress => {
        return progressData[studentId] ?? createDefaultProgress();
    }, [progressData]);

    const updateHomework = useCallback((studentId: number, field: keyof HomeworkEntry, value: string | boolean) => {
        setHomeworkData((prev) => {
            const dateData = { ...prev[date] };
            const current = dateData[studentId] ?? createDefaultHomework();
            dateData[studentId] = { ...current, [field]: value };
            return { ...prev, [date]: dateData };
        });
    }, [date]);

    const finalizeStudent = useCallback((studentId: number) => {
        updateHomework(studentId, 'finalized', true);
        updateHomework(studentId, 'finalizedAt', new Date().toISOString());
        const student = students.find((s) => s.id === studentId);
        showNotification(`${student?.name} 학생이 최종 완료되었습니다!`);
    }, [students, updateHomework, showNotification]);

    const copyFeedback = useCallback((student: Student) => {
        const hw = getHomework(student.id);
        const prog = getProgress(student.id);
        const text = generateParentFeedback(student, hw, prog);
        setFeedbackDialog({ open: true, text, studentName: student.name });
    }, [getHomework, getProgress]);

    const classData = useMemo(() => {
        const map: Record<string, Student[]> = {};
        students.forEach((s) => {
            if (!map[s.class]) map[s.class] = [];
            map[s.class].push(s);
        });
        return map;
    }, [students]);

    const classList = useMemo(() => Object.keys(classData).sort(), [classData]);

    const stats = useMemo(() => {
        let completed = 0;
        students.forEach((s) => {
            const hw = getHomework(s.id);
            const special = isSpecialClass(s.class);
            if (special) {
                if (hw.vocabularyTest || hw.phonics || hw.reading || hw.grammar) completed++;
            } else {
                if (hw.vocabulary || hw.phonics || hw.reading || hw.other) completed++;
            }
        });
        const rate = students.length > 0 ? Math.round((completed / students.length) * 100) : 0;
        return { total: students.length, completed, rate };
    }, [students, getHomework]);

    const toggleClass = (cls: string) => {
        setCollapsedClasses((prev) => {
            const next = new Set(prev);
            if (next.has(cls)) next.delete(cls);
            else next.add(cls);
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Notification Toast */}
            {notification && (
                <div className="fixed right-4 top-4 z-50 animate-in fade-in slide-in-from-top-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
                    {notification}
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-6">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold">📋 숙제 관리</h1>
                    </div>

                    {/* Date picker */}
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-8 w-40 text-sm"
                        />
                    </div>

                    {/* Class filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="h-8 rounded-md border border-border bg-background px-2 text-sm"
                        >
                            <option value="all">전체 반</option>
                            {classList.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <Button size="sm" variant="outline" onClick={() => showNotification('모든 데이터가 저장되었습니다!')}>
                        <Save className="mr-1 h-3 w-3" /> 저장
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-6">
                {/* Quick Stats */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                    <Card className="border-border/50">
                        <CardContent className="flex items-center gap-3 p-3">
                            <Users className="h-5 w-5 text-indigo-500" />
                            <div>
                                <p className="text-xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">전체 학생</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50">
                        <CardContent className="flex items-center gap-3 p-3">
                            <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                            <div>
                                <p className="text-xl font-bold">{stats.completed}</p>
                                <p className="text-xs text-muted-foreground">입력 완료</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50">
                        <CardContent className="flex items-center gap-3 p-3">
                            <TrendingUp className="h-5 w-5 text-amber-500" />
                            <div>
                                <p className="text-xl font-bold">{stats.rate}%</p>
                                <p className="text-xs text-muted-foreground">완료율</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Class sections */}
                {classList
                    .filter((c) => classFilter === 'all' || c === classFilter)
                    .map((className) => {
                        const classStudents = classData[className];
                        const collapsed = collapsedClasses.has(className);

                        return (
                            <div key={className} className="mb-6">
                                {/* Class header */}
                                <button
                                    className="mb-3 flex w-full items-center gap-2 text-left"
                                    onClick={() => toggleClass(className)}
                                >
                                    {collapsed ? (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <h2 className="text-sm font-semibold">{className}</h2>
                                    <Badge variant="secondary" className="text-xs">
                                        {classStudents.length}명
                                    </Badge>
                                    {isSpecialClass(className) && (
                                        <Badge className="bg-violet-500/10 text-violet-500 text-xs">특별반</Badge>
                                    )}
                                </button>

                                {/* Student cards grid */}
                                {!collapsed && (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {classStudents.map((student) => (
                                            <StudentCard
                                                key={student.id}
                                                student={student}
                                                homework={getHomework(student.id)}
                                                progress={getProgress(student.id)}
                                                onUpdate={(field, value) => updateHomework(student.id, field, value)}
                                                onCopyFeedback={() => copyFeedback(student)}
                                                onFinalize={() => finalizeStudent(student.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </main>

            {/* Feedback Dialog */}
            <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog((p) => ({ ...p, open }))}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>📨 {feedbackDialog.studentName} 부모님 피드백</DialogTitle>
                    </DialogHeader>
                    <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-accent p-4 text-xs leading-relaxed">
                        {feedbackDialog.text}
                    </pre>
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(feedbackDialog.text);
                                showNotification('클립보드에 복사되었습니다!');
                            }}
                        >
                            <Copy className="mr-1 h-3 w-3" /> 클립보드 복사
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ClipboardCheck,
    FileText,
    GraduationCap,
    BarChart3,
    BookOpen,
    Brain,
    Trophy,
    Library,
    Moon,
    Sun,
    LogOut,
    ChevronRight,
    Users,
    TrendingUp,
    Calendar,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface NavItem {
    id: string;
    label: string;
    labelKo: string;
    icon: React.ReactNode;
    badge?: string;
    description: string;
}

const NAV_ITEMS: NavItem[] = [
    {
        id: 'homework',
        label: 'Homework',
        labelKo: '숙제 관리',
        icon: <ClipboardCheck className="h-5 w-5" />,
        description: '학생별 숙제 입력, 관리, 부모님 피드백 생성',
    },
    {
        id: 'level-test',
        label: 'Level Test',
        labelKo: '레벨 테스트',
        icon: <BarChart3 className="h-5 w-5" />,
        description: 'CEFR 기반 5단계 영어 레벨 진단',
    },
    {
        id: 'exam-analysis',
        label: 'Exam Analysis',
        labelKo: '문항 분석',
        icon: <FileText className="h-5 w-5" />,
        badge: 'AI',
        description: '이원목적분류표 + 블룸 분류학 AI 분석',
    },
    {
        id: 'worksheet',
        label: 'Worksheet',
        labelKo: '워크시트',
        icon: <BookOpen className="h-5 w-5" />,
        badge: 'AI',
        description: '텍스트/교재로부터 워크시트 자동 생성',
    },
    {
        id: 'gamification',
        label: 'Gamification',
        labelKo: '게이미피케이션',
        icon: <Trophy className="h-5 w-5" />,
        badge: 'NEW',
        description: '포인트, 배지, 리더보드 보상 시스템',
    },
    {
        id: 'meta-questions',
        label: 'Meta Questions',
        labelKo: '메타인지',
        icon: <Brain className="h-5 w-5" />,
        badge: 'NEW',
        description: '학습 활동 후 메타인지 질문 자동 생성',
    },
    {
        id: 'library',
        label: 'Library',
        labelKo: '도서관/LMS',
        icon: <Library className="h-5 w-5" />,
        badge: 'NEW',
        description: '도서 카탈로그, 대출/반납, 독서 로그',
    },
];

export function DashboardHome({ onNavigate }: { onNavigate: (moduleId: string) => void }) {
    const { profile, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const [activeModule, setActiveModule] = useState<string | null>(null);

    const quickStats = [
        { label: '등록 학생', value: '48', icon: <Users className="h-4 w-4" />, trend: '+3' },
        { label: '이번주 숙제', value: '24', icon: <ClipboardCheck className="h-4 w-4" />, trend: '진행중' },
        { label: '완료율', value: '87%', icon: <TrendingUp className="h-4 w-4" />, trend: '+5%' },
        { label: '오늘 일정', value: '6', icon: <Calendar className="h-4 w-4" />, trend: '수업' },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">달빛에듀</h1>
                            <p className="text-xs text-muted-foreground">DalbitEdu Platform</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="hover:bg-accent"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2 px-2">
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage src={profile?.photoURL} />
                                        <AvatarFallback className="bg-indigo-600 text-xs text-white">
                                            {profile?.displayName?.charAt(0) || 'T'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{profile?.displayName || '교사'}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onNavigate('settings')}>
                                    ⚙️ 설정
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={signOut}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    로그아웃
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight">
                        안녕하세요, {profile?.displayName || '선생님'} 👋
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                        오늘도 학생들의 성장을 위해 달빛에듀와 함께해요.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {quickStats.map((stat) => (
                        <Card key={stat.label} className="border-border/50">
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                                {stat.trend && (
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                        {stat.trend}
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Separator className="mb-8" />

                {/* Module Grid */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">교육 모듈</h3>
                    <p className="text-sm text-muted-foreground">사용할 모듈을 선택하세요</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {NAV_ITEMS.map((item) => (
                        <Card
                            key={item.id}
                            className={`group cursor-pointer border-border/50 transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 ${activeModule === item.id ? 'border-indigo-500 ring-1 ring-indigo-500/30' : ''
                                }`}
                            onClick={() => {
                                onNavigate(item.id);
                            }}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-500 group-hover:from-indigo-500/20 group-hover:to-violet-500/20">
                                        {item.icon}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.badge && (
                                            <Badge
                                                variant={item.badge === 'NEW' ? 'default' : 'secondary'}
                                                className={
                                                    item.badge === 'NEW'
                                                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                                        : item.badge === 'AI'
                                                            ? 'bg-violet-500/10 text-violet-500 hover:bg-violet-500/20'
                                                            : ''
                                                }
                                            >
                                                {item.badge}
                                            </Badge>
                                        )}
                                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                                <CardTitle className="mt-3 text-base">{item.labelKo}</CardTitle>
                                <CardDescription className="text-xs">{item.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                {/* Coming Soon placeholder */}
                {activeModule && (
                    <Card className="mt-8 border-dashed border-indigo-500/30 bg-indigo-500/5">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                                {NAV_ITEMS.find((n) => n.id === activeModule)?.icon}
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                {NAV_ITEMS.find((n) => n.id === activeModule)?.labelKo}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                이 모듈은 다음 스프린트에서 구현됩니다.
                            </p>
                            <Badge variant="outline" className="mt-3">
                                Phase 1 — Week {activeModule === 'homework' ? '2' : activeModule === 'level-test' ? '3' : activeModule === 'exam-analysis' || activeModule === 'worksheet' ? '4' : '5-8'}
                            </Badge>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}

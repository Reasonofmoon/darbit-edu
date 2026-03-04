'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';

export function LoginPage() {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, demoMode } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const firebaseReady = (() => {
        const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        return !!key && key !== 'your-firebase-api-key' && key.length > 10;
    })();

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSignUp) {
                await signUpWithEmail(email, password, displayName);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
            {/* Floating orbs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
                <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
            </div>

            <Card className="relative w-full max-w-md border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-sm">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                        <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">
                        달빛에듀
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        AI 기반 영어교육 통합 플랫폼
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Demo Mode Button — always available when Firebase is not configured */}
                    {!firebaseReady && (
                        <Button
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
                            onClick={() => signInWithEmail('demo', 'demo')}
                        >
                            🚀 데모 모드로 시작
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        className="w-full border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700"
                        onClick={signInWithGoogle}
                    >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google로 로그인
                    </Button>

                    <div className="relative">
                        <Separator className="bg-slate-700" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-3 text-xs text-slate-500">
                            또는
                        </span>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-3">
                        {isSignUp && (
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-slate-300">이름</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <Input
                                        id="name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500"
                                        placeholder="홍길동"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-slate-300">이메일</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500"
                                    placeholder="teacher@school.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-slate-300">비밀번호</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-400">{error}</p>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500"
                        >
                            {loading ? '처리중...' : isSignUp ? '회원가입' : '로그인'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-400">
                        {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
                        <button
                            className="text-indigo-400 hover:text-indigo-300 underline"
                            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                        >
                            {isSignUp ? '로그인' : '회원가입'}
                        </button>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

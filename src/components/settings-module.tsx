'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft, Key, Palette, Building2, Save, CheckCircle2, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface AcademySettings {
    academyName: string;
    academyId: string;
    ownerEmail: string;
    apiKeys: {
        gemini: string;
        claude: string;
        openai: string;
    };
}

export function SettingsModule({ onBack }: { onBack: () => void }) {
    const { profile } = useAuth();
    const [settings, setSettings] = useState<AcademySettings>({
        academyName: '달빛학원',
        academyId: 'dalbit-default',
        ownerEmail: profile?.email || '',
        apiKeys: { gemini: '', claude: '', openai: '' },
    });
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // In production: save to Firestore under tenant doc
        localStorage.setItem('dalbit-settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    useEffect(() => {
        const stored = localStorage.getItem('dalbit-settings');
        if (stored) {
            try { setSettings(JSON.parse(stored)); } catch { /* ignore */ }
        }
    }, []);

    const toggleShow = (key: string) => setShowKeys(p => ({ ...p, [key]: !p[key] }));

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-6">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="flex-1 text-lg font-bold">⚙️ 설정</h1>
                    <Button size="sm" onClick={handleSave}>
                        {saved ? <><CheckCircle2 className="mr-1 h-3 w-3" />저장됨</> : <><Save className="mr-1 h-3 w-3" />저장</>}
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 py-6 space-y-6">
                <Tabs defaultValue="academy">
                    <TabsList className="w-full justify-start">
                        <TabsTrigger value="academy" className="gap-1 text-xs"><Building2 className="h-3 w-3" />학원 정보</TabsTrigger>
                        <TabsTrigger value="api-keys" className="gap-1 text-xs"><Key className="h-3 w-3" />API 키</TabsTrigger>
                    </TabsList>

                    <TabsContent value="academy" className="mt-4 space-y-4">
                        <Card className="border-border/50">
                            <CardHeader className="pb-3"><CardTitle className="text-sm">학원 정보</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">학원 이름</Label>
                                    <Input value={settings.academyName} onChange={(e) => setSettings(p => ({ ...p, academyName: e.target.value }))} className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">학원 ID (Firestore tenant)</Label>
                                    <Input value={settings.academyId} onChange={(e) => setSettings(p => ({ ...p, academyId: e.target.value }))} className="h-8 text-sm font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">관리자 이메일</Label>
                                    <Input value={settings.ownerEmail} onChange={(e) => setSettings(p => ({ ...p, ownerEmail: e.target.value }))} className="h-8 text-sm" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50">
                            <CardHeader className="pb-3"><CardTitle className="text-sm">프로필</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p><span className="text-muted-foreground">이름:</span> {profile?.displayName || '설정되지 않음'}</p>
                                <p><span className="text-muted-foreground">이메일:</span> {profile?.email || '설정되지 않음'}</p>
                                <p><span className="text-muted-foreground">역할:</span> <Badge variant="outline">{profile?.role || 'teacher'}</Badge></p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="api-keys" className="mt-4 space-y-4">
                        <Card className="border-border/50">
                            <CardHeader className="pb-3"><CardTitle className="text-sm">Multi-LLM API 키</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { id: 'gemini', label: 'Google Gemini (3.5)', desc: '레벨테스트, 워크시트, 메타인지 질문' },
                                    { id: 'claude', label: 'Anthropic Claude (4.6/4.8)', desc: '수능 문항 분석, 피드백 생성' },
                                    { id: 'openai', label: 'OpenAI GPT-5.5', desc: '부모님 피드백, 학습 추천' },
                                ].map((provider) => (
                                    <div key={provider.id} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">{provider.label}</Label>
                                            <span className="text-[10px] text-muted-foreground">{provider.desc}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type={showKeys[provider.id] ? 'text' : 'password'}
                                                value={settings.apiKeys[provider.id as keyof typeof settings.apiKeys]}
                                                onChange={(e) => setSettings(p => ({ ...p, apiKeys: { ...p.apiKeys, [provider.id]: e.target.value } }))}
                                                className="h-8 text-sm font-mono"
                                                placeholder={`${provider.label} API Key`}
                                            />
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleShow(provider.id)}>
                                                {showKeys[provider.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Separator />
                                <p className="text-xs text-muted-foreground">
                                    💡 API 키는 로컬 브라우저에 저장됩니다. 프로덕션 배포 시 환경변수(.env)로 관리합니다.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

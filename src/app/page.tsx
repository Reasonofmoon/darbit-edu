'use client';

import { useAuth } from '@/lib/auth-context';
import { LoginPage } from '@/components/login-page';
import { DashboardHome } from '@/components/dashboard-home';
import { HomeworkModule } from '@/components/homework-module';
import { LevelTestModule } from '@/components/leveltest-module';
import { ExamAnalysisModule } from '@/components/exam-analysis-module';
import { WorksheetModule } from '@/components/worksheet-module';
import { GamificationModule } from '@/components/gamification-module';
import { MetaQuestionModule } from '@/components/meta-question-module';
import { LibraryModule } from '@/components/library-module';
import { SettingsModule } from '@/components/settings-module';
import { ErrorBoundary } from '@/components/error-boundary';
import { useState } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const [activeModule, setActiveModule] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">달빛에듀 로딩중...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const back = () => setActiveModule(null);

  const moduleContent = (() => {
    switch (activeModule) {
      case 'homework': return <HomeworkModule onBack={back} />;
      case 'level-test': return <LevelTestModule onBack={back} />;
      case 'exam-analysis': return <ExamAnalysisModule onBack={back} />;
      case 'worksheet': return <WorksheetModule onBack={back} />;
      case 'gamification': return <GamificationModule onBack={back} />;
      case 'meta-questions': return <MetaQuestionModule onBack={back} />;
      case 'library': return <LibraryModule onBack={back} />;
      case 'settings': return <SettingsModule onBack={back} />;
      default: return <DashboardHome onNavigate={setActiveModule} />;
    }
  })();

  return <ErrorBoundary>{moduleContent}</ErrorBoundary>;
}

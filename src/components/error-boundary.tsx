'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-background p-6">
                    <Card className="max-w-md border-red-500/30">
                        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                            <AlertTriangle className="h-12 w-12 text-red-500" />
                            <h2 className="text-xl font-bold">오류가 발생했습니다</h2>
                            <p className="text-sm text-muted-foreground">
                                {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
                            </p>
                            <Button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>
                                <RefreshCw className="mr-2 h-4 w-4" /> 새로고침
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }
        return this.props.children;
    }
}

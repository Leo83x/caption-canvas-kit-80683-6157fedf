import { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <Card className="p-8 max-w-md w-full text-center space-y-4">
                        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                        <h2 className="text-2xl font-bold">Algo deu errado</h2>
                        <p className="text-muted-foreground">
                            Desculpe, ocorreu um erro inesperado. Por favor, tente novamente.
                        </p>
                        {this.state.error && (
                            <details open className="text-left text-sm">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                    Detalhes técnicos
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-2 justify-center">
                            <Button onClick={this.handleReset}>
                                Tentar Novamente
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = '/'}>
                                Voltar ao Início
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

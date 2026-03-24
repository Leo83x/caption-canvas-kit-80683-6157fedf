import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from '@/pages/Index';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
    },
});

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <BrowserRouter>
                    {component}
                </BrowserRouter>
            </TooltipProvider>
        </QueryClientProvider>
    );
};

describe('Index Page', () => {
    it('renders dashboard heading', () => {
        renderWithProviders(<Index />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders all tab triggers', () => {
        renderWithProviders(<Index />);
        expect(screen.getByText('Criar Post')).toBeInTheDocument();
        expect(screen.getByText('Visualizar')).toBeInTheDocument();
        expect(screen.getByText('Agenda')).toBeInTheDocument();
        expect(screen.getByText('Salvos')).toBeInTheDocument();
    });

    it('shows empty state in preview tab when no post is generated', () => {
        renderWithProviders(<Index />);
        const previewTab = screen.getByText('Visualizar');
        previewTab.click();
        expect(screen.getByText('Gere um post primeiro para visualizar')).toBeInTheDocument();
    });
});

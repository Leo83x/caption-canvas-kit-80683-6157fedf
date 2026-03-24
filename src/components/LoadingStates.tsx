import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function PostCardSkeleton() {
    return (
        <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
            </div>
        </Card>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-subtle">
            <div className="container py-8 space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="p-6 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </Card>
                    <Card className="p-6 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </Card>
                    <Card className="p-6 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </Card>
                </div>

                <Card className="p-6 space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </Card>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                </div>
            ))}
        </div>
    );
}

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
    const sizeClasses = {
        sm: "h-4 w-4 border-2",
        default: "h-8 w-8 border-4",
        lg: "h-12 w-12 border-4"
    };

    return (
        <div className={`animate-spin rounded-full border-primary border-t-transparent ${sizeClasses[size]}`} />
    );
}

export function PageLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
        </div>
    );
}

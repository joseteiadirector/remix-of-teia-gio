import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen relative overflow-hidden animate-in fade-in duration-500">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 -z-10" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 relative">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>

        {/* KPI Hero Skeleton */}
        <section className="relative">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6",
                  "animate-pulse"
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts Banner Skeleton */}
        <section>
          <Skeleton className="h-16 w-full rounded-xl" />
        </section>

        {/* Quick Actions Skeleton */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-36" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 sm:p-6",
                  "animate-pulse"
                )}
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <div className="space-y-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Insights & Trends Skeleton */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6",
                "animate-pulse"
              )}
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Loading indicator */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-card/80 backdrop-blur-xl border border-border/50 rounded-full px-4 py-2 shadow-lg animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground font-medium">Carregando...</span>
      </div>
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonCard = () => {
  return (
    <Card className="p-6 glass-card shimmer">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4 rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-8 w-20 mb-2 rounded-lg" />
      <Skeleton className="h-3 w-full rounded-full" />
    </Card>
  );
};

export const SkeletonChart = () => {
  return (
    <Card className="p-6 glass-card shimmer">
      <Skeleton className="h-6 w-48 mb-4 rounded-lg" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function InsightSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </Card>
  );
}

export function InsightListSkeleton() {
  return (
    <div className="space-y-4">
      <InsightSkeleton />
      <InsightSkeleton />
      <InsightSkeleton />
    </div>
  );
}

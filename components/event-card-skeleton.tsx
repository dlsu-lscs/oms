import { Skeleton } from "@/components/ui/skeleton";

export default function EventCardSkeleton() {
  return (
    <div className="max-w-xs overflow-hidden rounded-lg shadow-sm">
      <div className="relative h-48 w-full">
        <Skeleton className="w-full h-full rounded-md" />
        <Skeleton className="absolute left-2 top-2 h-5 w-16" />
      </div>

      <div className="flex flex-row py-2 px-3">
        <div className="flex flex-grow flex-col items-start justify-between">
          <div className="flex flex-row">
            <Skeleton className="h-7 w-48" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
} 
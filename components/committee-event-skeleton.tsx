import { Skeleton } from "@/components/ui/skeleton";

export default function CommitteeEventSkeleton() {
  return (
    <div className="hover:bg-accent/50 transition-colors">
      <div className="px-4">
        <div className="flex gap-4">
          {/* Image/Initials placeholder */}
          <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-muted/30" />
          
          <div className="flex-1 min-w-0">
            {/* Title and share button */}
            <div className="flex items-start justify-between">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            
            {/* Date and duration */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            
            {/* Badge */}
            <div className="mt-2">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
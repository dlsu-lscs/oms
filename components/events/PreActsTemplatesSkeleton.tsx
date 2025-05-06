import React from "react";

export function PreActsTemplatesSkeleton() {
  return (
    <div className="rounded-lg border p-6 animate-pulse">
      <div className="h-6 w-1/3 bg-muted rounded mb-4" />
      <div className="space-y-4">
        <div className="h-10 w-1/2 bg-muted rounded mb-2" />
        <div className="h-8 w-32 bg-muted rounded mt-4" />
      </div>
    </div>
  );
} 
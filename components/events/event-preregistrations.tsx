"use client";

import { Event } from "@/app/types";

interface EventPreregistrationsProps {
  event: Event;
}

export function EventPreregistrations({ }: EventPreregistrationsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h3 className="text-lg font-medium">No preregistrations yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Preregistrations will appear here once they start coming in.
        </p>
      </div>
    </div>
  );
} 
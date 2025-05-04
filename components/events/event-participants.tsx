"use client";

import { Event, Participant } from "@/app/types";

interface EventParticipantsProps {
  event: Event;
  participants: Participant[];
}

export function EventParticipants({ }: EventParticipantsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h3 className="text-lg font-medium">No participants yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Participants will appear here once they register.
        </p>
      </div>
    </div>
  );
} 
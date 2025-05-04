"use client";

import { useState } from "react";
import EventCard from "@/components/event-card";
import { EventSidebar } from "@/components/event-sheet";
import { Event, Participant } from "@/app/types";

type EventListProps = {
  events: Event[];
  participants: Participant[];
};

export default function EventList({ events, participants }: EventListProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            imageSrc={event.eventVisual || "/placeholder.svg"}
            altText="Event visual"
            badgeText={event.committee}
            title={event.name}
            deadlineText={`Pre-Acts deadline on [fill]`}
            onClick={() => setSelectedEvent(event)}
          />
        ))}
      </div>

      <EventSidebar
        open={!!selectedEvent}
        event={selectedEvent}
        participants={
          selectedEvent
            ? participants.filter((p) => p.eventId === selectedEvent.id)
            : []
        }
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import EventCard from "@/components/event-card";
import { EventSidebar } from "@/components/event-sheet";
import { Event } from "@/app/types";

type EventListProps = {
  events: Event[];
};

export default function EventList({ events }: EventListProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {events.map((event) => (
          <EventCard
            key={event.arn}
            imageSrc={event.eventVisual || null}
            altText="Event visual"
            badgeText={event.committee || ""}
            title={event.event_name || ""}
            deadlineText={`Pre-Acts deadline on [fill]`}
            onClick={() => setSelectedEvent(event)}
          />
        ))}
      </div>

      <EventSidebar
        open={!!selectedEvent}
        event={selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
    </>
  );
}

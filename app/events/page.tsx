"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import EventList from "@/components/dashboard-events";
import { Event } from "@/app/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Share2 } from "lucide-react";
import { useEventSheet } from "@/components/event-sheet";
import { EventSidebar } from "@/components/event-sheet";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// Import events data from the main page
import { events } from "../page";

// Mock user data - in a real app, this would come from authentication
const currentUser = {
  committee: "Research and Development",
  committeeId: 2,
};

// Filter events for the current user's committee
const committeeEvents = events.filter(
  (event: Event) => event.committeeId === currentUser.committeeId,
);

export default function EventsPage() {
  const { isOpen, currentEvent, openEventSheet, closeEventSheet } =
    useEventSheet();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleShare = (event: Event) => {
    const url = `${window.location.origin}/events/${event.id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6 md:px-6">
              <div className="text-3xl font-bold">Your events</div>
              <EventList events={events} participants={[]} />

              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">
                  {currentUser.committee} Events
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {committeeEvents.map((event: Event) => (
                    <Card
                      key={event.id}
                      className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => openEventSheet(event)}
                    >
                      <CardContent className="px-4">
                        <div className="flex gap-4">
                          <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={event.eventVisual || "/placeholder.svg"}
                              alt={event.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <span className="text-xl font-semibold leading-tight">
                                {event.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(event);
                                }}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                              <CalendarDays className="h-4 w-4" />
                              <span>{formatDate(event.startTime)}</span>
                            </div>
                            <div className="mt-2">
                              <Badge variant="secondary">{event.type}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <EventSidebar
        event={currentEvent}
        participants={[]}
        open={isOpen}
        onOpenChange={closeEventSheet}
      />
    </SidebarProvider>
  );
}

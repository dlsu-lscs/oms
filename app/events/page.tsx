"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Event } from "@/app/types";
import { useEventSheet } from "@/components/event-sheet";
import { EventSidebar } from "@/components/event-sheet";
import EventListCard from "@/components/event-list-card";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import EventCardSkeleton from "@/components/event-card-skeleton";
import CommitteeEventSkeleton from "@/components/committee-event-skeleton";
import EventList from "@/components/dashboard-events";

export default function EventsPage() {
  const [personalEvents, setPersonalEvents] = useState<Event[]>([]);
  const [committeeEvents, setCommitteeEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, currentEvent, openEventSheet, closeEventSheet } = useEventSheet();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const [personalResponse, committeeResponse] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/committee-events')
        ]);

        if (!personalResponse.ok || !committeeResponse.ok) {
          throw new Error('Failed to fetch events');
        }

        const [personalData, committeeData] = await Promise.all([
          personalResponse.json(),
          committeeResponse.json()
        ]);

        setPersonalEvents(personalData);
        setCommitteeEvents(committeeData);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handleShare = (event: Event) => {
    const url = `${window.location.origin}/events/${event.arn}`;
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
              {/* Personal Events Section */}
              <div className="space-y-4">
                <div className="text-3xl font-bold">Your events</div>
                <div className="relative">
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 transition-opacity duration-300",
                      loading ? "opacity-100" : "opacity-0 absolute inset-0"
                    )}
                  >
                    {[...Array(4)].map((_, i) => (
                      <EventCardSkeleton key={i} />
                    ))}
                  </div>
                  <div
                    className={cn(
                      "transition-opacity duration-300",
                      loading ? "opacity-0" : "opacity-100"
                    )}
                  >
                    <EventList events={personalEvents} />
                  </div>
                </div>
              </div>

              {/* Committee Events Section */}
              <div className="space-y-4 mt-8">
                <div className="text-3xl font-bold">Committee Events</div>
                <div className="relative">
                  <div
                    className={cn(
                      "grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300",
                      loading ? "opacity-100" : "opacity-0 absolute inset-0"
                    )}
                  >
                    {[...Array(5)].map((_, i) => (
                      <CommitteeEventSkeleton key={i} />
                    ))}
                  </div>
                  <div
                    className={cn(
                      "transition-opacity duration-300",
                      loading ? "opacity-0" : "opacity-100"
                    )}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {committeeEvents.map((event) => (
                        <EventListCard
                          key={event.arn}
                          event={event}
                          onShare={handleShare}
                          onClick={openEventSheet}
                        />
                      ))}
                      {committeeEvents.length === 0 && !loading && (
                        <p className="text-muted-foreground col-span-2">No committee events found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <EventSidebar
        event={currentEvent}
        open={isOpen}
        onOpenChange={closeEventSheet}
      />
    </SidebarProvider>
  );
}

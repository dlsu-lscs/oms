"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import EventList from "@/components/dashboard-events";
import { Event } from "@/app/types";
import { useEffect, useState } from "react";
import EventCardSkeleton from "@/components/event-card-skeleton";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

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
              <SectionCards />
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
                  <EventList events={events} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

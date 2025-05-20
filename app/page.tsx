"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import EventList from "@/components/dashboard-events";
import DocuLogiEvents from "@/components/doculogi-events";
import FinanceDashboard from "@/components/finance-dashboard";
import { Event } from "@/app/types";
import { useEffect, useState } from "react";
import EventCardSkeleton from "@/components/event-card-skeleton";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  committeeId: string | null;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const { data: session } = useSession();

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

    async function fetchUserData() {
      if (!session) {
        setLoadingUser(false);
        return;
      }

      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setUserData(data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoadingUser(false);
      }
    }

    fetchEvents();
    fetchUserData();
  }, [session]);

  const isCommitteeMember = (committeeId: string) => {
    return userData?.committeeId === committeeId;
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

              {isCommitteeMember('DOCULOGI') && (
                <>
                  <div className="text-3xl font-bold mt-8">Documentation and Logistics Dashboard</div>
                  <DocuLogiEvents />
                </>
              )}

              {loadingUser ? (
                <>
                  <div className="text-3xl font-bold mt-8">Finance Dashboard</div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-lg border p-6 animate-pulse">
                        <div className="h-6 w-48 bg-muted rounded mb-4" />
                        <div className="space-y-3">
                          <div className="h-4 w-full bg-muted rounded" />
                          <div className="h-4 w-3/4 bg-muted rounded" />
                          <div className="h-4 w-1/2 bg-muted rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : isCommitteeMember('FIN') && (
                <>
                  <div className="text-3xl font-bold mt-8">Finance Dashboard</div>
                  <FinanceDashboard />
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

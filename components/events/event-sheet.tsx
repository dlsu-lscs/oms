"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Event } from "@/app/types";
import { EventHeader } from "./event-header";
import { EventOverview } from "./event-overview";
import { EventDocumentation } from "./event-documentation";
import { EventPreregistrations } from "./event-preregistrations";
import { EventAttendees } from "./event-attendees";
import { Loader2 } from "lucide-react";

interface EventSidebarProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventSidebar({
  event,
  open,
  onOpenChange,
}: EventSidebarProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchAttendeeCount() {
      if (!event?.arn) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/events/attendees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ arn: event.arn }),
        });
        
        if (!response.ok) throw new Error('Failed to fetch attendees');
        const data = await response.json();
        setAttendeeCount(data.length);
      } catch (error) {
        console.error('Error fetching attendee count:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (event) {
      fetchAttendeeCount();
    }
  }, [event, event?.arn]);

  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto p-0"
      >
        <div className="h-full flex flex-col">
          <EventHeader event={event} />

          <div className="flex-1 p-6 overflow-y-auto">
            <Tabs
              defaultValue="overview"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
                <TabsTrigger value="preregistrations">
                  Preregistrations
                </TabsTrigger>
                <TabsTrigger value="attendees">
                  Attendees{" "}
                  <Badge className="text-xs py-0 ml-2 min-w-[1.5rem] h-5 flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      attendeeCount
                    )}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <EventOverview event={event} />
              </TabsContent>

              <TabsContent value="documentation">
                <EventDocumentation event={event} />
              </TabsContent>

              <TabsContent value="preregistrations">
                <EventPreregistrations event={event} />
              </TabsContent>

              <TabsContent value="attendees">
                <EventAttendees event={event} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 
"use client";

import { CalendarDays, Clock, User, MapPin, Wallet, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/app/types";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EventOverviewProps {
  event: Event;
}

// Skeleton component for the event overview
function EventOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <div className="flex items-start gap-2">
              <Skeleton className="h-4 w-4 mt-0.5" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>

          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          </div>

          <div>
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventOverview({ event }: EventOverviewProps) {
  const [projectHeads, setProjectHeads] = useState<{ full_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventDates, setEventDates] = useState<{ start_time: Date; end_time: Date } | null>(null);
  const [isLoadingDates, setIsLoadingDates] = useState(true);

  useEffect(() => {
    async function fetchProjectHeads() {
      if (!event?.arn) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/events/project-heads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ arn: event.arn }),
        });
        
        if (!response.ok) throw new Error('Failed to fetch project heads');
        const data = await response.json();
        setProjectHeads(data);
      } catch (error) {
        console.error('Error fetching project heads:', error);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchEventDates() {
      if (!event?.arn) return;

      setIsLoadingDates(true);
      try {
        const response = await fetch('/api/events/dates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ arn: event.arn }),
        });

        if (!response.ok) throw new Error('Failed to fetch event dates');
        const data = await response.json();
        setEventDates(data);
      } catch (error) {
        console.error('Error fetching event dates:', error);
      } finally {
        setIsLoadingDates(false);
      }
    }

    fetchProjectHeads();
    fetchEventDates();
  }, [event?.arn]);

  if (isLoadingDates) {
    return <EventOverviewSkeleton />;
  }

  if (!eventDates) {
    return null;
  }

  const startDate = new Date(eventDates.start_time);
  const endDate = new Date(eventDates.end_time);

  const formattedStartDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedStartTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedEndTime = endDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Brief Description
            </h3>
            <p className="text-sm">{event.brief_description}</p>
          </div>

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Date & Time
            </h3>
            <div className="flex items-start gap-2">
              <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p>{formattedStartDate}</p>
                <p className="text-sm text-muted-foreground">
                  {formattedStartTime} - {formattedEndTime}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Venue
            </h3>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <p>{event.venue || 'Online'}</p>
            </div>
          </div>

          {event.budget_allocation && event.budget_allocation > 0 && (
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
                Budget Allocation
            </h3>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <p>₱{event.budget_allocation.toLocaleString()}</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Project Heads
            </h3>
            {isLoading ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ) : projectHeads.length > 0 ? (
              <div className="space-y-1.5">
                {projectHeads.map((head, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{head.full_name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No project heads assigned</p>
            )}
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details">
              <AccordionTrigger className="text-sm font-medium text-muted-foreground">
                Additional Details
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">
                    Duration
                  </h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p>{event.duration}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">
                    Goals
                  </h3>
                  <p className="text-sm">{event.goals}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">
                    Objectives
                  </h3>
                  <p className="text-sm">{event.objectives}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">
                    Strategies
                  </h3>
                  <p className="text-sm">{event.strategies}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">
                    Measures
                  </h3>
                  <p className="text-sm">{event.measures}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Event Visual
            </h3>
            <div className="aspect-[3/4] relative rounded-lg overflow-hidden">
              {event.eventVisual ? (
                <Image
                  src={event.eventVisual}
                  alt={event.event_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {event.event_name
                      .split(' ')
                      .map(word => word[0])
                      .join('')
                      .toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Event Post Caption
            </h3>
            <p className="text-sm">{event.event_post_caption}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
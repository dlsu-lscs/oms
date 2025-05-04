"use client";

import { CalendarDays, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/app/types";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface EventOverviewProps {
  event: Event;
}

export function EventOverview({ event }: EventOverviewProps) {
  const [projectHeads, setProjectHeads] = useState<{ full_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

    fetchProjectHeads();
  }, [event?.arn]);

  const startDate = new Date(event.start);
  const endDate = new Date(event.end);

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
              Duration
            </h3>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p>{event.duration}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Type & Nature
            </h3>
            <div className="flex gap-2">
              <Badge variant="secondary">{event.type}</Badge>
              <Badge variant="outline">{event.nature}</Badge>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Project Heads
            </h3>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading...</p>
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
            <p className="text-sm">event.event_post_caption</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
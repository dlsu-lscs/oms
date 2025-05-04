import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Event } from "@/app/types";
import { format } from "date-fns";

function EventImage({ event }: { event: Event }) {
  if (!event.eventVisual) {
    // Get initials from event name
    const initials = event.event_name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
        <span className="text-2xl font-bold text-primary">{initials}</span>
      </div>
    );
  }

  return (
    <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
      <Image
        src={event.eventVisual}
        alt={event.event_name}
        fill
        className="object-cover"
      />
    </div>
  );
}

function formatDate(date: Date) {
  return format(new Date(date), "MMM d, yyyy");
}

type EventListCardProps = {
  event: Event;
  onShare: (event: Event) => void;
  onClick: (event: Event) => void;
};

export default function EventListCard({ event, onShare, onClick }: EventListCardProps) {
  return (
    <div 
      className="relative cursor-pointer"
      onClick={() => onClick(event)}
    >
      <Card className="hover:bg-accent/50 transition-colors">
        <CardContent className="px-4">
          <div className="flex gap-4">
            <EventImage event={event} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <span className="text-xl font-semibold leading-tight">
                  {event.event_name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(event);
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{formatDate(event.start)}</span>
                <span>•</span>
                <span>{event.duration}</span>
              </div>
              <div className="mt-2">
                <Badge variant="secondary">{event.type}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
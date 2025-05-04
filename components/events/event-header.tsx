"use client";

import Link from "next/link";
import { Edit, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Event } from "@/app/types";

interface EventHeaderProps {
  event: Event;
}

export function EventHeader({ event }: EventHeaderProps) {
  return (
    <SheetHeader className="p-6 border-b border-border/40">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SheetTitle className="text-2xl font-bold">
              {event.event_name}
            </SheetTitle>
            <Badge variant="outline">{event.arn}</Badge>
          </div>
          <p className="text-muted-foreground">{event.committee}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/events/${event.arn}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/events/${event.arn}`} target="_blank">
            <Button size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View
            </Button>
          </Link>
        </div>
      </div>
    </SheetHeader>
  );
} 
"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/app/types";
import { Attendee } from "@/lib/controllers/events";

interface EventAttendeesProps {
  event: Event;
}

const POSITION_BADGES = {
  null: {
    label: "Non-Member",
    variant: "outline" as const,
    className: "border-white text-white",
  },
  MEM: {
    label: "Member",
    variant: "default" as const,
    className: "bg-white text-gray-900",
  },
  AVP: {
    label: "AVP",
    variant: "default" as const,
    className: "bg-blue-100 text-blue-900",
  },
  VP: {
    label: "VP",
    variant: "default" as const,
    className: "bg-blue-600 text-white",
  },
  EVP: {
    label: "EVP",
    variant: "default" as const,
    className: "bg-yellow-100 text-yellow-900",
  },
  PRES: {
    label: "President",
    variant: "default" as const,
    className: "bg-yellow-600 text-white",
  },
};

export function EventAttendees({ event }: EventAttendeesProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchAttendees() {
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
        setAttendees(data);
      } catch (error) {
        console.error('Error fetching attendees:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAttendees();
  }, [event?.arn]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attendees.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium">No attendees yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Attendees will appear here once they register.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {attendees.map((attendee) => {
            const badge = POSITION_BADGES[attendee.position_id as keyof typeof POSITION_BADGES] || POSITION_BADGES.null;
            
            return (
              <div
                key={attendee.student_id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{attendee.student_name}</p>
                    <Badge variant={badge.variant} className={badge.className}>
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{attendee.student_email}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { UserEvent, getUserEvents } from "@/lib/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function YourEvents() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      if (session?.user?.memberId) {
        const userEvents = await getUserEvents(session.user.memberId);
        setEvents(userEvents);
      }
      setLoading(false);
    }

    fetchEvents();
  }, [session?.user?.memberId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading your events...</p>
        </CardContent>
      </Card>
    );
  }

  if (!events.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No events found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.arn}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <h3 className="font-medium">{event.event_name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{format(event.start, "MMM d, yyyy")}</span>
                  <span>•</span>
                  <span>{event.duration}</span>
                </div>
              </div>
              <Badge variant="secondary">{event.type}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 
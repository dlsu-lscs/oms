import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";
import { parse } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is DOCULOGI
    if (session.user.committeeId?.toString() !== 'DOCULOGI') {
      return NextResponse.json({ error: 'Only DOCULOGI members can update deadlines' }, { status: 403 });
    }

    const { eventId, deadline } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Parse the deadline string to a Date object if it exists
    let deadlineDate = null;
    if (deadline) {
      try {
        deadlineDate = parse(deadline, 'MMMM d, yyyy', new Date());
      } catch (error) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
    }

    // Update the deadline in the database
    await pool.query(
      'UPDATE event_trackers SET preacts_deadline = ? WHERE event_id = ?',
      [deadlineDate, eventId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating Pre-Acts deadline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
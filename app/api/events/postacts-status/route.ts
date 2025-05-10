import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface EventTrackerRow extends RowDataPacket {
  postacts_status: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const [rows] = await pool.query<EventTrackerRow[]>(
      'SELECT postacts_status FROM event_trackers WHERE event_id = ?',
      [eventId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Event tracker not found' }, { status: 404 });
    }

    return NextResponse.json({ status: rows[0].postacts_status });
  } catch (error) {
    console.error('Error fetching Post-Acts status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, status } = await req.json();
    if (!eventId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user is DOCULOGI
    if (status !== 'SENT' && session.user.committeeId?.toString() !== 'DOCULOGI') {
      return NextResponse.json({ error: 'Only DOCULOGI members can update Post-Acts status' }, { status: 403 });
    }

    // Update the status in the database
    await pool.query(
      'UPDATE event_trackers SET postacts_status = ? WHERE event_id = ?',
      [status, eventId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating Post-Acts status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface EventTrackerRow extends RowDataPacket {
  fin_drive_id: string | null;
  fin_preacts_status: string;
  fin_postacts_status: string;
  fin_preacts_deadline: string | null;
  fin_postacts_deadline: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const [rows] = await pool.query<EventTrackerRow[]>(
      'SELECT fin_drive_id, fin_preacts_status, fin_postacts_status, fin_preacts_deadline, fin_postacts_deadline FROM event_trackers WHERE event_id = ?',
      [eventId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Event tracker not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching event tracker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface EventTrackerRow extends RowDataPacket {
  preacts_status: string;
}

export async function POST(req: NextRequest) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const [rows] = await pool.query<EventTrackerRow[]>(
      "SELECT preacts_status FROM event_trackers WHERE event_id = ?",
      [eventId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Event tracker not found" }, { status: 404 });
    }

    return NextResponse.json({ status: rows[0].preacts_status });
  } catch (error: any) {
    console.error("Error fetching preacts status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch preacts status" },
      { status: 500 }
    );
  }
} 
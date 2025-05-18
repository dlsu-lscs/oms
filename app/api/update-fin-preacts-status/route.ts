import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from "@/lib/db";
import { FinanceStatus, FINANCE_STATUS_LABELS } from "@/app/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is in FIN committee
    if (session.user.committeeId?.toString() !== 'FIN') {
      return new NextResponse('Only Finance committee members can update status', { status: 403 });
    }

    const body = await req.json();
    const { eventId, status } = body;

    if (!eventId || !status) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Validate status
    if (!(status in FINANCE_STATUS_LABELS)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Update status
    await pool.query(
      'UPDATE event_trackers SET fin_preacts_status = ? WHERE event_id = ?',
      [status, eventId]
    );

    return new NextResponse('Finance preacts status updated successfully', { status: 200 });
  } catch (error: any) {
    console.error("Error updating finance preacts status:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
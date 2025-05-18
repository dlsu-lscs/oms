import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';

// GET /api/events/finance-processes?eventId=123
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return new NextResponse('Missing eventId parameter', { status: 400 });
    }

    // Get all processes for the event
    const [processes] = await pool.query(`
      SELECT fp.process, fpr.name
      FROM fin_processes fp
      JOIN fin_process_ref fpr ON fp.process = fpr.id
      WHERE fp.tracker_id = ?
    `, [eventId]);

    return NextResponse.json({ processes });
  } catch (error) {
    console.error('Error fetching finance processes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/events/finance-processes
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is in FIN committee
    if (session.user.committeeId?.toString() !== 'FIN') {
      return new NextResponse('Only Finance committee members can add processes', { status: 403 });
    }

    const body = await req.json();
    const { eventId, process } = body;

    if (!eventId || !process) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Insert the new process
    await pool.query(`
      INSERT INTO fin_processes (tracker_id, process)
      VALUES (?, ?)
    `, [eventId, process]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding finance process:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/events/finance-processes
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is in FIN committee
    if (session.user.committeeId?.toString() !== 'FIN') {
      return new NextResponse('Only Finance committee members can remove processes', { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const process = searchParams.get('process');

    if (!eventId || !process) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // Remove the finance process
    await pool.query(
      'DELETE FROM fin_processes WHERE tracker_id = ? AND process = ?',
      [eventId, process]
    );

    return new NextResponse('Finance process removed successfully', { status: 200 });
  } catch (error) {
    console.error('Error removing finance process:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { eventId, finHeadId } = body;

    if (!eventId || !finHeadId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Update the event's finance head
    await pool.query(
      'UPDATE events SET fin_head = ? WHERE id = ?',
      [finHeadId, eventId]
    );

    return new NextResponse('Finance head assigned successfully', { status: 200 });
  } catch (error) {
    console.error('Error assigning finance head:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
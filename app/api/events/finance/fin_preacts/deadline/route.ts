import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';
import { parse } from 'date-fns';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { eventId, deadline } = body;

    if (!eventId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Parse the deadline string to a Date object if it exists
    let deadlineDate = null;
    if (deadline) {
      try {
        deadlineDate = parse(deadline, 'MMMM d, yyyy', new Date());
      } catch (error) {
        return new NextResponse('Invalid date format', { status: 400 });
      }
    }

    // Update the event tracker's finance preacts deadline
    await pool.query(
      'UPDATE event_trackers SET fin_preacts_deadline = ? WHERE event_id = ?',
      [deadlineDate, eventId]
    );

    return new NextResponse('Finance preacts deadline updated successfully', { status: 200 });
  } catch (error) {
    console.error('Error updating finance preacts deadline:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
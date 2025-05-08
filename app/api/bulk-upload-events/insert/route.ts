import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Event {
  'Activity Title': string;
  'ARN': string;
  Duration: string;
  'Target Activity Date': string[];
  'Activity Nature': string;
  'Activity Type': string;
  'Budget Allocation': string;
  Venue: string;
  'Brief Description': string;
  Goals: string;
  Objectives: string;
  Strategies: string;
  Measures: string;
  'Project Head': string[];
  'Committee': string;
}

interface TermRow extends RowDataPacket {
  id: number;
}

interface NatureRow extends RowDataPacket {
  id: number;
}

interface DurationRow extends RowDataPacket {
  id: number;
}

export async function POST(req: NextRequest) {
  let connection;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { events } = await req.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // Get current term ID
    const currentTermId = process.env.CURRENT_TERM_ID;
    if (!currentTermId) {
      return NextResponse.json({ error: 'Current term ID not configured' }, { status: 500 });
    }

    // Start transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const results = [];
    const errors = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      try {
        // 1. Get nature_id from event_natures
        const [natures] = await connection.query<NatureRow[]>(
          'SELECT id FROM event_natures WHERE name = ?',
          [event['Activity Nature']]
        );
        if (!natures.length) {
          throw new Error(`Invalid nature: ${event['Activity Nature']}`);
        }
        const natureId = natures[0].id;

        // 2. Get duration_id from event_durations
        const [durations] = await connection.query<DurationRow[]>(
          'SELECT id FROM event_durations WHERE name = ?',
          [event.Duration]
        );
        if (!durations.length) {
          throw new Error(`Invalid duration: ${event.Duration}`);
        }
        const durationId = durations[0].id;

        // 3. Insert into events table
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO events (
            name, arn, venue, type, strategies, objectives, nature_id,
            measures, goals, committee_id, budget_allocation, brief_description,
            term_id, duration_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            event['Activity Title'],
            event['ARN'],
            event.Venue || 'Online',
            event['Activity Type'],
            event.Strategies,
            event.Objectives,
            natureId,
            event.Measures,
            event.Goals,
            event['Committee'],
            parseFloat(event['Budget Allocation'].replace('₱', '').trim()) || 0,
            event['Brief Description'],
            currentTermId,
            durationId
          ]
        );

        const eventId = result.insertId;

        // 4. Insert project heads
        if (event['Project Head'] && event['Project Head'].length > 0) {
          const projectHeadValues = event['Project Head'].map((headId: string) => [eventId, headId]);
          await connection.query(
            'INSERT INTO event_heads (event_id, member_id) VALUES ?',
            [projectHeadValues]
          );
        }

        // 5. Insert event dates
        if (event['Target Activity Date'] && event['Target Activity Date'].length > 0) {
          const dateValues = event['Target Activity Date'].map((dateStr: string) => {
            // Parse the date string (e.g., "November 25, 2025")
            const date = new Date(dateStr);
            // Format as MySQL datetime (YYYY-MM-DD HH:mm:ss)
            const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
            return [eventId, formattedDate, formattedDate];
          });
          await connection.query(
            'INSERT INTO event_dates (event_id, start_time, end_time) VALUES ?',
            [dateValues]
          );
        }

        // 6. Insert event tracker
        await connection.query(
          'INSERT INTO event_trackers (event_id) VALUES (?)',
          [eventId]
        );

        results.push({
          index: i,
          eventId,
          status: 'success'
        });
      } catch (error) {
        errors.push({
          index: i,
          error: (error as Error).message
        });
        // Continue with next event even if this one failed
      }
    }

    if (errors.length > 0) {
      // If any errors occurred, rollback the transaction
      await connection.rollback();
      return NextResponse.json({
        error: 'Some events failed to insert',
        errors,
        results
      }, { status: 400 });
    }

    // If all successful, commit the transaction
    await connection.commit();
    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    return NextResponse.json({
      error: (error as Error).message
    }, { status: 500 });
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
} 
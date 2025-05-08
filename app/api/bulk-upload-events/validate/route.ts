import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  
  try {
    const { events } = await request.json();
    const errors: Array<{ index: number; error: string }> = [];

    // Get valid natures and durations
    const [natures] = await connection.query('SELECT name FROM event_natures');
    const [durations] = await connection.query('SELECT name FROM event_durations');
    const [existingArns] = await connection.query('SELECT arn FROM events');

    const validNatures = (natures as any[]).map(n => n.name);
    const validDurations = (durations as any[]).map(d => d.name);
    const existingArnList = (existingArns as any[]).map(e => e.arn);

    // Validate each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventErrors: string[] = [];

      // Check required fields
      if (!event['Activity Title']) {
        eventErrors.push('Activity Title is required');
      }
      if (!event['ARN']) {
        eventErrors.push('ARN is required');
      }
      if (!event['Activity Nature']) {
        eventErrors.push('Activity Nature is required');
      }
      if (!event.Duration) {
        eventErrors.push('Duration is required');
      }
      if (!event['Target Activity Date'] || !Array.isArray(event['Target Activity Date']) || event['Target Activity Date'].length === 0) {
        eventErrors.push('At least one Target Activity Date is required');
      }

      // Check if ARN already exists
      if (event['ARN'] && existingArnList.includes(event['ARN'])) {
        eventErrors.push('ARN already exists');
      }

      // Check if Activity Nature is valid
      if (event['Activity Nature'] && !validNatures.includes(event['Activity Nature'])) {
        eventErrors.push('Invalid Activity Nature');
      }

      // Check if Duration is valid
      if (event.Duration && !validDurations.includes(event.Duration)) {
        eventErrors.push('Invalid Duration');
      }

      // Check if Project Head is valid
      if (event['Project Head'] && Array.isArray(event['Project Head'])) {
        const [members] = await connection.query('SELECT id FROM members');
        const validMemberIds = (members as any[]).map(m => m.id.toString());
        
        for (const headId of event['Project Head']) {
          if (!validMemberIds.includes(headId.toString())) {
            eventErrors.push('Invalid Project Head');
            break;
          }
        }
      }

      // Check if Committee is valid
      if (event['Committee']) {
        const [committees] = await connection.query('SELECT committee_id FROM committees');
        const validCommitteeIds = (committees as any[]).map(c => c.committee_id.toString());
        
        if (!validCommitteeIds.includes(event['Committee'].toString())) {
          eventErrors.push('Invalid Committee');
        }
      }

      // Check if dates are valid
      if (event['Target Activity Date'] && Array.isArray(event['Target Activity Date'])) {
        for (const date of event['Target Activity Date']) {
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) {
            eventErrors.push('Invalid date format in Target Activity Date');
            break;
          }
        }
      }

      // Check if Budget Allocation is a valid number
      if (event['Budget Allocation'] && isNaN(parseFloat(event['Budget Allocation']))) {
        eventErrors.push('Budget Allocation must be a valid number');
      }

      if (eventErrors.length > 0) {
        errors.push({
          index: i,
          error: eventErrors.join(', ')
        });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        errors
      }, { status: 400 });
    }

    return NextResponse.json({
      message: 'All events are valid'
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({
      error: (error as Error).message
    }, { status: 500 });
  } finally {
    connection.release();
  }
} 
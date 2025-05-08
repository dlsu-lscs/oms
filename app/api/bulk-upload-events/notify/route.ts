import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  
  try {
    const { events } = await request.json();

    // Get VP emails
    const [vps] = await connection.query(`
      SELECT m.email, m.full_name, c.name as committee_name
      FROM members m
      JOIN committees c ON m.committee_id = c.committee_id
      WHERE c.name IN ('Documentations', 'Finance')
    `);

    const vpEmails = (vps as any[]).map(vp => ({
      email: vp.email,
      name: vp.full_name,
      committee: vp.committee_name
    }));

    if (vpEmails.length === 0) {
      return NextResponse.json({
        error: 'No VP emails found'
      }, { status: 400 });
    }

    // Prepare email content
    const eventList = events.map((event: any) => `
      - ${event['Activity Title']} (${event['ARN']})
        Duration: ${event.Duration}
        Dates: ${event['Target Activity Date'].join(', ')}
        Budget: ${event['Budget Allocation']}
    `).join('\n');

    const emailContent = `
      New events have been uploaded to the system. Please review the following events:

      ${eventList}

      You can view these events in the system by logging in to your account.
    `;

    // Send emails to VPs
    const emailPromises = vpEmails.map(vp => 
      resend.emails.send({
        from: 'LSCS OMS <noreply@lscs-oms.com>',
        to: vp.email,
        subject: `New Events Uploaded - ${vp.committee} VP Notification`,
        text: emailContent,
      })
    );

    await Promise.all(emailPromises);

    return NextResponse.json({
      message: 'Notification emails sent successfully'
    });

  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({
      error: (error as Error).message
    }, { status: 500 });
  } finally {
    connection.release();
  }
} 
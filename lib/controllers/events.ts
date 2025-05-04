import { pool } from "../db";
import { RowDataPacket, FieldPacket } from "mysql2";

export interface UserEvent {
  id: number;
  arn: string;
  event_name: string;
  committee: string;
  start: Date;
  end: Date;
  duration: string;
  type: string;
}

interface UserEventQueryResult extends RowDataPacket {
  id: number;
  arn: string;
  event_name: string;
  committee: string;
  start: string;
  end: string;
  duration: string;
  type: string;
}

export interface ProjectHead {
  full_name: string;
}

export interface Attendee {
  student_id: number;
  student_name: string;
  student_email: string;
  position_id: string | null;
}

export interface Event {
  arn: string;
  event_name: string;
  committee: string;
  start: Date;
  end: Date;
  duration: string;
  type: string;
  nature: string;
  eventVisual?: string;
  event_post_caption?: string;
  project_heads?: string;
}

interface EventQueryResult extends RowDataPacket {
  committee: string;
  arn: string;
  event_name: string;
  start: string;
  end: string;
  duration: string;
  type: string;
  nature: string;
  event_visual: string | null;
  event_post_caption: string | null;
  project_heads: string | null;
}

export async function getUserEvents(memberId: number): Promise<UserEvent[]> {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        e.id AS 'id',
        e.arn AS 'arn',
        e.name AS 'event_name',
        ec.committee_name AS 'committee',
        e.start_time AS 'start',
        e.end_time AS 'end',
        ed.name AS 'duration',
        e.type AS 'type'
      FROM events e
      JOIN event_heads eh ON e.id = eh.event_id
      JOIN event_durations ed ON e.duration_id = ed.id
      JOIN committees ec ON e.committee_id = ec.committee_id
      JOIN members m ON eh.member_id = m.id
      JOIN positions p ON m.position_id = p.position_id
      JOIN committees c ON m.committee_id = c.committee_id
      WHERE eh.member_id = ?`,
      [memberId]
    ) as [UserEventQueryResult[], FieldPacket[]];

    return (rows as UserEventQueryResult[]).map(row => ({
      ...row,
      start: new Date(row.start),
      end: new Date(row.end)
    }));
  } catch (error) {
    console.error("Error fetching user events:", error);
    return [];
  }
}

export async function getEventProjectHeads(eventId: number): Promise<ProjectHead[]> {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        m.full_name
      FROM events e
      JOIN event_heads eh ON e.id = eh.event_id
      JOIN members m ON eh.member_id = m.id
      WHERE e.arn = ?
      ORDER BY m.full_name`,
      [eventId]
    );

    return rows as ProjectHead[];
  } catch (error) {
    console.error("Error fetching event project heads:", error);
    return [];
  }
}

export async function getEventAttendees(eventId: number): Promise<Attendee[]> {
  try {
    const [rows] = await pool.execute(
      `SELECT ep.student_id, ep.student_name, ep.student_email, m.position_id 
       FROM event_participants ep
       JOIN events e ON e.id = ep.event_id
       LEFT JOIN members m ON ep.student_id = m.id
       WHERE e.arn = ?
       ORDER BY ep.student_name`,
      [eventId]
    );

    return rows as Attendee[];
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    return [];
  }
}

export async function getEvents(): Promise<Event[]> {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        c.committee_name AS committee, 
        e.arn AS arn,
        e.name AS event_name,
        e.start_time AS start,
        e.end_time AS end,
        ed.name AS duration,
        e.type AS type,
        e.nature AS nature,
        e.event_visual AS event_visual,
        e.event_post_caption AS event_post_caption,
        e.project_heads AS project_heads
      FROM events e
      JOIN committees c ON e.committee_id = c.committee_id
      JOIN event_durations ed ON e.duration_id = ed.id
      GROUP BY e.id, e.arn, e.name, e.start_time, e.end_time, ed.name, e.type, e.nature, e.event_visual, e.event_post_caption, e.project_heads, c.committee_name
      ORDER BY e.start_time`
    ) as [EventQueryResult[], FieldPacket[]];

    return (rows as EventQueryResult[]).map(row => ({
      ...row,
      start: new Date(row.start),
      end: new Date(row.end),
      eventVisual: row.event_visual || undefined,
      event_post_caption: row.event_post_caption || undefined,
      project_heads: row.project_heads || undefined
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
} 
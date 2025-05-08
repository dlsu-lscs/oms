import { pool } from "../db";
import { RowDataPacket, FieldPacket } from "mysql2";

export interface UserEvent {
  id: number;
  arn: string;
  event_name: string;
  committee: string;
  duration: string;
  type: string;
  nature: string;
  venue: string;
  budget_allocation: number;
  brief_description: string;
  goals: string;
  objectives: string;
  strategies: string;
  measures: string;
}

interface UserEventQueryResult extends RowDataPacket {
  id: number;
  arn: string;
  event_name: string;
  committee: string;
  duration: string;
  type: string;
  nature: string;
  venue: string;
  budget_allocation: number;
  brief_description: string;
  goals: string;
  objectives: string;
  strategies: string;
  measures: string;
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
  duration: string;
  type: string;
  nature: string;
  eventVisual?: string;
  event_post_caption?: string;
  project_heads?: string;
  venue?: string;
  budget_allocation?: number;
  brief_description?: string;
  goals?: string;
  objectives?: string;
  strategies?: string;
  measures?: string;
}

interface EventQueryResult extends RowDataPacket {
  committee: string;
  arn: string;
  event_name: string;
  duration: string;
  type: string;
  nature: string;
  event_visual: string | null;
  event_post_caption: string | null;
  project_heads: string | null;
  venue: string | null;
  budget_allocation: number | null;
  brief_description: string | null;
  goals: string | null;
  objectives: string | null;
  strategies: string | null;
  measures: string | null;
}

export interface EventDates {
  start_time: Date;
  end_time: Date;
}

interface EventDatesQueryResult extends RowDataPacket {
  start_time: Date;
  end_time: Date;
}

export async function getUserEvents(memberId: number): Promise<UserEvent[]> {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        e.id AS 'id',
        e.arn AS 'arn',
        e.name AS 'event_name',
        ec.committee_name AS 'committee',
        ed.name AS 'duration',
        e.type AS 'type',
        en.name AS 'nature',
        e.venue AS 'venue',
        e.budget_allocation AS 'budget_allocation',
        e.brief_description AS 'brief_description',
        e.goals AS 'goals',
        e.objectives AS 'objectives',
        e.strategies AS 'strategies',
        e.measures AS 'measures'
      FROM events e
      JOIN event_heads eh ON e.id = eh.event_id
      JOIN event_durations ed ON e.duration_id = ed.id
      JOIN event_natures en ON e.nature_id = en.id
      JOIN committees ec ON e.committee_id = ec.committee_id
      JOIN members m ON eh.member_id = m.id
      JOIN positions p ON m.position_id = p.position_id
      JOIN committees c ON m.committee_id = c.committee_id
      WHERE eh.member_id = ?`,
      [memberId]
    ) as [UserEventQueryResult[], FieldPacket[]];

    return (rows as UserEventQueryResult[]).map(row => ({
      ...row
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
        ed.name AS duration,
        e.type AS type,
        en.name AS nature,
        e.event_visual AS event_visual,
        e.event_post_caption AS event_post_caption,
        e.project_heads AS project_heads,
        e.venue AS venue,
        e.budget_allocation AS budget_allocation,
        e.brief_description AS brief_description,
        e.goals AS goals,
        e.objectives AS objectives,
        e.strategies AS strategies,
        e.measures AS measures
      FROM events e
      JOIN committees c ON e.committee_id = c.committee_id
      JOIN event_natures en ON e.nature_id = en.id
      JOIN event_durations ed ON e.duration_id = ed.id
      GROUP BY e.id, e.arn, e.name, ed.name, e.type, en.name, e.event_visual, 
               e.event_post_caption, e.project_heads, c.committee_name, e.venue,
               e.budget_allocation, e.brief_description, e.goals, e.objectives,
               e.strategies, e.measures
      ORDER BY e.arn`
    ) as [EventQueryResult[], FieldPacket[]];

    return (rows as EventQueryResult[]).map(row => ({
      ...row,
      eventVisual: row.event_visual || undefined,
      event_post_caption: row.event_post_caption || undefined,
      project_heads: row.project_heads || undefined,
      venue: row.venue || undefined,
      budget_allocation: row.budget_allocation || undefined,
      brief_description: row.brief_description || undefined,
      goals: row.goals || undefined,
      objectives: row.objectives || undefined,
      strategies: row.strategies || undefined,
      measures: row.measures || undefined
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function getEventDates(arn: string): Promise<EventDates | null> {
  try {
    const [rows] = await pool.execute(
      `SELECT ed.start_time, ed.end_time 
       FROM event_dates ed
       JOIN events e ON ed.event_id = e.id
       WHERE e.arn = ?`,
      [arn]
    ) as [EventDatesQueryResult[], FieldPacket[]];

    if (rows.length === 0) {
      return null;
    }

    return {
      start_time: new Date(rows[0].start_time),
      end_time: new Date(rows[0].end_time)
    };
  } catch (error) {
    console.error("Error fetching event dates:", error);
    return null;
  }
} 
import { pool } from "../db";
import { RowDataPacket, FieldPacket } from "mysql2";

export interface CommitteeEvent {
  arn: string;
  event_name: string;
  committee: string;
  start: Date;
  end: Date;
  duration: string;
  type: string;
  project_heads?: string;
}

interface CommitteeQueryResult extends RowDataPacket {
  committee_id: number;
}

interface EventQueryResult extends RowDataPacket {
  committee: string;
  arn: string;
  event_name: string;
  start: string;
  end: string;
  duration: string;
  type: string;
  project_heads?: string;
}

export async function getCommitteeEvents(memberId: number): Promise<CommitteeEvent[]> {
  try {
    // First get the user's committee
    const [userCommittee] = await pool.execute(
      `SELECT committee_id FROM members WHERE id = ?`,
      [memberId]
    ) as [CommitteeQueryResult[], FieldPacket[]];

    if (!userCommittee?.[0]?.committee_id) {
      return [];
    }

    // Then get the committee events
    const [rows] = await pool.execute(
      `SELECT 
        c.committee_name AS committee, 
        e.arn AS arn,
        e.name AS event_name,
        e.start_time AS start,
        e.end_time AS end,
        ed.name AS duration,
        e.type AS type
      FROM events e
      JOIN committees c ON e.committee_id = c.committee_id
      JOIN event_durations ed ON e.duration_id = ed.id
      WHERE e.committee_id = ?
      GROUP BY e.id, e.arn, e.name, e.start_time, e.end_time, ed.name, e.type, c.committee_name
      ORDER BY e.start_time`,
      [userCommittee[0].committee_id]
    ) as [EventQueryResult[], FieldPacket[]];

    return (rows as EventQueryResult[]).map(row => ({
      ...row,
      start: new Date(row.start),
      end: new Date(row.end)
    }));
  } catch (error) {
    console.error("Error fetching committee events:", error);
    return [];
  }
} 
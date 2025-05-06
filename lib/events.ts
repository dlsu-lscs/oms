import { pool } from "./db";
import { RowDataPacket, FieldPacket } from "mysql2";

export interface UserEvent {
  arn: string;
  event_name: string;
  committee: string;
  duration: string;
  type: string;
}

interface UserEventQueryResult extends RowDataPacket {
  arn: string;
  event_name: string;
  committee: string;
  duration: string;
  type: string;
}

export async function getUserEvents(memberId: number): Promise<UserEvent[]> {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        e.arn AS 'arn',
        e.name AS 'event_name',
        ec.committee_name AS 'committee',
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
    }));
  } catch (error) {
    console.error("Error fetching user events:", error);
    return [];
  }
} 
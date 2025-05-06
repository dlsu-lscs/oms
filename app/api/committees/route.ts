import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { RowDataPacket } from 'mysql2'

interface Committee extends RowDataPacket {
  committee_id: number;
  committee_name: string;
}

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT committee_id as id, committee_name as name 
       FROM committees 
       ORDER BY committee_name ASC`
    ) as [Committee[], any];

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching committees:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
} 
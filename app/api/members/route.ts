import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { RowDataPacket } from 'mysql2'

interface Member extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
}

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT id, full_name, email 
       FROM members 
       ORDER BY full_name ASC`
    ) as [Member[], any];

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
} 
import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { RowDataPacket } from "mysql2"

interface EventRow extends RowDataPacket {
  id: number;
  name: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 3) {
      return NextResponse.json([])
    }

    const [rows] = await pool.execute(
      `SELECT id, name FROM events 
       WHERE LOWER(name) LIKE LOWER(?) 
       ORDER BY name 
       LIMIT 10`,
      [`%${query}%`]
    ) as [EventRow[], any]

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error searching events:", error)
    return NextResponse.json(
      { error: "Failed to search events" },
      { status: 500 }
    )
  }
} 
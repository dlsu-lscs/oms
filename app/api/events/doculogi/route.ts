import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDocuLogiEvents } from "@/lib/controllers/events";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  committee_id: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.memberId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is from DocuLogi committee
    const [userRows] = await pool.query<UserRow[]>(
      "SELECT committee_id FROM members WHERE id = ?",
      [session.user.memberId]
    );
    
    if (!userRows.length || userRows[0].committee_id !== 'DOCULOGI') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const events = await getDocuLogiEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching DocuLogi events:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
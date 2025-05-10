import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  committee_id: string;
}

export async function POST(request: Request) {
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

    const { eventId, docuHeadId } = await request.json();

    if (!eventId || !docuHeadId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Update the event with the new docu head
    await pool.query(
      "UPDATE events SET docu_head = ? WHERE id = ?",
      [docuHeadId, eventId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning docu head:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
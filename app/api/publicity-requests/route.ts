import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface PublicityRequest {
  id: string;
  event_id: number | null;
  pub_head: number;
  pub_head_name?: string;
  pub_type: string;
  pub_drive_id: string;
  pub_status: string;
  posting_date: Date;
  pub_details: string;
  pub_content: string;
  caption: string;
  opa_numbers: string;
  for_posting: boolean;
  created_at: Date;
  requester_id: number | null;
  requester_name?: string;
  requester_email?: string;
  event_name?: string;
  dimensions?: string;
}

interface PublicityRequestRow extends RowDataPacket {
  id: string;
  event_id: number | null;
  pub_head: number;
  pub_head_name: string | null;
  pub_type: string;
  pub_drive_id: string;
  pub_status: string;
  posting_date: Date;
  pub_details: string;
  pub_content: string;
  caption: string;
  opa_numbers: string;
  for_posting: boolean;
  created_at: Date;
  requester_id: number | null;
  requester_name: string;
  requester_email: string;
  event_name: string | null;
  dimensions: string | null;
}

// GET /api/publicity-requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [rows] = await pool.execute(
      `SELECT 
        pr.*,
        m.full_name as requester_name,
        m.email as requester_email,
        e.name as event_name,
        ph.full_name as pub_head_name,
        pr.dimensions
      FROM pub_requests pr
      LEFT JOIN members m ON pr.requester_id = m.id
      LEFT JOIN events e ON pr.event_id = e.id
      LEFT JOIN members ph ON pr.pub_head = ph.id
      ORDER BY pr.created_at DESC`
    ) as [PublicityRequestRow[], any];

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching publicity requests:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/publicity-requests
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      event_id,
      pub_type,
      pub_details,
      pub_content,
      caption,
      posting_date,
      for_posting = true,
      dimensions,
    } = body;

    // Basic validation
    if (!pub_type || !pub_details || !pub_content || !caption || !posting_date) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Insert the new publicity request
    const [result] = await pool.execute(
      `INSERT INTO pub_requests (
        event_id,
        pub_head,
        pub_type,
        pub_drive_id,
        pub_status,
        posting_date,
        pub_details,
        pub_content,
        caption,
        opa_numbers,
        for_posting,
        requester_id,
        created_at,
        dimensions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_id || null,
        null, // pub_head is null by default
        pub_type,
        "", // pub_drive_id will be set later
        "INIT", // Initial status
        new Date(posting_date),
        pub_details,
        pub_content,
        caption,
        "", // opa_numbers will be set later
        for_posting,
        session.user.memberId,
        new Date(),
        dimensions || null
      ]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error) {
    console.error("Error creating publicity request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
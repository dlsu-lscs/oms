import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

interface FileStatusRow extends RowDataPacket {
  status: string;
}

interface UserRow extends RowDataPacket {
  committee_id: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileKeys = searchParams.get('fileKeys')?.split(',') || [];

  if (!fileKeys.length) {
    return NextResponse.json({ error: "No file keys provided" }, { status: 400 });
  }

  try {
    const [rows] = await pool.query<FileStatusRow[]>(
      "SELECT file_key, status FROM file_statuses WHERE file_key IN (?)",
      [fileKeys]
    );

    // Convert array to object for easier lookup
    const statusMap = rows.reduce((acc, row) => {
      acc[row.file_key] = row.status;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ statuses: statusMap });
  } catch (error: any) {
    console.error("Error fetching file statuses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch file statuses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileKey, status } = await request.json();

    if (!fileKey || !status) {
      return NextResponse.json({ error: 'File key and status are required' }, { status: 400 });
    }

    // Check if user is from DOCULOGI for REVISE and APPROVED statuses
    if (['REVISE', 'APPROVED'].includes(status)) {
      const [userRows] = await pool.query<UserRow[]>(
        "SELECT committee_id FROM members WHERE id = ?",
        [session.user.memberId]
      );
      
      if (!userRows.length || userRows[0].committee_id !== 'DOCULOGI') {
        return NextResponse.json({ error: 'Only DOCULOGI members can set this status' }, { status: 403 });
      }
    }

    // Upsert the status
    await pool.query(
      "INSERT INTO file_statuses (file_key, status) VALUES (?, ?) ON DUPLICATE KEY UPDATE status = ?",
      [fileKey, status, status]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating file status:', error);
    return NextResponse.json({ error: 'Failed to update file status' }, { status: 500 });
  }
} 
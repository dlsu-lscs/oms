import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";
import { FileStatus, fileStatuses } from "@/app/types";

const validateStatus = (status: string | null): FileStatus => {
  if (fileStatuses.includes(status as FileStatus)) {
    return status as FileStatus;
  }
  throw new Error(`Invalid status: ${status}`);
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const fileKeys = searchParams.get('fileKeys')?.split(',') || [];

    if (fileKeys.length === 0) {
      return NextResponse.json({ error: 'No file keys provided' }, { status: 400 });
    }

    const [rows] = await pool.query(
      'SELECT file_key, status FROM file_statuses WHERE file_key IN (?)',
      [fileKeys]
    );

    console.log(`QueryRows: ${JSON.stringify(rows)}`);

    const statuses = (rows as any[]).reduce((acc, row) => ({
      ...acc,
      [row.file_key]: row.status
    }), {});

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Error fetching file statuses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileKey, status } = await req.json();
    if (!fileKey) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }

    // Validate status
    const validatedStatus = validateStatus(status);

    // Update or insert the status
    await pool.query(
      'INSERT INTO file_statuses (file_key, status) VALUES (?, ?) ON DUPLICATE KEY UPDATE status = ?',
      [fileKey, validatedStatus, validatedStatus]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating file status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 
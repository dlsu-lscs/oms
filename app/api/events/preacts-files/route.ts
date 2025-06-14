import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { google } from "googleapis";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface EventTrackerRow extends RowDataPacket {
  docu_drive_id: string;
  preacts_deadline: Date;
  preacts_status: string;
}

export async function POST(req: NextRequest) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Get the Pre-Acts status and deadline
    const [trackerRows] = await pool.query<EventTrackerRow[]>(
      'SELECT preacts_status, preacts_deadline FROM event_trackers WHERE event_id = ?',
      [eventId]
    );

    if (!trackerRows || trackerRows.length === 0) {
      return NextResponse.json({ error: 'Event tracker not found' }, { status: 404 });
    }

    const { preacts_status, preacts_deadline } = trackerRows[0];

    // Get the docu_drive_id from event_trackers
    const [rows] = await pool.query<EventTrackerRow[]>(
      "SELECT docu_drive_id FROM event_trackers WHERE event_id = ?",
      [eventId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Event tracker not found" }, { status: 404 });
    }

    const docuDriveId = rows[0].docu_drive_id;
    if (!docuDriveId) {
      return NextResponse.json({ error: "No drive ID found for this event" }, { status: 404 });
    }

    // Initialize Google Drive API
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    // List files in the Pre-Acts folder
    const preactsFolder = await drive.files.list({
      q: `'${docuDriveId}' in parents and name = '[1] Pre-Acts' and mimeType = 'application/vnd.google-apps.folder'`,
      fields: "files(id)",
    });

    if (!preactsFolder.data.files?.length) {
      return NextResponse.json({ error: "Pre-Acts folder not found" }, { status: 404 });
    }

    const preactsFolderId = preactsFolder.data.files[0].id;

    // List all files in the Pre-Acts folder
    const files = await drive.files.list({
      q: `'${preactsFolderId}' in parents and trashed = false`,
      fields: "files(id, name, webViewLink, createdTime, modifiedTime, lastModifyingUser)",
      orderBy: "name",
    });

    return NextResponse.json({
      files: files.data.files?.map((file) => ({
        id: file.id,
        name: file.name,
        url: file.webViewLink,
        type: file.mimeType,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        lastModifiedBy: file.lastModifyingUser?.emailAddress || 'Unknown'
      })) || [],
      preactsDeadline: preacts_deadline,
      preactsStatus: preacts_status
    });
  } catch (error: any) {
    console.error("Error fetching Pre-Acts files:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Pre-Acts files" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { createActivityFolder } from "@/lib/controllers/drive";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { google } from "googleapis";

interface TermRow extends RowDataPacket {
  term: string;
}

interface DriveFile {
  id: string;
  name: string;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (typeof value !== 'string') {
    throw new Error(`${name} environment variable is not set or is not a string`);
  }
  return value;
}

export async function POST(req: NextRequest) {
  try {
    const { eventName, committee, preActsUrls, postActsUrls } = await req.json();
    const steps = [];
    let currentStep = 0;

    try {
      const currentTermId = getRequiredEnvVar('CURRENT_TERM_ID');

      // 1. Get current term
      const [terms] = await pool.query<TermRow[]>(
        'SELECT term FROM terms WHERE id = ?',
        [currentTermId]
      );

      if (!terms.length) {
        return NextResponse.json({ error: "Current term not found" }, { status: 400 });
      }

      const currentTerm = terms[0].term;
      steps.push({ label: "Finding committee folder", status: "success", message: "" });
      currentStep++;

      // 2. Find committee folder
      const committeeFolder = await findCommitteeFolder(committee);
      if (!committeeFolder) {
        return NextResponse.json({ error: "Committee folder not found" }, { status: 400 });
      }
      steps.push({ label: "Finding term folder", status: "success", message: "" });
      currentStep++;

      // 3. Find term folder
      const termFolder = await findTermFolder(committeeFolder.id, currentTerm);
      if (!termFolder) {
        return NextResponse.json({ error: "Term folder not found" }, { status: 400 });
      }

      // 4. Create activity folder and copy files
      const result = await createActivityFolder(
        eventName,
        preActsUrls,
        postActsUrls,
        termFolder.id
      );

      // Update steps with file creation results
      steps.push({ label: "Create new folder", status: "success", message: "" });
      currentStep++;

      result.results.forEach((res: any) => {
        if (res.error) {
          steps.push({
            label: `Create file: ${res.url}`,
            status: "error",
            message: res.error
          });
        } else {
          steps.push({
            label: `Create file: ${res.url}`,
            status: "success",
            message: ""
          });
        }
        currentStep++;
      });

      steps.push({
        label: "Complete! Click here to access drive.",
        status: "success",
        message: ""
      });

      return NextResponse.json({
        folderId: result.folderId,
        steps
      });
    } catch (error: any) {
      if (error.message.includes('environment variable')) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error generating activity folder:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate activity folder" },
      { status: 500 }
    );
  }
}

async function findCommitteeFolder(committeeName: string): Promise<DriveFile | null> {
  const activityDriveFolderId = getRequiredEnvVar('ACTIVITY_DRIVE_FOLDER_ID');
  const googleServiceAccount = getRequiredEnvVar('GOOGLE_SERVICE_ACCOUNT_JSON');

  const credentials = JSON.parse(googleServiceAccount);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
  });
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: `'${activityDriveFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name contains '${committeeName}' and trashed = false`,
    fields: "files(id, name)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const file = res.data.files?.[0];
  return file ? { id: file.id!, name: file.name! } : null;
}

async function findTermFolder(parentFolderId: string, term: string): Promise<DriveFile | null> {
  const googleServiceAccount = getRequiredEnvVar('GOOGLE_SERVICE_ACCOUNT_JSON');

  const credentials = JSON.parse(googleServiceAccount);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
  });
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name contains 'Term ${term}' and trashed = false`,
    fields: "files(id, name)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const file = res.data.files?.[0];
  return file ? { id: file.id!, name: file.name! } : null;
} 
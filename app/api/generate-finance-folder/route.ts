import { NextRequest, NextResponse } from "next/server";
import { createFinanceFolder } from "@/lib/controllers/drive";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { google } from "googleapis";
import { getRequiredEnvVar } from "@/lib/utils";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OAuth2Client } from 'google-auth-library';

interface TermRow extends RowDataPacket {
  term: string;
}

interface DriveFile {
  id: string;
  name: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is in FIN committee
    if (session.user.committeeId?.toString() !== 'FIN') {
      return new NextResponse('Only Finance committee members can generate finance folders', { status: 403 });
    }

    const body = await req.json();
    const { eventName, templateIds, eventId } = body;

    if (!eventName || !templateIds || !eventId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Initialize OAuth2 client
    const oauth2Client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });

    // Set credentials
    oauth2Client.setCredentials({
      access_token: session.user.accessToken,
      refresh_token: session.user.refreshToken,
    });

    // Initialize Drive API
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Create steps array for tracking progress
    const steps = [];

    // Step 1: Find committee folder
    steps.push({ label: 'Finding committee folder', status: 'pending', message: '' });
    const committeeFolder = await findOrCreateFolder(drive, 'Finance', null);
    steps[0] = { label: 'Found committee folder', status: 'success', message: '' };

    // Step 2: Find term folder
    steps.push({ label: 'Finding term folder', status: 'pending', message: '' });
    const termFolder = await findOrCreateFolder(drive, 'AY 2023-2024', committeeFolder.id);
    steps[1] = { label: 'Found term folder', status: 'success', message: '' };

    // Step 3: Create event folder
    steps.push({ label: 'Create new folder', status: 'pending', message: '' });
    const eventFolder = await createFolder(drive, eventName, termFolder.id);
    steps[2] = { label: 'Created new folder', status: 'success', message: '' };

    // Step 4: Copy templates
    for (const templateId of templateIds) {
      steps.push({ label: `Create file: ${templateId}`, status: 'pending', message: '' });
      try {
        await copyFile(drive, templateId, eventFolder.id, eventName);
        steps[steps.length - 1] = { 
          label: `Created file: ${templateId}`, 
          status: 'success', 
          message: '' 
        };
      } catch (error) {
        steps[steps.length - 1] = { 
          label: `Create file: ${templateId}`, 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Failed to create file' 
        };
      }
    }

    // Step 5: Update event tracker
    steps.push({ label: 'Complete! Click here to access drive.', status: 'pending', message: '' });
    await pool.query(
      'UPDATE event_trackers SET fin_drive_id = ? WHERE event_id = ?',
      [eventFolder.id, eventId]
    );
    steps[steps.length - 1] = { 
      label: 'Complete! Click here to access drive.', 
      status: 'success', 
      message: '' 
    };

    return NextResponse.json({ 
      folderId: eventFolder.id,
      steps 
    });
  } catch (error) {
    console.error('Error generating finance folder:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper functions
async function findOrCreateFolder(drive: any, name: string, parentId: string | null) {
  const query = parentId 
    ? `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`
    : `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  if (response.data.files.length > 0) {
    return response.data.files[0];
  }

  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId && { parents: [parentId] }),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    fields: 'id, name',
  });

  return file.data;
}

async function createFolder(drive: any, name: string, parentId: string) {
  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    fields: 'id, name',
  });

  return file.data;
}

async function copyFile(drive: any, fileId: string, folderId: string, eventName: string) {
  const file = await drive.files.get({
    fileId,
    fields: 'name',
  });

  const newName = `${eventName} - ${file.data.name}`;

  const copiedFile = await drive.files.copy({
    fileId,
    resource: {
      name: newName,
      parents: [folderId],
    },
  });

  return copiedFile.data;
}

async function findTermFolder(term: string): Promise<DriveFile | null> {
  const financeDriveFolderId = getRequiredEnvVar('FINANCE_DRIVE_FOLDER_ID');
  const googleServiceAccount = getRequiredEnvVar('GOOGLE_SERVICE_ACCOUNT_JSON');

  const credentials = JSON.parse(googleServiceAccount);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
  });
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: `'${financeDriveFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name contains 'Term ${term}' and trashed = false`,
    fields: "files(id, name)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const file = res.data.files?.[0];
  return file ? { id: file.id!, name: file.name! } : null;
} 
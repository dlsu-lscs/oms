import { NextRequest, NextResponse } from "next/server";
import { google } from 'googleapis';
import { getRequiredEnvVar } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    const googleServiceAccount = getRequiredEnvVar('GOOGLE_SERVICE_ACCOUNT_JSON');
    const credentials = JSON.parse(googleServiceAccount);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"]
    });
    const drive = google.drive({ version: 'v3', auth });

    // First, get the folder details
    const folderResponse = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType, createdTime, modifiedTime, lastModifyingUser',
      supportsAllDrives: true
    });

    const folder = folderResponse.data;
    const files: any[] = [];
    
    // Add the folder itself if it's not a folder type
    if (folder.mimeType !== 'application/vnd.google-apps.folder') {
      files.push({
        id: folder.id,
        name: folder.name,
        mimeType: folder.mimeType,
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime,
        lastModifiedBy: folder.lastModifyingUser?.displayName || 'Unknown',
        isFolder: true,
        parentFolderId: null,
        parentFolderName: folder.name,
      });
    }

    // Then, get all files in the folder
    const filesResponse = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime, lastModifyingUser, webViewLink)',
      orderBy: 'name',
      supportsAllDrives: true
    });

    if (filesResponse.data.files) {
      files.push(...filesResponse.data.files.map(file => ({
        id: file.id,
        name: file.name,
        url: file.webViewLink,
        mimeType: file.mimeType,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        lastModifiedBy: file.lastModifyingUser?.displayName || 'Unknown',
        isFolder: file.mimeType === 'application/vnd.google-apps.folder',
        parentFolderId: folderId,
        parentFolderName: folder.name,
      })));
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching finance files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getRequiredEnvVar } from "@/lib/utils";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
  modifiedTime: string;
  lastModifyingUser?: {
    emailAddress: string;
  };
  parents?: string[];
}

async function getAllItemsInFolder(drive: any, folderId: string): Promise<DriveFile[]> {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, webViewLink, createdTime, modifiedTime, lastModifyingUser, parents)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    pageSize: 1000,
    orderBy: "name",
  });

  const items = response.data.files || [];
  const folders = items.filter((item: DriveFile) => item.mimeType === 'application/vnd.google-apps.folder');
  
  // Recursively get items from subfolders
  const subfolderItems = await Promise.all(
    folders.map((folder: DriveFile) => getAllItemsInFolder(drive, folder.id))
  );

  // Combine current items with subfolder items
  return [
    ...items,
    ...subfolderItems.flat()
  ];
}

export async function GET() {
  try {
    const folderId = getRequiredEnvVar('FIN_TEMPLATES_DRIVE_FOLDER_ID');
    console.log("Using folder ID:", folderId);
    
    const credentials = JSON.parse(getRequiredEnvVar('GOOGLE_SERVICE_ACCOUNT_JSON'));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive"]
    });
    
    const drive = google.drive({ version: "v3", auth });

    // Get all items recursively
    console.log("\nFetching all items recursively...");
    const allItems = await getAllItemsInFolder(drive, folderId);
    console.log(`Found ${allItems.length} total items`);

    // Create a map of folder IDs to names
    const folderNameMap = new Map<string, string>();
    allItems.forEach(item => {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        folderNameMap.set(item.id, item.name);
      }
    });

    // Process only files and add parent folder name
    const processedItems = allItems
      .filter(item => item.mimeType !== 'application/vnd.google-apps.folder')
      .map(item => ({
        id: item.id,
        name: item.name,
        url: item.webViewLink,
        mimeType: item.mimeType,
        parentFolderId: item.parents?.[0] || folderId,
        parentFolderName: folderNameMap.get(item.parents?.[0] || folderId) || 'Root'
      }));

    console.log("\nProcessed items:");
    console.log(`- Total files: ${processedItems.length}`);
    console.log("\nFull item list:");
    console.log(JSON.stringify(processedItems, null, 2));

    return NextResponse.json(processedItems);
  } catch (error: any) {
    console.error("Error fetching finance templates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch finance templates" },
      { status: 500 }
    );
  }
} 
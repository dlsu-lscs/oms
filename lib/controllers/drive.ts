import { google } from "googleapis";
import { pool } from "@/lib/db";
import { getRequiredEnvVar } from "@/lib/utils";

export function extractFileId(url: string): string | null {
  const match = url.match(/\/d\/([^/]+)/);
  return match ? match[1] : null;
}

interface FileDetail {
  url: string;
  name?: string;
  error?: string;
}

export async function createActivityFolder(
  eventName: string, 
  preActsUrls: string[], 
  postActsUrls: string[], 
  parentFolderId: string,
  eventId: number
) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"]
  });
  const drive = google.drive({ version: "v3", auth });

  // Format the event name with date at the beginning
  const formattedEventName = `[${new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })}] ${eventName.replace("[TEST]", "")}`;

  console.log("Creating folder:", formattedEventName);
  console.log("Pre-Acts URLs:", preActsUrls);
  console.log("Post-Acts URLs:", postActsUrls);

  // 1. Create the main activity folder
  const folderRes = await drive.files.create({
    requestBody: {
      name: formattedEventName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
    supportsAllDrives: true,
  });
  const newFolderId = folderRes.data.id;
  if (!newFolderId) throw new Error("Failed to create folder");

  // 2. Create subfolders
  const subfolders = [
    { name: "[1] Pre-Acts", files: preActsUrls },
    { name: "[2] Post-Acts", files: postActsUrls },
    { name: "[3] Permits", files: [] }
  ];

  console.log("Subfolders to create:", subfolders.map(s => ({ name: s.name, fileCount: s.files.length })));

  const copyResults = [];

  // 3. Create each subfolder and copy its files
  for (const subfolder of subfolders) {
    console.log(`Creating subfolder: ${subfolder.name}`);
    // Create subfolder
    const subfolderRes = await drive.files.create({
      requestBody: {
        name: subfolder.name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [newFolderId],
      },
      fields: "id",
      supportsAllDrives: true,
    });

    if (!subfolderRes.data.id) {
      throw new Error(`Failed to create ${subfolder.name} folder`);
    }

    const subfolderId = subfolderRes.data.id;
    console.log(`Created subfolder ${subfolder.name} with ID: ${subfolderId}`);

    // Copy files to subfolder
    for (const url of subfolder.files) {
      console.log(`Processing file URL: ${url}`);
      const fileId = extractFileId(url);
      if (!fileId) {
        console.log(`Invalid file URL: ${url}`);
        copyResults.push({ url, error: "Invalid file URL" });
        continue;
      }

      try {
        console.log(`Getting file metadata for ID: ${fileId}`);
        const fileMeta = await drive.files.get({ 
          fileId, 
          fields: "name",
          supportsAllDrives: true 
        });
        const fileName = fileMeta.data.name || 'Untitled';
        console.log(`Copying file: ${fileName}`);
        const copied = await drive.files.copy({
          fileId,
          requestBody: {
            name: fileName,
            parents: [subfolderId],
          },
          fields: "id, name",
          supportsAllDrives: true,
        });
        console.log(`Successfully copied file: ${copied.data.name}`);
        copyResults.push({ url, id: copied.data.id, name: copied.data.name });
      } catch (err: any) {
        console.error(`Error copying file: ${err.message}`);
        copyResults.push({ url, error: err.message });
      }
    }
  }

  console.log("Copy results:", copyResults);

  // Update event_trackers with the new docu_drive_id
  try {
    await pool.query(
      "UPDATE event_trackers SET preacts_status = 'AVP', docu_drive_id = ? WHERE event_id = ?",
      [newFolderId, eventId]
    );
    console.log("Updated (", eventId, ") event_trackers with docu_drive_id:", newFolderId);
  } catch (err) {
    console.error("Error updating event_trackers:", err);
    // Don't throw here - we still want to return the folder creation results
  }

  return { folderId: newFolderId, results: copyResults };
}

export async function listFolderFiles(folderId: string) {
  if (!folderId) {
    throw new Error("Missing folderId");
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
  });
  const drive = google.drive({ version: "v3", auth });
  
  // First, get all items in the root folder
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, webViewLink, mimeType, createdTime, modifiedTime, lastModifyingUser)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const items = res.data.files || [];
  const result: any[] = [];

  // Process each item
  for (const item of items) {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      // If it's a folder, get its files
      const subfolderFiles = await drive.files.list({
        q: `'${item.id}' in parents and trashed = false`,
        fields: "files(id, name, webViewLink, mimeType, createdTime, modifiedTime, lastModifyingUser)",
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      // Add the folder itself
      result.push({
        id: item.id,
        name: item.name,
        url: item.webViewLink || `https://drive.google.com/drive/folders/${item.id}`,
        mimeType: item.mimeType,
        createdTime: item.createdTime,
        modifiedTime: item.modifiedTime,
        lastModifiedBy: item.lastModifyingUser?.emailAddress || 'Unknown',
        isFolder: true
      });

      // Add its files
      if (subfolderFiles.data.files) {
        result.push(...subfolderFiles.data.files.map(f => ({
          id: f.id,
          name: f.name,
          url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
          mimeType: f.mimeType,
          createdTime: f.createdTime,
          modifiedTime: f.modifiedTime,
          lastModifiedBy: f.lastModifyingUser?.emailAddress || 'Unknown',
          parentFolderId: item.id,
          parentFolderName: item.name
        })));
      }
    } else {
      // If it's a file, add it directly
      result.push({
        id: item.id,
        name: item.name,
        url: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
        mimeType: item.mimeType,
        createdTime: item.createdTime,
        modifiedTime: item.modifiedTime,
        lastModifiedBy: item.lastModifyingUser?.emailAddress || 'Unknown'
      });
    }
  }

  return result;
}

export async function listFolderFilesWithChildren(folderId: string) {
  if (!folderId) {
    throw new Error("Missing folderId");
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
  });
  const drive = google.drive({ version: "v3", auth });

  // Recursive function to get folder contents
  const getFolderContents = async (currentFolderId: string, level: number = 0, ancestry: boolean[] = []): Promise<any[]> => {
    const res = await drive.files.list({
      q: `'${currentFolderId}' in parents and trashed = false`,
      fields: "files(id, name, webViewLink, mimeType, createdTime, modifiedTime, lastModifyingUser, parents)",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      pageSize: 1000,
    });

    const items = res.data.files || [];
    const result: any[] = [];

    // First, get all folders
    const folders = items.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
    
    // Process each folder
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      if (!folder.id) continue; // Skip if no ID
      
      const isLast = i === folders.length - 1;
      const newAncestry = [...ancestry, isLast];

      // Add the folder itself
      result.push({
        id: folder.id,
        name: folder.name,
        url: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
        mimeType: folder.mimeType,
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime,
        lastModifiedBy: folder.lastModifyingUser?.emailAddress || 'Unknown',
        isFolder: true,
        level,
        ancestry: newAncestry,
        parentFolderId: currentFolderId
      });

      // Recursively get folder contents
      const subfolderContents = await getFolderContents(folder.id, level + 1, newAncestry);
      result.push(...subfolderContents);
    }

    // Then add all files
    const files = items.filter(item => item.mimeType !== 'application/vnd.google-apps.folder');
    files.forEach((file, index) => {
      if (!file.id) return; // Skip if no ID
      
      const isLast = index === files.length - 1;
      result.push({
        id: file.id,
        name: file.name,
        url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        mimeType: file.mimeType,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        lastModifiedBy: file.lastModifyingUser?.emailAddress || 'Unknown',
        isFolder: false,
        level,
        ancestry: [...ancestry, isLast],
        parentFolderId: currentFolderId
      });
    });

    return result;
  };

  // Start the recursive process from the root folder
  return getFolderContents(folderId);
}

export async function createFinanceFolder(
  eventName: string,
  templateUrls: string[],
  termFolderId: string,
  eventId: string
): Promise<{ folderId: string; results: { url: string; error?: string }[] }> {
  const googleServiceAccount = getRequiredEnvVar('GOOGLE_SERVICE_ACCOUNT_JSON');
  const credentials = JSON.parse(googleServiceAccount);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"]
  });
  const drive = google.drive({ version: "v3", auth });

  // Create activity folder
  const folderMetadata = {
    name: eventName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [termFolderId]
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
    supportsAllDrives: true
  });

  const folderId = folder.data.id!;

  // Copy template files to the new folder
  const results = await Promise.all(
    templateUrls.map(async (url) => {
      try {
        const fileId = url.split('/').pop()?.split('?')[0];
        if (!fileId) {
          throw new Error('Invalid file URL');
        }

        const copy = await drive.files.copy({
          fileId,
          requestBody: {
            name: (await drive.files.get({ fileId, fields: 'name' })).data.name,
            parents: [folderId]
          },
          supportsAllDrives: true
        });

        return { url, fileId: copy.data.id };
      } catch (error: any) {
        return { url, error: error.message };
      }
    })
  );

  // Update event_trackers with the new folder ID
  await pool.query(
    'UPDATE event_trackers SET fin_drive_id = ? WHERE event_id = ?',
    [folderId, eventId]
  );

  return { folderId, results };
} 
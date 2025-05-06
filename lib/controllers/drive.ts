import { google } from "googleapis";

function extractFileId(url: string): string | null {
  // Handles both /d/{id}/ and /file/d/{id}/
  const match = url.match(/\/d\/([\w-]+)/) || url.match(/\/file\/d\/([\w-]+)/);
  return match ? match[1] : null;
}

export async function createActivityFolder(eventName: string, templateUrls: string[], parentFolderId: string) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"]
  });
  const drive = google.drive({ version: "v3", auth });

  // 1. Create the new folder
  const folderRes = await drive.files.create({
    requestBody: {
      name: `[TEST] ${eventName}`,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id"
  });
  const newFolderId = folderRes.data.id;
  if (!newFolderId) throw new Error("Failed to create folder");

  // 2. Copy each template file into the new folder
  const copyResults = [];
  for (const url of templateUrls) {
    const fileId = extractFileId(url);
    if (!fileId) {
      copyResults.push({ url, error: "Invalid file URL" });
      continue;
    }
    try {
      const fileMeta = await drive.files.get({ fileId, fields: "name" });
      const copied = await drive.files.copy({
        fileId,
        requestBody: {
          name: `[TEST] ${fileMeta.data.name}`,
          parents: [newFolderId],
        },
        fields: "id, name"
      });
      copyResults.push({ url, id: copied.data.id, name: copied.data.name });
    } catch (err: any) {
      copyResults.push({ url, error: err.message });
    }
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
  
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, webViewLink)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  return res.data.files?.map(f => ({
    id: f.id,
    name: f.name,
    url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`
  })) || [];
} 
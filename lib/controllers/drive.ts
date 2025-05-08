import { google } from "googleapis";

function extractFileId(url: string): string | null {
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
  parentFolderId: string
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
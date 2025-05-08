import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  try {
    const { type } = await req.json();

    if (!type || !['pre-acts', 'post-acts'].includes(type)) {
      return NextResponse.json({ error: "Invalid template type" }, { status: 400 });
    }

    const folderId = type === 'pre-acts' 
      ? process.env.PREACTS_DRIVE_FOLDER_ID!
      : process.env.POSTACTS_DRIVE_FOLDER_ID!;

    const googleServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!;
    const credentials = JSON.parse(googleServiceAccount);

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

    const files = res.data.files?.map(file => ({
      id: file.id,
      name: file.name,
      url: file.webViewLink
    })) || [];

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("Error fetching drive templates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch templates" },
      { status: 500 }
    );
  }
} 
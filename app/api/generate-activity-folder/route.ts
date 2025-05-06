import { NextResponse } from "next/server";
import { createActivityFolder } from "@/lib/controllers/drive";

const PARENT_FOLDER_ID = "1WORS-QQCinKcvkBUMEQjmSwwybm9RHIH";

export async function POST(req: Request) {
  try {
    const { eventName, templateUrls } = await req.json();
    if (!eventName || !Array.isArray(templateUrls)) {
      return NextResponse.json({ error: "Missing eventName or templateUrls" }, { status: 400 });
    }

    const { folderId, results } = await createActivityFolder(eventName, templateUrls, PARENT_FOLDER_ID);
    
    // Build steps array
    const steps = [
      { label: "Create new folder", status: "success", message: "Folder created" }
    ];

    // Add steps for each file
    for (const r of results) {
      if (r.error) {
        steps.push({ label: `Create file: ${r.url}`, status: "error", message: r.error });
      } else {
        steps.push({ label: `Create file: ${r.name}`, status: "success", message: "File created" });
      }
    }

    // Add final step
    steps.push({ label: "Complete! Click here to access drive.", status: "success", message: folderId });

    return NextResponse.json({ steps, folderId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
import { NextResponse } from "next/server";
import { listFolderFiles } from "@/lib/controllers/drive";

export async function POST(req: Request) {
  try {
    const { folderId } = await req.json();
    const files = await listFolderFiles(folderId);
    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
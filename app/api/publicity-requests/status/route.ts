import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Update the publicity request status
    await pool.execute(
      `UPDATE pub_requests 
       SET pub_status = ? 
       WHERE id = ?`,
      [status, requestId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
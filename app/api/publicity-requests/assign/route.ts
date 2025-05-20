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
    const { requestId, memberId } = body;

    if (!requestId || !memberId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Update the publicity request with the new project head
    await pool.execute(
      `UPDATE pub_requests 
       SET pub_head = ? 
       WHERE id = ?`,
      [memberId, requestId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning project head:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
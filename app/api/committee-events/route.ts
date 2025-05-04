import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCommitteeEvents } from "@/lib/controllers/committee-events";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.memberId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const events = await getCommitteeEvents(session.user.memberId);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching committee events:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
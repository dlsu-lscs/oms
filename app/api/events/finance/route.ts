import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFinanceEvents } from "@/lib/controllers/events";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.memberId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const events = await getFinanceEvents(session.user.memberId);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching finance events:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
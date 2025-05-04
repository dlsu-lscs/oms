import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEventAttendees } from "@/lib/controllers/events";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { arn } = await request.json();
    
    if (!arn) {
      return new NextResponse("Invalid event ID", { status: 400 });
    }

    const attendees = await getEventAttendees(arn);
    return NextResponse.json(attendees);
  } catch (error) {
    console.error("Error fetching attendees:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
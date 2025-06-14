import { NextResponse } from "next/server";
import { getEventDates } from "@/lib/controllers/events";

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return new NextResponse("Event ID is required", { status: 400 });
    }

    const dates = await getEventDates(eventId);
    return NextResponse.json(dates);
  } catch (error) {
    console.error("Error fetching event dates:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
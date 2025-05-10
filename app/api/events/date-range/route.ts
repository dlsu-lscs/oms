import { NextResponse } from "next/server";
import { getEventDateRange } from "@/lib/controllers/events";

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return new NextResponse("Event ID is required", { status: 400 });
    }

    const dateRange = await getEventDateRange(eventId);
    
    if (!dateRange) {
      return new NextResponse("Event dates not found", { status: 404 });
    }

    return NextResponse.json(dateRange);
  } catch (error) {
    console.error("Error fetching event date range:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
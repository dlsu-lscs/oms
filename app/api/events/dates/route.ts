import { NextResponse } from "next/server";
import { getEventDates } from "@/lib/controllers/events";

export async function POST(request: Request) {
  try {
    const { arn } = await request.json();

    if (!arn) {
      return NextResponse.json(
        { error: "ARN is required" },
        { status: 400 }
      );
    }

    const dates = await getEventDates(arn);

    if (!dates) {
      return NextResponse.json(
        { error: "Event dates not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dates);
  } catch (error) {
    console.error("Error in event dates API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
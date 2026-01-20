import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Submission deadline: Extended
const SUBMISSION_DEADLINE = new Date('2026-01-21T10:00:00+05:30');

/**
 * GET /api/config/deadline
 * Returns the submission deadline and current server time
 * This endpoint is public (no authentication required)
 */
export async function GET(request: NextRequest) {
  try {
    const serverTime = new Date();
    const isExpired = serverTime > SUBMISSION_DEADLINE;

    return NextResponse.json({
      success: true,
      data: {
        deadline: SUBMISSION_DEADLINE.toISOString(),
        serverTime: serverTime.toISOString(),
        isExpired,
        deadlineIST: "January 21, 2026, 10:00:00 AM IST",
      },
    });
  } catch (error: any) {
    console.error("Deadline config error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Submission deadline: January 15, 2026 23:59:59 IST (UTC+5:30)
const SUBMISSION_DEADLINE = new Date('2026-01-15T23:59:59+05:30');

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
        deadlineIST: "January 15, 2026, 11:59:59 PM IST",
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

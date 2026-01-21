import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Submission deadline: Extended
const SUBMISSION_DEADLINE = new Date('2026-01-21T10:00:00+05:30');
const RSVP_DEADLINE = new Date('2026-01-24T23:59:00+05:30');

/**
 * GET /api/config/deadline
 * Returns the submission deadline, RSVP deadline, and current server time
 * This endpoint is public (no authentication required)
 */
export async function GET(request: NextRequest) {
  try {
    const serverTime = new Date();
    const isSubmissionExpired = serverTime > SUBMISSION_DEADLINE;
    const isRsvpExpired = serverTime > RSVP_DEADLINE;

    return NextResponse.json({
      success: true,
      data: {
        deadline: SUBMISSION_DEADLINE.toISOString(),
        serverTime: serverTime.toISOString(),
        isExpired: isSubmissionExpired,
        deadlineIST: "January 21, 2026, 10:00:00 AM IST",
        rsvpDeadline: RSVP_DEADLINE.toISOString(),
        isRsvpExpired,
        rsvpDeadlineIST: "January 24, 2026, 11:59:00 PM IST",
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

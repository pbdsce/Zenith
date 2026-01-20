import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import Team from "@/models/Team";

export const dynamic = 'force-dynamic';

/**
 * POST /api/team/submit-application
 * Submit team application for evaluation (team lead only)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error.message },
        { status: authResult.status }
      );
    }

    const emailError = requireEmailVerified(authResult);
    if (emailError) {
      return createAuthErrorResponse(emailError);
    }

    // Check if submission deadline has passed (Extended)
    const SUBMISSION_DEADLINE = new Date('2026-01-21T10:00:00+05:30');
    if (new Date() > SUBMISSION_DEADLINE) {
      return NextResponse.json(
        { message: "Submissions are closed. No new submissions are being accepted." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teamCode } = body;

    if (!teamCode) {
      return NextResponse.json(
        { message: "Team code is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const team = await Team.findOne({ teamCode });
    if (!team) {
      return NextResponse.json(
        { message: "Team not found" },
        { status: 404 }
      );
    }

    // Check if user is team lead
    if (team.teamLead !== authResult.user.uid) {
      return NextResponse.json(
        { message: "User is not team lead" },
        { status: 403 }
      );
    }

    // Check if already submitted
    if (team.teamStatus === 'submitted' || team.teamStatus === 'shortlisted' || team.teamStatus === 'rsvped') {
      return NextResponse.json(
        { message: "Already submitted" },
        { status: 409 }
      );
    }

    if (!team.teamMembers || team.teamMembers.length < 1) {
      return NextResponse.json(
        { message: "Team must have at least 1 member" },
        { status: 400 }
      );
    }

    // Check if video pitch is uploaded
    if (!team.videoURL) {
      return NextResponse.json(
        { message: "Video pitch is required before submission" },
        { status: 400 }
      );
    }

    if (!team.submissionPDF) {
      return NextResponse.json(
        { message: "PDF submission is required before submission" },
        { status: 400 }
      );
    }

    // Update team status
    const updatedTeam = await Team.findOneAndUpdate(
      { teamCode },
      { 
        teamStatus: 'submitted',
        submittedAt: new Date(),
        isLooking: false, // No longer looking for members after submission
      },
      { new: true }
    );

    if (!updatedTeam) {
      return NextResponse.json(
        { message: "Failed to update team" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      data: {
        teamCode: updatedTeam.teamCode,
        teamName: updatedTeam.teamName,
        teamStatus: 'submitted',
        submittedAt: updatedTeam.submittedAt,
        membersCount: updatedTeam.memberCount,
      },
    });
  } catch (error: any) {
    console.error("Submit application error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

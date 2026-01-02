import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import Team from "@/models/Team";
import ProblemStatement from "@/models/ProblemStatement";

// Helper to create error response
function createErrorResponse(message: string, code: string, status: number, details?: string) {
  return NextResponse.json({
    success: false,
    message,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  }, { status });
}

export const dynamic = 'force-dynamic';

/**
 * PUT /api/team/update-problem-statement
 * Update team's problem statement (team lead only, active teams only)
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createErrorResponse(authResult.error.message, 'auth_error', authResult.status);
    }

    const emailError = requireEmailVerified(authResult);
    if (emailError) {
      return createAuthErrorResponse(emailError);
    }

    const body = await request.json();
    const { teamCode, problemStatementId } = body;

    if (!teamCode) {
      return createErrorResponse("Team code is required", 'validation_error', 400);
    }

    if (!problemStatementId) {
      return createErrorResponse("Problem statement ID is required", 'validation_error', 400);
    }

    await dbConnect();

    // Verify problem statement exists
    const problemStatement = await ProblemStatement.findById(problemStatementId);
    if (!problemStatement) {
      return createErrorResponse("Problem statement not found", 'ps_not_found', 404);
    }

    const team = await Team.findOne({ teamCode });
    if (!team) {
      return createErrorResponse("Team not found", 'team_not_found', 404);
    }

    // Check if user is team lead
    if (team.teamLead !== authResult.user.uid) {
      return createErrorResponse("Only team lead can update problem statement", 'forbidden', 403);
    }

    // Only allow update for teams that haven't submitted yet
    // Team status 'pending' means active/not submitted
    if (team.teamStatus !== 'pending') {
      return createErrorResponse("Cannot update problem statement after submission", 'submission_locked', 400);
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { teamCode },
      { $set: { appliedFor: problemStatementId } },
      { new: true }
    );

    if (!updatedTeam) {
      return createErrorResponse("Failed to update problem statement", 'update_failed', 500);
    }

    return NextResponse.json({
      success: true,
      message: "Problem statement updated successfully",
      data: {
        teamCode: updatedTeam.teamCode,
        appliedFor: {
          id: problemStatement._id.toString(),
          title: problemStatement.title,
        },
      },
    });
  } catch (error: any) {
    console.error("Update problem statement error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Server error",
      'server_error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

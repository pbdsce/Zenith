import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, requireEvaluator, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import Evaluator from "@/models/Evaluator";
import ProblemStatement from "@/models/ProblemStatement";

export const dynamic = 'force-dynamic';

function createSuccessResponse(message: string, data: any, status = 200) {
  return NextResponse.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }, { status });
}

function createErrorResponse(message: string, code: string, status: number) {
  return NextResponse.json({
    success: false,
    message,
    error: { code, message },
    timestamp: new Date().toISOString(),
  }, { status });
}

/**
 * GET /api/evaluator/teams/:teamCode
 * Get detailed team info for evaluation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamCode: string } }
) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult);
    }

    const evaluatorCheck = requireEvaluator(authResult);
    if (evaluatorCheck) {
      return createAuthErrorResponse(evaluatorCheck);
    }

    await dbConnect();

    // Verify evaluator is assigned to this team
    const evaluator = await Evaluator.findOne({ uid: authResult.user.uid });
    if (!evaluator) {
      return createErrorResponse("Evaluator not found", "NOT_FOUND", 404);
    }

    const assignment = evaluator.assignedTeams.find(
      (t: any) => t.teamCode === params.teamCode
    );
    if (!assignment) {
      return createErrorResponse("You are not assigned to this team", "NOT_ASSIGNED", 403);
    }

    const team = await Team.findOne({ teamCode: params.teamCode });
    if (!team) {
      return createErrorResponse("Team not found", "NOT_FOUND", 404);
    }

    // Get member details
    const memberUids = team.teamMembers.map((m: any) => m.uid);
    const members = await User.find({ uid: { $in: memberUids } })
      .select('uid name email organisation github_link linkedin_link resume_link');

    // Get problem statement
    let problemStatement = null;
    if (team.appliedFor) {
      const ps = await ProblemStatement.findById(team.appliedFor);
      if (ps) {
        problemStatement = { id: ps._id.toString(), title: ps.title, description: ps.description };
      }
    }

    const formattedMembers = team.teamMembers.map((member: any) => {
      const userInfo = members.find(u => u.uid === member.uid);
      return {
        uid: member.uid,
        name: userInfo?.name || 'Unknown',
        email: userInfo?.email || null,
        organisation: userInfo?.organisation || null,
        github_link: userInfo?.github_link || null,
        linkedin_link: userInfo?.linkedin_link || null,
        resume_link: userInfo?.resume_link || null,
        role: member.role,
      };
    });

    return createSuccessResponse("Team details retrieved successfully", {
      teamCode: team.teamCode,
      teamName: team.teamName,
      teamMembers: formattedMembers,
      memberCount: team.memberCount,
      appliedFor: problemStatement,
      videoURL: team.videoURL || null,
      submissionPDF: team.submissionPDF || null,
      anyOtherLink: team.anyOtherLink || null,
      isEvaluated: team.isEvaluated,
      evaluations: team.evaluations || [],
      votes: team.votes || [],
      submittedAt: team.submittedAt || null,
    });
  } catch (error: any) {
    console.error("Get team details error:", error);
    return createErrorResponse("Failed to retrieve team", "SERVER_ERROR", 500);
  }
}

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
 * GET /api/evaluator/teams
 * Get teams assigned to the evaluator
 */
export async function GET(request: NextRequest) {
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

    const evaluator = await Evaluator.findOne({ uid: authResult.user.uid });
    if (!evaluator) {
      return createSuccessResponse("No assigned teams", {
        teams: [],
        stats: { assigned: 0, evaluated: 0, pending: 0 },
      });
    }

    // Get assigned teams
    const teamCodes = evaluator.assignedTeams.map((t: any) => t.teamCode);
    const teams = await Team.find({ teamCode: { $in: teamCodes } });

    // Get problem statements
    const problemIds = teams.map(t => t.appliedFor).filter((id): id is string => Boolean(id));
    const problemStatements = await ProblemStatement.find({ _id: { $in: problemIds } });

    const formattedTeams = teams.map(team => {
      const assignment = evaluator.assignedTeams.find((a: any) => a.teamCode === team.teamCode);
      const ps = problemStatements.find(p => p._id.toString() === team.appliedFor);

      return {
        teamCode: team.teamCode,
        teamName: team.teamName,
        memberCount: team.memberCount,
        appliedFor: ps ? { id: ps._id.toString(), title: ps.title } : null,
        videoURL: team.videoURL || null,
        submissionPDF: team.submissionPDF || null,
        isEvaluated: team.isEvaluated,
        scores: team.scores || null,
        assignedAt: assignment?.assignedAt || null,
      };
    });

    return createSuccessResponse("Assigned teams retrieved successfully", {
      teams: formattedTeams,
      stats: {
        assigned: evaluator.assignedCount,
        evaluated: evaluator.evaluatedCount,
        pending: evaluator.assignedCount - evaluator.evaluatedCount,
      },
    });
  } catch (error: any) {
    console.error("Get evaluator teams error:", error);
    return createErrorResponse("Failed to retrieve teams", "SERVER_ERROR", 500);
  }
}

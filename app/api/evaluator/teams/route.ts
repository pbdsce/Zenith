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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'assigned'; // 'assigned', 'community', 'tier'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort'); // 'votes'
    const filter = searchParams.get('filter'); // 'submitted'
    const tier = searchParams.get('tier'); // 'strongly_accepted', etc.

    const skip = (page - 1) * limit;

    await dbConnect();

    const evaluator = await Evaluator.findOne({ uid: authResult.user.uid });
    const assignedTeamCodes = evaluator ? evaluator.assignedTeams.map((t: any) => t.teamCode) : [];

    // --- Build Aggregation Pipeline ---
    const pipeline: any[] = [];

    if (type === 'assigned') {
      if (!evaluator) {
        return createSuccessResponse("No assigned teams", {
          teams: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
          stats: { assigned: 0, evaluated: 0, pending: 0 },
        });
      }
      pipeline.push({ $match: { teamCode: { $in: assignedTeamCodes } } });
    } else if (type === 'community') {
      pipeline.push({ $match: { teamCode: { $nin: assignedTeamCodes } } });
    } else if (type === 'tier' && tier) {
      // Filter teams that have AT LEAST ONE evaluation with this tier
      pipeline.push({ $match: { 'evaluations.tier': tier } });
    }

    pipeline.push({
      $addFields: {
        voteCount: { $size: { $ifNull: ["$votes", []] } },
        isSubmitted: {
          $or: [
            { $ne: ["$submissionPDF", null] },
            { $ne: ["$videoURL", null] }
          ]
        }
      }
    });

    if (filter === 'submitted') {
      pipeline.push({ $match: { isSubmitted: true } });
    }

    if (sort === 'votes') {
      pipeline.push({ $sort: { voteCount: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    });

    // Execute Aggregation
    const result = await Team.aggregate(pipeline);

    const metadata = result[0].metadata[0] || { total: 0 };
    const rawTeams = result[0].data;
    const totalTeams = metadata.total;
    const totalPages = Math.ceil(totalTeams / limit);

    // Fetch Problem Statements for these teams
    const problemIds = [...new Set(rawTeams.map((t: any) => t.appliedFor).filter((id: any) => Boolean(id)))];
    // @ts-ignore
    const problemStatements = await ProblemStatement.find({ _id: { $in: problemIds } });

    // Helper to format team
    const formatTeam = (team: any) => {
      const ps = problemStatements.find(p => p._id.toString() === team.appliedFor);
      const isAssigned = assignedTeamCodes.includes(team.teamCode);
      const assignment = isAssigned ? evaluator?.assignedTeams.find((a: any) => a.teamCode === team.teamCode) : null;

      // Check if THIS evaluator has evaluated/voted
      const myEvaluation = team.evaluations?.find((e: any) => e.evaluatorId === authResult.user.uid);
      const myVote = team.votes?.find((v: any) => v.evaluatorId === authResult.user.uid);

      return {
        teamCode: team.teamCode,
        teamName: team.teamName,
        memberCount: team.memberCount,
        appliedFor: ps ? { id: ps._id.toString(), title: ps.title } : null,
        videoURL: team.videoURL || null,
        submissionPDF: team.submissionPDF || null,
        anyOtherLink: team.anyOtherLink || null,

        // Evaluation Context
        isAssigned,
        assignedAt: assignment?.assignedAt || null,

        // My Actions
        myEvaluation: myEvaluation || null,
        myVote: myVote || null,

        // Public Data
        evaluations: team.evaluations || [],
        votes: team.votes || [],
        voteCount: team.voteCount, // Included for debugging/display

        // Legacy/Global status
        isEvaluated: team.isEvaluated,
      };
    };

    const formattedTeams = rawTeams.map((t: any) => formatTeam(t));

    return createSuccessResponse("Teams retrieved successfully", {
      teams: formattedTeams,
      pagination: {
        total: totalTeams,
        page,
        limit,
        totalPages
      },
      stats: evaluator ? {
        assigned: evaluator.assignedCount,
        evaluated: evaluator.evaluatedCount,
        pending: evaluator.assignedCount - evaluator.evaluatedCount,
      } : { assigned: 0, evaluated: 0, pending: 0 },
    });
  } catch (error: any) {
    console.error("Get evaluator teams error:", error);
    return createErrorResponse("Failed to retrieve teams", "SERVER_ERROR", 500);
  }
}

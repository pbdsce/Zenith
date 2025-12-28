import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, requireAdmin, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import Evaluator from "@/models/Evaluator";

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

import Team from "@/models/Team";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult);
    }

    const adminCheck = requireAdmin(authResult);
    if (adminCheck) {
      return createAuthErrorResponse(adminCheck);
    }

    await dbConnect();

    const evaluators = await Evaluator.find().sort({ createdAt: -1 });

    // Get all team codes from all evaluators
    const allTeamCodes = evaluators.flatMap(ev =>
      ev.assignedTeams.map((t: any) => t.teamCode)
    );

    // Fetch details for these teams
    const teams = await Team.find({ teamCode: { $in: allTeamCodes } })
      .select('teamCode teamName isEvaluated scores');

    const teamsMap = new Map(teams.map(t => [t.teamCode, t]));

    const formatted = evaluators.map(ev => {
      const assignedTeams = ev.assignedTeams.map((assignment: any) => {
        const team = teamsMap.get(assignment.teamCode);
        return {
          teamCode: assignment.teamCode,
          teamName: team?.teamName || 'Unknown Team',
          isEvaluated: team?.isEvaluated || false,
          totalScore: team?.scores?.total || null,
        };
      });

      return {
        id: ev._id.toString(),
        uid: ev.uid,
        name: ev.name,
        email: ev.email,
        assignedTeams: assignedTeams,
        assignedCount: ev.assignedCount,
        evaluatedCount: ev.evaluatedCount,
        pendingCount: ev.assignedCount - ev.evaluatedCount,
        averageScore: ev.stats?.averageScore || 0,
        stats: ev.stats,
        createdAt: ev.createdAt,
        lastEvaluationAt: ev.lastEvaluationAt || null,
      };
    });

    return createSuccessResponse("Evaluators retrieved successfully", {
      evaluators: formatted,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalEvaluators: formatted.length,
        limit: formatted.length
      },
      stats: {
        totalEvaluators: formatted.length,
        totalAssignments: formatted.reduce((acc, curr) => acc + curr.assignedCount, 0),
        totalEvaluated: formatted.reduce((acc, curr) => acc + curr.evaluatedCount, 0),
        totalPending: formatted.reduce((acc, curr) => acc + curr.pendingCount, 0),
      }
    });
  } catch (error: any) {
    console.error("Get evaluators error:", error);
    return createErrorResponse("Failed to retrieve evaluators", "SERVER_ERROR", 500);
  }
}

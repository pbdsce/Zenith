import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, requireAdmin, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
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
 * GET /api/admin/teams
 * Get all teams with filtering's and pagination (admin only)
 */
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const status = searchParams.get('status');
    const isShortlisted = searchParams.get('isShortlisted');
    const isEvaluated = searchParams.get('isEvaluated');
    const appliedFor = searchParams.get('appliedFor');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    await dbConnect();

    const query: any = {};

    if (status) query.teamStatus = status;
    if (isShortlisted === 'true') query.isShortlisted = true;
    if (isShortlisted === 'false') query.isShortlisted = false;
    if (isEvaluated === 'true') query.isEvaluated = true;
    if (isEvaluated === 'false') query.isEvaluated = false;
    if (appliedFor) query.appliedFor = appliedFor;

    if (search) {
      query.$or = [
        { teamName: { $regex: search, $options: 'i' } },
        { teamCode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj: any = { [sortBy]: sortOrder };

    const [teams, totalTeams] = await Promise.all([
      Team.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortObj),
      Team.countDocuments(query),
    ]);

    // Get team leads and problem statements
    const teamLeadUids = teams.map(t => t.teamLead);
    const problemIds = teams.map(t => t.appliedFor).filter((id): id is string => Boolean(id));

    const [teamLeads, problemStatements] = await Promise.all([
      User.find({ uid: { $in: teamLeadUids } }).select('uid name email'),
      ProblemStatement.find({ _id: { $in: problemIds } }).select('title'),
    ]);

    // Get stats
    const [submitted, shortlisted, rsvped] = await Promise.all([
      Team.countDocuments({ teamStatus: 'submitted' }),
      Team.countDocuments({ isShortlisted: true }),
      Team.countDocuments({ teamStatus: 'rsvped' }),
    ]);

    const formattedTeams = teams.map(team => {
      const lead = teamLeads.find(u => u.uid === team.teamLead);
      const ps = problemStatements.find(p => p._id.toString() === team.appliedFor);
      
      return {
        teamCode: team.teamCode,
        teamName: team.teamName,
        teamLead: lead ? { id: lead._id.toString(), uid: lead.uid, name: lead.name, email: lead.email } : null,
        memberCount: team.memberCount,
        teamStatus: team.teamStatus,
        appliedFor: ps ? { id: ps._id.toString(), title: ps.title } : null,
        isEvaluated: team.isEvaluated,
        isShortlisted: team.isShortlisted,
        scores: team.scores || null,
        createdAt: team.createdAt,
        submittedAt: team.submittedAt || null,
      };
    });

    return createSuccessResponse("Teams retrieved successfully", {
      teams: formattedTeams,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTeams / limit),
        totalTeams,
        limit,
      },
      stats: {
        totalTeams,
        submitted,
        shortlisted,
        rsvped,
        pending: totalTeams - submitted,
      },
    });
  } catch (error: any) {
    console.error("Get teams error:", error);
    return createErrorResponse("Failed to retrieve teams", "SERVER_ERROR", 500);
  }
}

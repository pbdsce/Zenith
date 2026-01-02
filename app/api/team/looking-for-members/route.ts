import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
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

function createErrorResponse(message: string, code: string, status: number, details?: string) {
  return NextResponse.json({
    success: false,
    message,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  }, { status });
}

/**
 * GET /api/team/looking-for-members
 * Get list of teams looking for members
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createErrorResponse(authResult.error.message, 'auth_error', authResult.status);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const appliedFor = searchParams.get('appliedFor');

    await dbConnect();

    const query: any = { isLooking: true, memberCount: { $lt: 4 } };

    if (appliedFor) {
      query.appliedFor = appliedFor;
    }

    const search = searchParams.get('search');
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };

      // Find matching problem statements
      const matchingPs = await ProblemStatement.find({
        title: searchRegex
      }).select('_id');
      const matchingPsIds = matchingPs.map(ps => ps._id.toString());

      query.$or = [
        { teamName: searchRegex },
        { teamCode: searchRegex },
        { appliedFor: { $in: matchingPsIds } }
      ];
    }

    const skip = (page - 1) * limit;

    const [teams, totalTeams] = await Promise.all([
      Team.find(query)
        .select('teamCode teamName teamLead teamMembers memberCount appliedFor isLooking')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Team.countDocuments(query),
    ]);

    // Get team lead info, team members info, and problem statement info
    const teamLeadUids = teams.map(t => t.teamLead);
    const allMemberUids = teams.flatMap(t => t.teamMembers.map((m: any) => m.uid));
    const uniqueMemberUids = [...new Set(allMemberUids)];
    const problemStatementIds = teams.map(t => t.appliedFor).filter((id): id is string => Boolean(id));

    const [teamLeads, teamMembers, problemStatements] = await Promise.all([
      User.find({ uid: { $in: teamLeadUids } }).select('uid name'),
      User.find({ uid: { $in: uniqueMemberUids } }).select('uid name organisation'),
      ProblemStatement.find({ _id: { $in: problemStatementIds } }).select('_id title'),
    ]);

    const formattedTeams = teams.map(team => {
      const lead = teamLeads.find(u => u.uid === team.teamLead);
      const ps = problemStatements.find(p => p._id.toString() === team.appliedFor);

      const formattedMembers = team.teamMembers.map((m: any) => {
        const member = teamMembers.find(u => u.uid === m.uid);
        return {
          id: m.uid,
          name: member?.name || 'Unknown',
          organisation: member?.organisation || null,
        };
      });

      return {
        teamCode: team.teamCode,
        teamName: team.teamName,
        teamLead: {
          id: lead?.uid || team.teamLead,
          name: lead?.name || 'Unknown',
        },
        teamMembers: formattedMembers,
        currentMemberCount: team.memberCount,
        maxMembers: 4,
        appliedFor: ps ? { id: ps._id.toString(), title: ps.title } : null,
        isLooking: team.isLooking,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        teams: formattedTeams,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTeams / limit),
          totalTeams,
          limit,
        },
      },
    });
  } catch (error: any) {
    console.error("Get looking-for-members error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Server error",
      'server_error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

/**
 * PUT /api/team/looking-for-members
 * Toggle team's looking for members status (team lead only)
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
    const { teamCode, isLooking } = body;

    if (!teamCode) {
      return createErrorResponse("Team code is required", 'validation_error', 400);
    }

    if (typeof isLooking !== 'boolean') {
      return createErrorResponse("isLooking must be a boolean", 'validation_error', 400);
    }

    await dbConnect();

    const team = await Team.findOne({ teamCode });
    if (!team) {
      return createErrorResponse("Team not found", 'team_not_found', 404);
    }

    // Check if user is team lead
    if (team.teamLead !== authResult.user.uid) {
      return createErrorResponse("User is not team lead", 'forbidden', 403);
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { teamCode },
      { $set: { isLooking } },
      { new: true }
    );

    if (!updatedTeam) {
      return createErrorResponse("Failed to update status", 'update_failed', 500);
    }

    return NextResponse.json({
      success: true,
      message: "Team status updated successfully",
      data: {
        teamCode: updatedTeam.teamCode,
        isLooking: updatedTeam.isLooking,
      },
    });
  } catch (error: any) {
    console.error("Update looking-for-members error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Server error",
      'server_error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

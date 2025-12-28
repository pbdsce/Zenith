import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse } from "@/lib/middleware/auth";
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
 * GET /api/team/looking-for-members
 * Get list of teams looking for members
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error.message },
        { status: authResult.status }
      );
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
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
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
      return NextResponse.json(
        { message: authResult.error.message },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { teamCode, isLooking } = body;

    if (!teamCode) {
      return NextResponse.json(
        { message: "Team code is required" },
        { status: 400 }
      );
    }

    if (typeof isLooking !== 'boolean') {
      return NextResponse.json(
        { message: "isLooking must be a boolean" },
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

    const updatedTeam = await Team.findOneAndUpdate(
      { teamCode },
      { $set: { isLooking } },
      { new: true }
    );

    if (!updatedTeam) {
      return NextResponse.json(
        { message: "Failed to update status" },
        { status: 500 }
      );
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
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

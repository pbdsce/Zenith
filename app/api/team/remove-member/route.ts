import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireAdmin } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import TeamJoinRequest from "@/models/TeamJoinRequest";

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
 * PUT /api/team/remove-member
 * Remove a member from team (team lead or admin only)
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
    const { teamCode, memberId, setTheirLookingStatus = true } = body;

    if (!teamCode || !memberId) {
      return NextResponse.json(
        { message: "Team code and member ID are required" },
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

    // Check if user is team lead or admin
    const isTeamLead = team.teamLead === authResult.user.uid;
    const isAdmin = authResult.user.role === 'admin';
    
    if (!isTeamLead && !isAdmin) {
      return NextResponse.json(
        { message: "User is not team lead or admin" },
        { status: 403 }
      );
    }

    if (memberId === authResult.user.uid && !isAdmin) {
      return NextResponse.json(
        { message: "Cannot remove yourself. Use leave team instead." },
        { status: 400 }
      );
    }

    // Cannot remove after submission
    if (team.teamStatus === 'submitted' || team.teamStatus === 'shortlisted' || team.teamStatus === 'rsvped') {
      return NextResponse.json(
        { message: "Cannot remove after submission" },
        { status: 400 }
      );
    }

    // Find the member to remove
    const memberIndex = team.teamMembers.findIndex((m: any) => m.uid === memberId);
    if (memberIndex === -1) {
      return NextResponse.json(
        { message: "Member not found in team" },
        { status: 404 }
      );
    }

    // Get member info before removing
    const removedMember = await User.findOne({ uid: memberId });
    const memberName = removedMember?.name || 'Unknown';

    // Remove member from team
    team.teamMembers.splice(memberIndex, 1);
    await team.save();

    // Update removed member's user record
    await User.findOneAndUpdate(
      { uid: memberId },
      { teamCode: null, isLooking: Boolean(setTheirLookingStatus) }
    );
    await TeamJoinRequest.updateMany(
      {
        userId: memberId,
        teamCode: team.teamCode,
        status: 'pending',
      },
      {
        status: 'cancelled',
        respondedAt: new Date(),
      }
    );

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
      data: {
        teamCode,
        removedMember: {
          id: memberId,
          name: memberName,
        },
        currentMemberCount: team.memberCount,
      },
    });
  } catch (error: any) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

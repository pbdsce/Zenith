import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import TeamJoinRequest from "@/models/TeamJoinRequest";

// Configure route
export const dynamic = 'force-dynamic';

// Max team members
const MAX_TEAM_MEMBERS = 4;

// Helper to create success response
function createSuccessResponse(message: string, data: any, status = 200) {
  return NextResponse.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }, { status });
}

// Helper to create error response
function createErrorResponse(message: string, code: string, status: number, details?: string) {
  return NextResponse.json({
    success: false,
    message,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  }, { status });
}

/**
 * PUT /api/team/join
 * Join a team using team code
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

    const emailError = requireEmailVerified(authResult);
    if (emailError) {
      return createAuthErrorResponse(emailError);
    }

    const body = await request.json();
    const { teamCode } = body;

    // Validation
    if (!teamCode?.trim()) {
      return NextResponse.json(
        { message: "Team code is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user is already in a team
    const user = await User.findOne({ uid: authResult.user.uid });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.teamCode) {
      return NextResponse.json(
        { message: "User already in a team" },
        { status: 400 }
      );
    }

    // Find the team
    const team = await Team.findOne({ teamCode: teamCode.trim().toUpperCase() });
    if (!team) {
      return NextResponse.json(
        { message: "Invalid team code" },
        { status: 404 }
      );
    }

    // Check if team is full
    if ((team.teamMembers || []).length >= MAX_TEAM_MEMBERS) {
      return NextResponse.json(
        { message: "Team is full" },
        { status: 409 }
      );
    }

    // Check if team has already submitted
    if (team.teamStatus === 'submitted') {
      return NextResponse.json(
        { message: "Team already submitted" },
        { status: 409 }
      );
    }

    // Add user to team
    team.teamMembers.push({
      uid: authResult.user.uid,
      joinedAt: new Date(),
      role: 'Member',
    });

    await team.save();

    // Cancel all pending join requests for this user
    await TeamJoinRequest.updateMany(
      {
        userId: authResult.user.uid,
        status: 'pending',
      },
      {
        status: 'cancelled',
        respondedAt: new Date(),
      }
    );

    // Update user's teamCode and isLooking
    await User.findOneAndUpdate(
      { uid: authResult.user.uid },
      { teamCode: team.teamCode, isLooking: false }
    );

    // Get team members with names
    const memberUids = team.teamMembers.map((m: any) => m.uid);
    const members = await User.find({ uid: { $in: memberUids } }).select('uid name');
    
    const formattedMembers = team.teamMembers.map((member: any) => {
      const userInfo = members.find((u: any) => u.uid === member.uid);
      return {
        id: member.uid,
        name: userInfo?.name || 'Unknown',
        role: member.role,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined team",
      data: {
        teamCode: team.teamCode,
        teamName: team.teamName,
        teamMembers: formattedMembers,
        memberCount: team.memberCount,
      },
    });

  } catch (error: any) {
    console.error("Join team error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import ProblemStatement from "@/models/ProblemStatement";
import TeamJoinRequest from "@/models/TeamJoinRequest";

// Configure route
export const dynamic = 'force-dynamic';

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

// Generate unique 6-8 character alphanumeric team code
async function generateTeamCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = Math.floor(Math.random() * 3) + 6; // 6-8 characters
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check uniqueness
    const existingTeam = await Team.findOne({ teamCode: code });
    if (!existingTeam) {
      return code;
    }
    attempts++;
  }
  
  throw new Error('Failed to generate unique team code');
}

// Check team name uniqueness (case-insensitive)
async function isTeamNameUnique(teamName: string): Promise<boolean> {
  const existingTeam = await Team.findOne({
    teamName: { $regex: new RegExp(`^${teamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });
  return !existingTeam;
}

/**
 * POST /api/team/create
 * Create a new team
 */
export async function POST(request: NextRequest) {
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
    const { teamName, appliedFor, isLooking = false } = body;

    // Validation
    if (!teamName?.trim()) {
      return createErrorResponse("Team name is required", 'validation_error', 400);
    }

    if (teamName.length < 2 || teamName.length > 50) {
      return createErrorResponse("Team name must be 2-50 characters", 'validation_error', 400);
    }

    await dbConnect();

    // Check if user is already in a team
    const user = await User.findOne({ uid: authResult.user.uid });
    if (!user) {
      return createErrorResponse("User not found", 'user_not_found', 404);
    }

    if (user.teamCode) {
      return createErrorResponse("User already in a team", 'already_in_team', 400);
    }

    // Check team name uniqueness
    const isUnique = await isTeamNameUnique(teamName);
    if (!isUnique) {
      return createErrorResponse("Team name already exists", 'team_name_exists', 409);
    }

    // Validate problem statement if provided
    if (appliedFor) {
      const problemStatement = await ProblemStatement.findById(appliedFor);
      if (!problemStatement) {
        return createErrorResponse("Problem statement not found", 'ps_not_found', 404);
      }
      if (!problemStatement.isActive) {
        return createErrorResponse("Problem statement is not active", 'ps_not_active', 400);
      }
    }

    // Generate unique team code
    const teamCode = await generateTeamCode();

    // Create team
    const newTeam = new Team({
      teamCode,
      teamName: teamName.trim(),
      teamLead: authResult.user.uid,
      isLooking: Boolean(isLooking),
      teamMembers: [{
        uid: authResult.user.uid,
        joinedAt: new Date(),
        role: 'Team Lead',
      }],
      memberCount: 1,
      teamStatus: 'pending',
      appliedFor: appliedFor || undefined,
    });

    await newTeam.save();

    // Update user's teamCode
    await User.findOneAndUpdate(
      { uid: authResult.user.uid },
      { teamCode, isLooking: false }
    );

    // Increment problem statement team count if applicable
    if (appliedFor) {
      await ProblemStatement.findByIdAndUpdate(appliedFor, { $inc: { teamCount: 1 } });
    }

    // Cancel all pending join requests and invitations for this user
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

    return NextResponse.json({
      success: true,
      message: "Team created successfully",
      data: {
        teamCode,
        teamName: newTeam.teamName,
        teamLead: authResult.user.uid,
        teamMembers: [{
          id: authResult.user.uid,
          name: user.name,
          role: 'Team Lead',
        }],
        appliedFor: appliedFor || null,
        isLooking: newTeam.isLooking,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("Create team error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Server error",
      'server_error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

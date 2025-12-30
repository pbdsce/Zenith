import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, requireAdmin, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const user = await User.findById(params.id);
    if (!user) {
      return createErrorResponse("Participant not found", "NOT_FOUND", 404);
    }

    let teamInfo = null;
    if (user.teamCode) {
      const team = await Team.findOne({ teamCode: user.teamCode });
      if (team) {
        teamInfo = {
          teamCode: team.teamCode,
          teamName: team.teamName,
          role: team.teamLead === user.uid ? 'Team Lead' : 'Member',
          teamStatus: team.teamStatus,
        };
      }
    }

    return createSuccessResponse("Participant retrieved successfully", {
      id: user._id.toString(),
      uid: user.uid,
      name: user.name,
      email: user.email,
      discord_username: user.discord_username || null,
      age: user.age || null,
      organisation: user.organisation || null,
      bio: user.bio || null,
      resume_link: user.resume_link || null,
      profile_picture: user.profile_picture || null,
      leetcode_profile: user.leetcode_profile || null,
      github_link: user.github_link || null,
      linkedin_link: user.linkedin_link || null,
      codeforces_link: user.codeforces_link || null,
      kaggle_link: user.kaggle_link || null,
      devfolio_link: user.devfolio_link || null,
      portfolio_link: user.portfolio_link || null,
      ctf_profile: user.ctf_profile || null,
      isLooking: user.isLooking,
      teamInfo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error: any) {
    console.error("Get participant error:", error);
    
    if (error.name === 'CastError') {
      return createErrorResponse("Invalid participant ID", "INVALID_ID", 400);
    }
    
    return createErrorResponse("Failed to retrieve participant", "SERVER_ERROR", 500);
  }
}

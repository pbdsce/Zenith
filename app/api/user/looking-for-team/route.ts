import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

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
 * GET /api/user/looking-for-team
 * Get list of users looking for teams
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
    const organisation = searchParams.get('organisation');
    const skills = searchParams.get('skills');

    await dbConnect();

    const query: any = { isLooking: true };
    
    // Add organisation filter if provided
    if (organisation) {
      query.organisation = organisation;
    }
    
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (skillsArray.length > 0) {
        query.bio = { $regex: skillsArray.join('|'), $options: 'i' };
      }
    }

    const search = searchParams.get('search');
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { organisation: searchRegex },
        { bio: searchRegex }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select('uid name email organisation bio profile_picture github_link linkedin_link leetcode_profile')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    const formattedUsers = users.map(user => ({
      id: user.uid,
      name: user.name,
      email: user.email,
      organisation: user.organisation || null,
      bio: user.bio || null,
      profile_picture: user.profile_picture || null,
      github_link: user.github_link || null,
      linkedin_link: user.linkedin_link || null,
      leetcode_profile: user.leetcode_profile || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          limit,
        },
      },
    });
  } catch (error: any) {
    console.error("Get looking-for-team error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/looking-for-team
 * Toggle user's looking for team status
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
    const { isLooking } = body;

    if (typeof isLooking !== 'boolean') {
      return NextResponse.json(
        { message: "isLooking must be a boolean" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ uid: authResult.user.uid });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Cannot set isLooking to true if already in a team
    if (isLooking && user.teamCode) {
      return NextResponse.json(
        { message: "Cannot set isLooking to true while part of a team" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { uid: authResult.user.uid },
      { $set: { isLooking } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { message: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      data: {
        isLooking: updatedUser.isLooking
      }
    });
  } catch (error: any) {
    console.error("Update looking-for-team error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

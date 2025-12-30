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
    const search = searchParams.get('search');
    const organisation = searchParams.get('organisation');
    const hasTeam = searchParams.get('hasTeam');
    const isLooking = searchParams.get('isLooking');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    await dbConnect();

    const query: any = { role: 'user' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (organisation) {
      query.organisation = { $regex: organisation, $options: 'i' };
    }

    if (hasTeam === 'true') {
      query.teamCode = { $exists: true, $ne: null };
    } else if (hasTeam === 'false') {
      query.$or = [{ teamCode: { $exists: false } }, { teamCode: null }];
    }

    if (isLooking === 'true') {
      query.isLooking = true;
    } else if (isLooking === 'false') {
      query.isLooking = false;
    }

    const skip = (page - 1) * limit;
    const sortObj: any = { [sortBy]: sortOrder };

    const [users, totalParticipants] = await Promise.all([
      User.find(query)
        .select('uid name email phone discord_username organisation age isLooking teamCode resume_link profile_picture github_link linkedin_link createdAt')
        .skip(skip)
        .limit(limit)
        .sort(sortObj),
      User.countDocuments(query),
    ]);

    const teamCodes = users.map(u => u.teamCode).filter((code): code is string => Boolean(code));
    const teams = await Team.find({ teamCode: { $in: teamCodes } }).select('teamCode teamName');

    const [withTeams, lookingForTeam] = await Promise.all([
      User.countDocuments({ role: 'user', teamCode: { $exists: true, $ne: null } }),
      User.countDocuments({ role: 'user', isLooking: true }),
    ]);

    const formattedUsers = users.map(user => {
      const team = teams.find(t => t.teamCode === user.teamCode);
      return {
        id: user._id.toString(),
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        discord_username: user.discord_username || null,
        organisation: user.organisation || null,
        age: user.age || null,
        isLooking: user.isLooking,
        teamCode: user.teamCode || null,
        teamName: team?.teamName || null,
        resume_link: user.resume_link || null,
        profile_picture: user.profile_picture || null,
        github_link: user.github_link || null,
        linkedin_link: user.linkedin_link || null,
        createdAt: user.createdAt,
      };
    });

    return createSuccessResponse("Participants retrieved successfully", {
      participants: formattedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalParticipants / limit),
        totalParticipants,
        limit,
      },
      stats: {
        totalParticipants,
        withTeams,
        lookingForTeam,
        individual: totalParticipants - withTeams,
      },
    });
  } catch (error: any) {
    console.error("Get participants error:", error);
    return createErrorResponse("Failed to retrieve participants", "SERVER_ERROR", 500);
  }
}

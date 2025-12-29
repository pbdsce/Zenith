import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import TeamJoinRequest from "@/models/TeamJoinRequest";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    if (!teamCode?.trim()) {
      return NextResponse.json(
        { message: "Team code is required" },
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

    if (user.teamCode) {
      return NextResponse.json(
        { message: "You are already part of a team" },
        { status: 400 }
      );
    }

    const team = await Team.findOne({ teamCode: teamCode.trim().toUpperCase() });
    if (!team) {
      return NextResponse.json(
        { message: "Team not found" },
        { status: 404 }
      );
    }

    if (team.memberCount >= 4) {
      return NextResponse.json(
        { message: "Team is full" },
        { status: 409 }
      );
    }

    if (!team.isLooking) {
      return NextResponse.json(
        { message: "Team is not currently looking for members" },
        { status: 400 }
      );
    }

    const existingRequest = await TeamJoinRequest.findOne({
      teamCode: team.teamCode,
      userId: authResult.user.uid,
      status: 'pending',
    });

    if (existingRequest) {
      return NextResponse.json(
        { message: "You have already sent a request to this team" },
        { status: 409 }
      );
    }

    const joinRequest = new TeamJoinRequest({
      teamCode: team.teamCode,
      userId: authResult.user.uid,
      userName: user.name,
      userEmail: user.email,
      status: 'pending',
    });

    await joinRequest.save();

    return NextResponse.json({
      success: true,
      message: "Join request sent successfully",
      data: {
        requestId: joinRequest._id.toString(),
        teamCode: team.teamCode,
        teamName: team.teamName,
        status: 'pending',
        requestedAt: joinRequest.requestedAt,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("Send join request error:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "You have already sent a request to this team" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const teamCode = searchParams.get('teamCode');
    const type = searchParams.get('type') || 'team';

    await dbConnect();

    if (type === 'team') {
      if (!teamCode) {
        return NextResponse.json(
          { message: "Team code is required" },
          { status: 400 }
        );
      }

      const team = await Team.findOne({ teamCode: teamCode.trim().toUpperCase() });
      if (!team) {
        return NextResponse.json(
          { message: "Team not found" },
          { status: 404 }
        );
      }

      if (team.teamLead !== authResult.user.uid) {
        return NextResponse.json(
          { message: "Only team lead can view join requests" },
          { status: 403 }
        );
      }

      const requests = await TeamJoinRequest.find({
        teamCode: team.teamCode,
        status: 'pending',
      }).sort({ requestedAt: -1 });

      return NextResponse.json({
        success: true,
        data: {
          requests: requests.map(req => ({
            requestId: req._id.toString(),
            userId: req.userId,
            userName: req.userName,
            userEmail: req.userEmail,
            status: req.status,
            requestedAt: req.requestedAt,
          })),
        },
      });
    } else {
      const requests = await TeamJoinRequest.find({
        userId: authResult.user.uid,
      }).sort({ requestedAt: -1 });

      return NextResponse.json({
        success: true,
        data: {
          requests: requests.map(req => ({
            requestId: req._id.toString(),
            teamCode: req.teamCode,
            status: req.status,
            requestedAt: req.requestedAt,
            respondedAt: req.respondedAt,
          })),
        },
      });
    }
  } catch (error: any) {
    console.error("Get join requests error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

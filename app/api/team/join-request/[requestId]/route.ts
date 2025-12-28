import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import TeamJoinRequest from "@/models/TeamJoinRequest";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error.message },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { message: "Action must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    await dbConnect();

    const joinRequest = await TeamJoinRequest.findById(params.requestId);
    if (!joinRequest) {
      return NextResponse.json(
        { message: "Join request not found" },
        { status: 404 }
      );
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { message: `Request has already been ${joinRequest.status}` },
        { status: 400 }
      );
    }

    const team = await Team.findOne({ teamCode: joinRequest.teamCode });
    if (!team) {
      return NextResponse.json(
        { message: "Team not found" },
        { status: 404 }
      );
    }

    if (team.teamLead !== authResult.user.uid) {
      return NextResponse.json(
        { message: "Only team lead can respond to join requests" },
        { status: 403 }
      );
    }

    if (['submitted', 'shortlisted', 'rsvped'].includes(team.teamStatus)) {
      return NextResponse.json(
        { message: "Cannot modify team after submission" },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      if (team.memberCount >= 4) {
        return NextResponse.json(
          { message: "Team is full" },
          { status: 409 }
        );
      }

      const requestingUser = await User.findOne({ uid: joinRequest.userId });
      if (!requestingUser) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      if (requestingUser.teamCode) {
        joinRequest.status = 'declined';
        joinRequest.respondedAt = new Date();
        joinRequest.respondedBy = authResult.user.uid;
        await joinRequest.save();

        return NextResponse.json(
          { message: "User is already in another team. Request declined." },
          { status: 409 }
        );
      }

      team.teamMembers.push({
        uid: joinRequest.userId,
        joinedAt: new Date(),
        role: 'Member',
      });

      await team.save();

      await User.findOneAndUpdate(
        { uid: joinRequest.userId },
        { teamCode: team.teamCode, isLooking: false }
      );

      joinRequest.status = 'accepted';
      joinRequest.respondedAt = new Date();
      joinRequest.respondedBy = authResult.user.uid;
      await joinRequest.save();

      await TeamJoinRequest.updateMany(
        {
          userId: joinRequest.userId,
          status: 'pending',
          _id: { $ne: joinRequest._id },
        },
        {
          status: 'cancelled',
          respondedAt: new Date(),
        }
      );

      return NextResponse.json({
        success: true,
        message: "Join request accepted. User added to team.",
        data: {
          requestId: joinRequest._id.toString(),
          teamCode: team.teamCode,
          teamName: team.teamName,
          status: 'accepted',
        },
      });
    } else {
      joinRequest.status = 'declined';
      joinRequest.respondedAt = new Date();
      joinRequest.respondedBy = authResult.user.uid;
      await joinRequest.save();

      return NextResponse.json({
        success: true,
        message: "Join request declined",
        data: {
          requestId: joinRequest._id.toString(),
          status: 'declined',
        },
      });
    }
  } catch (error: any) {
    console.error("Respond to join request error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

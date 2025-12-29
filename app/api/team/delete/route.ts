import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import ProblemStatement from "@/models/ProblemStatement";

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/team/delete
 * Delete a team (team lead only)
 */
export async function DELETE(request: NextRequest) {
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

    if (!teamCode) {
      return NextResponse.json(
        { message: "Team code is required" },
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
        { message: "Only team lead can delete the team" },
        { status: 403 }
      );
    }

    // Prevent deletion if team has been submitted
    if (team.teamStatus === 'submitted' || team.teamStatus === 'shortlisted' || team.teamStatus === 'rsvped') {
      return NextResponse.json(
        { message: "Cannot delete team after submission" },
        { status: 400 }
      );
    }

    const teamName = team.teamName;
    const memberUids = team.teamMembers.map((m: any) => m.uid);

    // Update all team members' teamCode to null and set isLooking to true
    await User.updateMany(
      { uid: { $in: memberUids } },
      { teamCode: null, isLooking: true }
    );

    // Decrement problem statement team count if applicable
    if (team.appliedFor) {
      await ProblemStatement.findByIdAndUpdate(team.appliedFor, { $inc: { teamCount: -1 } });
    }

    // Delete the team
    await Team.deleteOne({ teamCode });

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
      data: {
        teamCode,
        teamName,
        deletedMemberCount: memberUids.length,
      },
    });
  } catch (error: any) {
    console.error("Delete team error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}


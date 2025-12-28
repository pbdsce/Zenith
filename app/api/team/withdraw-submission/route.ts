import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import Team from "@/models/Team";

export const dynamic = 'force-dynamic';

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

    if (team.teamLead !== authResult.user.uid) {
      return NextResponse.json(
        { message: "Only team lead can withdraw submission" },
        { status: 403 }
      );
    }

    if (team.teamStatus !== 'submitted') {
      return NextResponse.json(
        { message: "Team has not submitted yet" },
        { status: 400 }
      );
    }

    if (team.isEvaluated || team.isShortlisted) {
      return NextResponse.json(
        { message: "Cannot withdraw submission after evaluation or shortlisting" },
        { status: 400 }
      );
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { teamCode },
      {
        $unset: {
          videoURL: "",
          submissionPDF: "",
          anyOtherLink: "",
          submittedAt: "",
        },
        $set: {
          teamStatus: 'pending',
        }
      },
      { new: true }
    );

    if (!updatedTeam) {
      return NextResponse.json(
        { message: "Failed to withdraw submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission withdrawn successfully. Submission details have been deleted.",
      data: {
        teamCode: updatedTeam.teamCode,
        teamName: updatedTeam.teamName,
        teamStatus: updatedTeam.teamStatus,
      },
    });
  } catch (error: any) {
    console.error("Withdraw submission error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}


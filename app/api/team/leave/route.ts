import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import ProblemStatement from "@/models/ProblemStatement";
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

function createErrorResponse(message: string, code: string, status: number, details?: string) {
  return NextResponse.json({
    success: false,
    message,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  }, { status });
}

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
    const { setLookingStatus = false } = body;

    await dbConnect();

    const user = await User.findOne({ uid: authResult.user.uid });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.teamCode) {
      return NextResponse.json(
        { message: "User not part of any team" },
        { status: 400 }
      );
    }

    const team = await Team.findOne({ teamCode: user.teamCode });
    if (!team) {
      await User.findOneAndUpdate({ uid: authResult.user.uid }, { teamCode: null });
      return NextResponse.json(
        { message: "Team not found" },
        { status: 404 }
      );
    }

    if (team.teamStatus === 'submitted' || team.teamStatus === 'shortlisted' || team.teamStatus === 'rsvped') {
      return NextResponse.json(
        { message: "Cannot leave after submission" },
        { status: 403 }
      );
    }

    const isTeamLead = team.teamLead === authResult.user.uid;
    const formerTeamName = team.teamName;
    let newTeamLead: string | null = null;

    if (isTeamLead) {
      const otherMembers = team.teamMembers.filter((m: any) => m.uid !== authResult.user.uid);
      
      if (otherMembers.length === 0) {
        await Team.deleteOne({ teamCode: team.teamCode });
        
        if (team.appliedFor) {
          await ProblemStatement.findByIdAndUpdate(team.appliedFor, { $inc: { teamCount: -1 } });
        }
      } else {
        newTeamLead = otherMembers[0].uid;
        
        team.teamMembers = otherMembers.map((m: any) => ({
          ...m,
          role: m.uid === newTeamLead ? 'Team Lead' : 'Member',
        }));
        team.teamLead = newTeamLead;
        
        await team.save();
      }
    } else {
      team.teamMembers = team.teamMembers.filter((m: any) => m.uid !== authResult.user.uid);
      await team.save();
    }
    await User.findOneAndUpdate(
      { uid: authResult.user.uid },
      { 
        teamCode: null, 
        isLooking: Boolean(setLookingStatus) 
      }
    );
    await TeamJoinRequest.updateMany(
      {
        userId: authResult.user.uid,
        teamCode: team.teamCode,
        status: 'pending',
      },
      {
        status: 'cancelled',
        respondedAt: new Date(),
      }
    );

    const responseData: any = {
      formerTeam: formerTeamName,
      isLooking: Boolean(setLookingStatus),
    };
    
    if (newTeamLead) {
      responseData.newTeamLead = newTeamLead;
    }

    return NextResponse.json({
      success: true,
      message: "Successfully left team",
      data: responseData,
    });

  } catch (error: any) {
    console.error("Leave team error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

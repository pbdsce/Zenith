import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, requireAdmin, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import ProblemStatement from "@/models/ProblemStatement";
import Evaluator from "@/models/Evaluator";

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
 * GET /api/admin/teams/:teamCode
 * Get detailed team info (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamCode: string } }
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

    const team = await Team.findOne({ teamCode: params.teamCode });
    if (!team) {
      return createErrorResponse("Team not found", "NOT_FOUND", 404);
    }

    // Get member details
    const memberUids = team.teamMembers.map((m: any) => m.uid);
    const members = await User.find({ uid: { $in: memberUids } })
      .select('uid name email organisation profile_picture discord_username resume_link github_link');

    // Get problem statement
    let problemStatement = null;
    if (team.appliedFor) {
      const ps = await ProblemStatement.findById(team.appliedFor);
      if (ps) {
        problemStatement = { id: ps._id.toString(), title: ps.title };
      }
    }

    // Get evaluator info
    // Fetch all evaluators who are assigned to this team
    const assignedEvaluators = await Evaluator.find({ "assignedTeams.teamCode": team.teamCode })
      .select('name email uid assignedTeams');

    const formattedMembers = team.teamMembers.map((member: any) => {
      const userInfo = members.find(u => u.uid === member.uid);
      return {
        uid: member.uid,
        name: userInfo?.name || 'Unknown',
        email: userInfo?.email || null,
        organisation: userInfo?.organisation || null,
        role: member.role,
        joinedAt: member.joinedAt,
      };
    });

    return createSuccessResponse("Team retrieved successfully", {
      teamCode: team.teamCode,
      teamName: team.teamName,
      teamLead: {
        id: members.find(u => u.uid === team.teamLead)?._id.toString(),
        uid: members.find(u => u.uid === team.teamLead)?.uid,
        name: members.find(u => u.uid === team.teamLead)?.name,
        email: members.find(u => u.uid === team.teamLead)?.email,
        discord_username: members.find(u => u.uid === team.teamLead)?.discord_username,
        organisation: members.find(u => u.uid === team.teamLead)?.organisation,
        resume_link: members.find(u => u.uid === team.teamLead)?.resume_link,
        github_link: members.find(u => u.uid === team.teamLead)?.github_link,
      },
      teamMembers: formattedMembers,
      memberCount: team.memberCount,
      teamStatus: team.teamStatus,
      isLooking: team.isLooking,
      appliedFor: problemStatement,
      videoURL: team.videoURL || null,
      submissionPDF: team.submissionPDF || null,
      anyOtherLink: team.anyOtherLink || null,
      isEvaluated: team.isEvaluated,
      evaluations: team.evaluations || [],
      votes: team.votes || [],
      assignedEvaluators: assignedEvaluators,
      isShortlisted: team.isShortlisted,
      memberRSVPs: team.memberRSVPs,
      createdAt: team.createdAt,
      submittedAt: team.submittedAt || null,
      evaluatedAt: team.evaluatedAt || null,
      shortlistedAt: team.shortlistedAt || null,
      rsvpCompletedAt: team.rsvpCompletedAt || null,
    });
  } catch (error: any) {
    console.error("Get team error:", error);
    return createErrorResponse("Failed to retrieve team", "SERVER_ERROR", 500);
  }
}

/**
 * PUT /api/admin/teams/:teamCode
 * Update team (shortlist, change status, etc.) (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { teamCode: string } }
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

    const body = await request.json();
    const { isShortlisted, teamStatus, comments, adminNotes } = body;

    await dbConnect();

    const team = await Team.findOne({ teamCode: params.teamCode });
    if (!team) {
      return createErrorResponse("Team not found", "NOT_FOUND", 404);
    }

    const updateData: Record<string, any> = {};

    if (isShortlisted !== undefined) {
      updateData.isShortlisted = Boolean(isShortlisted);
      if (isShortlisted && !team.shortlistedAt) {
        updateData.shortlistedAt = new Date();
      }
    }

    if (teamStatus !== undefined) {
      const validStatuses = ['pending', 'submitted', 'withdrawn', 'shortlisted', 'rsvped', 'rsvp_declined'];
      if (!validStatuses.includes(teamStatus)) {
        return createErrorResponse("Invalid team status", "INVALID_STATUS", 400);
      }
      updateData.teamStatus = teamStatus;
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { teamCode: params.teamCode },
      { $set: updateData },
      { new: true }
    );

    return createSuccessResponse("Team updated successfully", {
      teamCode: updatedTeam!.teamCode,
      teamName: updatedTeam!.teamName,
      teamStatus: updatedTeam!.teamStatus,
      isShortlisted: updatedTeam!.isShortlisted,
      updatedAt: updatedTeam!.updatedAt,
    });
  } catch (error: any) {
    console.error("Update team error:", error);
    return createErrorResponse("Failed to update team", "SERVER_ERROR", 500);
  }
}

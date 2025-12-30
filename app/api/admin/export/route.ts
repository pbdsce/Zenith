import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, requireAdmin, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import ProblemStatement from "@/models/ProblemStatement";

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
    const exportType = searchParams.get('type') || 'all';

    await dbConnect();

    const exportData: Record<string, any> = {
      exportedAt: new Date().toISOString(),
      exportType,
    };

    if (exportType === 'participants' || exportType === 'all') {
      const users = await User.find({ role: 'user' })
        .select('uid name email phone discord_username age organisation isLooking teamCode github_link linkedin_link createdAt');
      exportData.participants = users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        discord_username: u.discord_username,
        age: u.age,
        organisation: u.organisation,
        isLooking: u.isLooking,
        teamCode: u.teamCode,
        github_link: u.github_link,
        linkedin_link: u.linkedin_link,
        registeredAt: u.createdAt,
      }));
    }

    if (exportType === 'teams' || exportType === 'all') {
      const teams = await Team.find();
      const memberUids = teams.flatMap(t => t.teamMembers.map((m: any) => m.uid));
      const members = await User.find({ uid: { $in: memberUids } }).select('uid name email');
      
      exportData.teams = teams.map(team => ({
        teamCode: team.teamCode,
        teamName: team.teamName,
        teamLead: team.teamLead,
        memberCount: team.memberCount,
        members: team.teamMembers.map((m: any) => {
          const user = members.find(u => u.uid === m.uid);
          return { uid: m.uid, name: user?.name, email: user?.email, role: m.role };
        }),
        teamStatus: team.teamStatus,
        appliedFor: team.appliedFor,
        videoURL: team.videoURL,
        submissionPDF: team.submissionPDF,
        isEvaluated: team.isEvaluated,
        scores: team.scores,
        isShortlisted: team.isShortlisted,
        createdAt: team.createdAt,
        submittedAt: team.submittedAt,
      }));
    }

    if (exportType === 'shortlisted' || exportType === 'all') {
      const shortlisted = await Team.find({ isShortlisted: true })
        .sort({ 'scores.total': -1 });
      exportData.shortlistedTeams = shortlisted.map((team, rank) => ({
        rank: rank + 1,
        teamCode: team.teamCode,
        teamName: team.teamName,
        scores: team.scores,
        teamStatus: team.teamStatus,
        memberCount: team.memberCount,
      }));
    }

    if (exportType === 'rsvped' || exportType === 'all') {
      const rsvped = await Team.find({ teamStatus: 'rsvped' });
      exportData.rsvpedTeams = rsvped.map(team => ({
        teamCode: team.teamCode,
        teamName: team.teamName,
        memberCount: team.memberCount,
        rsvpCompletedAt: team.rsvpCompletedAt,
      }));
    }

    if (exportType === 'problemStatements' || exportType === 'all') {
      const ps = await ProblemStatement.find();
      exportData.problemStatements = ps.map(p => ({
        id: p._id.toString(),
        title: p.title,
        description: p.description,
        teamCount: p.teamCount,
        isActive: p.isActive,
      }));
    }

    return createSuccessResponse("Data exported successfully", exportData);
  } catch (error: any) {
    console.error("Export error:", error);
    return createErrorResponse("Failed to export data", "SERVER_ERROR", 500);
  }
}

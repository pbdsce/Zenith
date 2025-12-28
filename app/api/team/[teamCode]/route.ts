import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import ProblemStatement from "@/models/ProblemStatement";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamCode: string } }
) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error.message },
        { status: authResult.status }
      );
    }

    await dbConnect();

    const team = await Team.findOne({ teamCode: params.teamCode });
    if (!team) {
      return NextResponse.json(
        { message: "Team not found" },
        { status: 404 }
      );
    }

    const isMember = team.teamMembers.some(
      (member: any) => member.uid === authResult.user.uid
    );
    
    if (!isMember) {
      return NextResponse.json(
        { message: "Unauthorized: You are not a member of this team" },
        { status: 403 }
      );
    }

    const memberUids = team.teamMembers.map((m: any) => m.uid);
    const members = await User.find({ uid: { $in: memberUids } })
      .select('uid name email organisation profile_picture phone resume_link github_link linkedin_link');

    let problemStatement = null;
    if (team.appliedFor) {
      const ps = await ProblemStatement.findById(team.appliedFor);
      if (ps) {
        problemStatement = { id: ps._id.toString(), title: ps.title };
      }
    }

    const teamLead = members.find(u => u.uid === team.teamLead);

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

    const formattedRSVPs = team.memberRSVPs.map((rsvp: any) => ({
      uid: rsvp.uid,
      name: rsvp.name,
      rsvpStatus: rsvp.rsvpStatus,
      rsvpedAt: rsvp.rsvpedAt instanceof Date ? rsvp.rsvpedAt.toISOString() : rsvp.rsvpedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        teamCode: team.teamCode,
        teamName: team.teamName,
        teamLead: {
          id: teamLead?.uid || team.teamLead,
          name: teamLead?.name || 'Unknown',
          email: teamLead?.email || null,
          phone: teamLead?.phone || null,
          organisation: teamLead?.organisation || null,
          resume_link: teamLead?.resume_link || null,
          github_link: teamLead?.github_link || null,
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
        scores: team.scores || null,
        comments: team.comments || null,
        isShortlisted: team.isShortlisted,
        memberRSVPs: formattedRSVPs,
        createdAt: team.createdAt instanceof Date ? team.createdAt.toISOString() : team.createdAt,
        submittedAt: team.submittedAt instanceof Date ? team.submittedAt.toISOString() : team.submittedAt || null,
      },
    });
  } catch (error: any) {
    console.error("Get team error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}


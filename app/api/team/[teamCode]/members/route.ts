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

    const requestingUser = await User.findOne({ uid: authResult.user.uid });
    if (!requestingUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (!requestingUser.isLooking) {
      return NextResponse.json(
        { message: "You must be looking for a team to view team member details" },
        { status: 403 }
      );
    }

    const team = await Team.findOne({ teamCode: params.teamCode });
    if (!team) {
      return NextResponse.json(
        { message: "Team not found" },
        { status: 404 }
      );
    }

    if (!team.isLooking) {
      return NextResponse.json(
        { message: "This team is not currently looking for members" },
        { status: 403 }
      );
    }

    const memberUids = team.teamMembers.map((m: any) => m.uid);
    const members = await User.find({ uid: { $in: memberUids } })
      .select('uid name email organisation profile_picture discord_username resume_link github_link linkedin_link leetcode_profile codeforces_link kaggle_link portfolio_link bio age');

    let problemStatement = null;
    if (team.appliedFor) {
      const ps = await ProblemStatement.findById(team.appliedFor);
      if (ps) {
        problemStatement = {
          id: ps._id.toString(),
          title: ps.title,
          description: ps.description || null,
        };
      }
    }

    const formattedMembers = team.teamMembers.map((member: any) => {
      const userInfo = members.find(u => u.uid === member.uid);
      return {
        uid: member.uid,
        name: userInfo?.name || 'Unknown',
        email: userInfo?.email || null,
        organisation: userInfo?.organisation || null,
        profile_picture: userInfo?.profile_picture || null,
        discord_username: userInfo?.discord_username || null,
        resume_link: userInfo?.resume_link || null,
        github_link: userInfo?.github_link || null,
        linkedin_link: userInfo?.linkedin_link || null,
        leetcode_profile: userInfo?.leetcode_profile || null,
        codeforces_link: userInfo?.codeforces_link || null,
        kaggle_link: userInfo?.kaggle_link || null,
        portfolio_link: userInfo?.portfolio_link || null,
        bio: userInfo?.bio || null,
        age: userInfo?.age || null,
        role: member.role,
        joinedAt: member.joinedAt instanceof Date ? member.joinedAt.toISOString() : member.joinedAt,
      };
    });

    const teamLead = members.find(u => u.uid === team.teamLead);

    return NextResponse.json({
      success: true,
      data: {
        teamCode: team.teamCode,
        teamName: team.teamName,
        teamLead: {
          uid: teamLead?.uid || team.teamLead,
          name: teamLead?.name || 'Unknown',
          email: teamLead?.email || null,
          organisation: teamLead?.organisation || null,
          profile_picture: teamLead?.profile_picture || null,
          github_link: teamLead?.github_link || null,
          linkedin_link: teamLead?.linkedin_link || null,
          resume_link: teamLead?.resume_link || null,
        },
        teamMembers: formattedMembers,
        memberCount: team.memberCount,
        appliedFor: problemStatement,
        createdAt: team.createdAt instanceof Date ? team.createdAt.toISOString() : team.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Get team members error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";

export const dynamic = 'force-dynamic';

/**
 * PUT /api/user/rsvp
 * Individual RSVP for selected team member
 */
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
    const { rsvpStatus } = body;

    // Validate rsvpStatus
    if (!rsvpStatus || !['confirmed', 'declined'].includes(rsvpStatus)) {
      return NextResponse.json(
        {
          message: "Invalid RSVP status",
          error: {
            code: 'INVALID_RSVP_STATUS',
            message: "rsvpStatus must be 'confirmed' or 'declined'"
          }
        },
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

    if (!user.teamCode) {
      return NextResponse.json(
        {
          message: "User not part of any team",
          error: {
            code: 'USER_NOT_IN_TEAM',
            message: 'User not part of any team'
          }
        },
        { status: 400 }
      );
    }

    const team = await Team.findOne({ teamCode: user.teamCode });
    if (!team) {
      return NextResponse.json(
        { message: "Team not found" },
        { status: 404 }
      );
    }

    // Check if team is shortlisted
    if (!team.isShortlisted) {
      return NextResponse.json(
        {
          message: "Team not shortlisted",
          error: {
            code: 'TEAM_NOT_SHORTLISTED',
            message: 'Team must be shortlisted before RSVP'
          }
        },
        { status: 400 }
      );
    }

    // Check if user already RSVPed
    const existingRSVP = team.memberRSVPs.find((r: any) => r.uid === authResult.user.uid);
    if (existingRSVP) {
      return NextResponse.json(
        {
          message: "Already submitted RSVP",
          error: {
            code: 'ALREADY_RSVPED',
            message: 'You have already submitted your RSVP'
          }
        },
        { status: 409 }
      );
    }

    // Add user's RSVP
    team.memberRSVPs.push({
      uid: authResult.user.uid,
      name: user.name,
      rsvpStatus,
      rsvpedAt: new Date(),
    });

    // Check if all members have RSVPed
    const allRSVPed = team.teamMembers.every((member: any) =>
      team.memberRSVPs.some((rsvp: any) => rsvp.uid === member.uid)
    );

    // Check if all RSVPs are confirmed
    const allConfirmed = allRSVPed && team.memberRSVPs.every(
      (rsvp: any) => rsvp.rsvpStatus === 'confirmed'
    );

    // Check if any member declined
    const anyDeclined = team.memberRSVPs.some(
      (rsvp: any) => rsvp.rsvpStatus === 'declined'
    );

    // Update team status
    if (allConfirmed) {
      team.teamStatus = 'rsvped';
      team.rsvpCompletedAt = new Date();
    } else if (anyDeclined) {
      team.teamStatus = 'rsvp_declined';
    }

    await team.save();

    // Format memberRSVPs for response
    const formattedRSVPs = team.memberRSVPs.map((rsvp: any) => ({
      uid: rsvp.uid,
      name: rsvp.name,
      rsvpStatus: rsvp.rsvpStatus,
      rsvpedAt: rsvp.rsvpedAt instanceof Date ? rsvp.rsvpedAt.toISOString() : rsvp.rsvpedAt,
    }));

    const rsvpDate = new Date();
    return NextResponse.json({
      success: true,
      message: allConfirmed ? "RSVP submitted successfully. Your team is now fully confirmed!" : "RSVP submitted successfully",
      data: {
        userRSVP: {
          uid: authResult.user.uid,
          name: user.name,
          rsvpStatus,
          rsvpedAt: rsvpDate.toISOString(),
        },
        teamStatus: {
          teamCode: team.teamCode,
          teamName: team.teamName,
          totalMembers: team.memberCount,
          rsvpedMembers: team.memberRSVPs.length,
          pendingRSVPs: team.memberCount - team.memberRSVPs.length,
          allRSVPed,
          teamStatus: team.teamStatus,
          ...(team.rsvpCompletedAt && { rsvpCompletedAt: team.rsvpCompletedAt instanceof Date ? team.rsvpCompletedAt.toISOString() : team.rsvpCompletedAt }),
          memberRSVPs: formattedRSVPs,
        },
      },
    });
  } catch (error: any) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/rsvp
 * Alias for /api/user/rsvp-status
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error.message },
        { status: authResult.status }
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

    if (!user.teamCode) {
      return NextResponse.json({
        success: true,
        message: "RSVP status retrieved",
        data: {
          hasRSVPed: false,
          userRSVP: null,
          team: null,
        },
      });
    }

    const team = await Team.findOne({ teamCode: user.teamCode });
    if (!team) {
      return NextResponse.json({
        success: true,
        message: "RSVP status retrieved",
        data: {
          hasRSVPed: false,
          userRSVP: null,
          team: null,
        },
      });
    }

    const userRSVP = team.memberRSVPs.find((r: any) => r.uid === authResult.user.uid);
    
    // Get member names for RSVP display
    const memberUids = team.teamMembers.map((m: any) => m.uid);
    const members = await User.find({ uid: { $in: memberUids } }).select('uid name');

    const memberRSVPs = team.teamMembers.map((member: any) => {
      const memberInfo = members.find(m => m.uid === member.uid);
      const rsvp = team.memberRSVPs.find((r: any) => r.uid === member.uid);
      return {
        name: memberInfo?.name || 'Unknown',
        rsvpStatus: rsvp?.rsvpStatus || null,
        rsvpedAt: rsvp?.rsvpedAt || null,
      };
    });

    return NextResponse.json({
      success: true,
      message: "RSVP status retrieved",
      data: {
        hasRSVPed: !!userRSVP,
        userRSVP: userRSVP ? {
          rsvpStatus: userRSVP.rsvpStatus,
          rsvpedAt: userRSVP.rsvpedAt,
        } : null,
        team: {
          teamCode: team.teamCode,
          teamName: team.teamName,
          isShortlisted: team.isShortlisted,
          teamStatus: team.teamStatus,
          totalMembers: team.memberCount,
          rsvpedMembers: team.memberRSVPs.length,
          pendingRSVPs: team.memberCount - team.memberRSVPs.length,
          allRSVPed: team.memberCount === team.memberRSVPs.length,
          memberRSVPs,
        },
      },
    });
  } catch (error: any) {
    console.error("Get RSVP status error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

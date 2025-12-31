import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
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

        const emailError = requireEmailVerified(authResult);
        if (emailError) {
            return createAuthErrorResponse(emailError);
        }

        const { newLeadId, teamCode } = await request.json();

        if (!newLeadId || !teamCode) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find the team
        const team = await Team.findOne({ teamCode });

        if (!team) {
            return NextResponse.json(
                { message: "Team not found" },
                { status: 404 }
            );
        }

        // Check if requester is the current team lead
        if (team.teamLead !== authResult.user.uid) {
            return NextResponse.json(
                { message: "Only the team lead can transfer ownership" },
                { status: 403 }
            );
        }

        // Check if new lead is a member of the team
        const isMember = team.teamMembers.some((member: any) => member.uid === newLeadId);
        if (!isMember) {
            return NextResponse.json(
                { message: "New lead must be a member of the team" },
                { status: 400 }
            );
        }

        // Update roles
        const updatedMembers = team.teamMembers.map((member: any) => {
            if (member.uid === newLeadId) {
                return { ...member, role: 'Team Lead' };
            }
            if (member.uid === authResult.user.uid) {
                return { ...member, role: 'Member' };
            }
            return member;
        });

        team.teamMembers = updatedMembers;
        team.teamLead = newLeadId;

        await team.save();

        return NextResponse.json({
            success: true,
            message: "Team ownership transferred successfully",
            data: {
                newLeadId,
                teamCode
            }
        });

    } catch (error: any) {
        console.error("Transfer ownership error:", error);
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}

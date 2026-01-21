import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import ShortlistedTeam from "@/models/ShortlistedTeam";

export const dynamic = 'force-dynamic';

function createSuccessResponse(data: any) {
    return NextResponse.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
    });
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

        // Allow 'frai' and 'admin' roles only (same as analytics)
        const userRole = authResult.user.role;
        if (userRole !== 'frai' && userRole !== 'admin') {
            return createErrorResponse("Access denied", "FORBIDDEN", 403);
        }

        await dbConnect();

        // Fetch all shortlisted teams, sorted by creation date (newest first)
        const teams = await ShortlistedTeam.find({})
            .sort({ createdAt: -1 })
            .lean();

        // Get total count
        const totalTeams = teams.length;

        // Calculate total participants
        const totalParticipants = teams.reduce((sum, team) => sum + (team.memberCount || 1), 0);

        // Get distribution by appliedFor (problem statement)
        const psDistribution = teams.reduce((acc: Record<string, number>, team) => {
            const ps = team.appliedFor || 'Unknown';
            acc[ps] = (acc[ps] || 0) + 1;
            return acc;
        }, {});

        return createSuccessResponse({
            teams,
            stats: {
                totalTeams,
                totalParticipants,
                psDistribution,
            }
        });

    } catch (error: any) {
        console.error("Shortlisted teams fetch error:", error);
        return createErrorResponse("Failed to retrieve shortlisted teams", "SERVER_ERROR", 500);
    }
}

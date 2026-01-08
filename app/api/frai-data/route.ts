import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";

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

        // Allow 'frai' and 'admin' roles
        const userRole = authResult.user.role;
        if (userRole !== 'frai' && userRole !== 'admin') {
            return createErrorResponse("Access denied", "FORBIDDEN", 403);
        }

        await dbConnect();

        // Fetch real stats
        const [totalUsers, totalTeams, totalSubmissions, totalEvaluated] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Team.countDocuments({}), // Total teams
            Team.countDocuments({ teamStatus: { $in: ['submitted', 'under-review', 'shortlisted', 'accepted', 'rejected'] } }), // Approximate for 'submitted'
            Team.countDocuments({ teamStatus: { $in: ['shortlisted', 'accepted', 'rejected'] } }), // Approximate for 'evaluated'
        ]);

        const boost = (value: number) => Math.ceil(value * 1.4);

        const inflatedStats = {
            totalUsers: boost(totalUsers),
            totalTeams: boost(totalTeams),
            totalSubmissions: boost(totalSubmissions),
            totalEvaluated: boost(totalEvaluated),
        };

        return createSuccessResponse(inflatedStats);

    } catch (error: any) {
        console.error("Frai data fetch error:", error);
        return createErrorResponse("Failed to retrieve data", "SERVER_ERROR", 500);
    }
}

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import Analytics from "@/models/Analytics";

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
        const [totalUsers, totalTeams, submittedCount, evaluatedCount, shortlistedCount] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Team.countDocuments({}),
            Team.countDocuments({ teamStatus: { $in: ['submitted', 'under-review'] } }),
            Team.countDocuments({ teamStatus: { $in: ['shortlisted', 'accepted', 'rejected'] } }),
            Team.countDocuments({ teamStatus: { $in: ['shortlisted', 'accepted'] } })
        ]);

        const adjust = (value: number) => Math.ceil(value * 1.4);

        const realRegistered = Math.max(0, totalTeams - (submittedCount + evaluatedCount));

        const adjustedRegistered = adjust(realRegistered);
        const adjustedSubmitted = adjust(submittedCount);
        const adjustedEvaluated = adjust(evaluatedCount);
        const adjustedShortlisted = adjust(shortlistedCount);

        // Ensure total equals the sum of mutually exclusive parts (Reg + Sub + Eval)
        const adjustedTotalTeams = adjustedRegistered + adjustedSubmitted + adjustedEvaluated;

        const currentStats = {
            totalUsers: adjust(totalUsers),
            totalTeams: adjustedTotalTeams,
            totalSubmissions: adjustedSubmitted + adjustedEvaluated, // Total generic submissions
            totalEvaluated: adjustedEvaluated,
        };

        const teamDistribution = [
            { name: 'Registered', value: adjustedRegistered },
            { name: 'Submitted', value: adjustedSubmitted },
            { name: 'Evaluated', value: Math.max(0, adjustedEvaluated - adjustedShortlisted) },
            { name: 'Shortlisted', value: adjustedShortlisted },
        ];

        // Fetch history (last 30 days)
        const historyDocs = await Analytics.find({}).sort({ date: 1 }).limit(30);
        const history = historyDocs.map((doc: any) => ({
            date: doc.date,
            totalUsers: doc.totalUsers,
        }));

        // Calculate Submission Activity
        const submissions = await Team.find({
            submittedAt: { $exists: true, $ne: null }
        }).select('submittedAt');

        const activityMap = new Map<string, number>();
        // Initialize standard hours 10:00 - 18:00
        for (let i = 10; i <= 18; i++) {
            activityMap.set(`${i}:00`, 0);
        }

        submissions.forEach(team => {
            if (team.submittedAt) {
                const hour = new Date(team.submittedAt).getHours();
                // Map to closest bucket or just raw hour if within range
                if (hour >= 10 && hour <= 18) {
                    const key = `${hour}:00`;
                    activityMap.set(key, (activityMap.get(key) || 0) + 1);
                }
            }
        });

        const submissionActivity = Array.from(activityMap.entries()).map(([time, count]) => ({
            time,
            submissions: adjust(count)
        })).sort((a, b) => parseInt(a.time) - parseInt(b.time));

        return createSuccessResponse({ ...currentStats, history, teamDistribution, submissionActivity });

    } catch (error: any) {
        console.error("Analytics data fetch error:", error);
        return createErrorResponse("Failed to retrieve data", "SERVER_ERROR", 500);
    }
}

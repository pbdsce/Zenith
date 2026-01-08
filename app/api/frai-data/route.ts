import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import FraiData from "@/models/FraiData";

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

        const boost = (value: number) => Math.ceil(value * 1.4);

        const boostedTotalTeams = boost(totalTeams);
        const boostedSubmitted = boost(submittedCount);
        const boostedEvaluated = boost(evaluatedCount);
        const boostedShortlisted = boost(shortlistedCount);
        const boostedRegistered = Math.max(0, boostedTotalTeams - (boostedSubmitted + boostedEvaluated)); // Remainder

        const currentStats = {
            totalUsers: boost(totalUsers),
            totalTeams: boostedTotalTeams,
            totalSubmissions: boostedSubmitted + boostedEvaluated, // Total generic submissions
            totalEvaluated: boostedEvaluated,
        };

        const teamDistribution = [
            { name: 'Registered', value: boostedRegistered },
            { name: 'Submitted', value: boostedSubmitted },
            { name: 'Evaluated', value: boostedEvaluated },
            { name: 'Shortlisted', value: boostedShortlisted },
        ];

        // Fetch history (last 30 days)
        const historyDocs = await FraiData.find({}).sort({ date: 1 }).limit(30);
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
            submissions: boost(count)
        })).sort((a, b) => parseInt(a.time) - parseInt(b.time));

        return createSuccessResponse({ ...currentStats, history, teamDistribution, submissionActivity });

    } catch (error: any) {
        console.error("Frai data fetch error:", error);
        return createErrorResponse("Failed to retrieve data", "SERVER_ERROR", 500);
    }
}

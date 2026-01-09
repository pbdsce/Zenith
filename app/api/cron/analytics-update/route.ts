import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import Analytics from "@/models/Analytics";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await dbConnect();

        // Fetch real stats
        const [totalUsers, totalTeams, totalSubmissions, totalEvaluated] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Team.countDocuments({}),
            Team.countDocuments({ teamStatus: { $in: ['submitted', 'under-review', 'shortlisted', 'accepted', 'rejected'] } }),
            Team.countDocuments({ teamStatus: { $in: ['shortlisted', 'accepted', 'rejected'] } }),
        ]);

        const adjust = (value: number) => Math.ceil(value * 1.4);

        const realRegistered = Math.max(0, totalTeams - (totalSubmissions + totalEvaluated));

        const adjustedRegistered = adjust(realRegistered);
        const adjustedSubmitted = adjust(totalSubmissions);
        const adjustedEvaluated = adjust(totalEvaluated);

        // Ensure consistency
        const adjustedTotalTeams = adjustedRegistered + adjustedSubmitted + adjustedEvaluated;

        const adjustedStats = {
            totalUsers: adjust(totalUsers),
            totalTeams: adjustedTotalTeams,
            // In Cron, totalSubmissions includes evaluations (from DB query logic). 
            totalSubmissions: adjust(totalSubmissions),
            totalEvaluated: adjustedEvaluated,
            date: new Date(),
        };

        // Store in DB
        await Analytics.create(adjustedStats);

        return NextResponse.json({ success: true, data: adjustedStats });

    } catch (error: any) {
        console.error("Cron job error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

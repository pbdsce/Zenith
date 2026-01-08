import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import FraiData from "@/models/FraiData";

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

        const boost = (value: number) => Math.ceil(value * 1.4);

        const inflatedStats = {
            totalUsers: boost(totalUsers),
            totalTeams: boost(totalTeams),
            totalSubmissions: boost(totalSubmissions),
            totalEvaluated: boost(totalEvaluated),
            date: new Date(),
        };

        // Store in DB
        await FraiData.create(inflatedStats);

        return NextResponse.json({ success: true, data: inflatedStats });

    } catch (error: any) {
        console.error("Cron job error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";
import TeamJoinRequest from "@/models/TeamJoinRequest";
import ProblemStatement from "@/models/ProblemStatement";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {

       const authHeader = request.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const token = authHeader.split(" ")[1];

        if (token !== process.env.METRICS_API_TOKEN) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 403 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const mode = searchParams.get("mode") || "current";

        const MAX_TEAM_SIZE = 4;

        const [users, teams, pendingJoinRequests, problems] =
            await Promise.all([
                User.find({}, { uid: 1, teamCode: 1, isLooking: 1 }).lean(),
                Team.find(
                    {},
                    {
                        teamCode: 1,
                        teamName: 1,
                        memberCount: 1,
                        teamMembers: 1,
                        isLooking: 1,
                        isEvaluated: 1,
                        isShortlisted: 1,
                    }
                ).lean(),
                TeamJoinRequest.countDocuments({ status: "pending" }),
                ProblemStatement.find(
                    {},
                    { title: 1, teamCount: 1, isActive: 1 }
                ).lean(),
            ]);

        /* -------------------- TEAM METRICS -------------------- */

        let emptyTeams = 0;
        let fullTeams = 0;
        let totalMembersInTeams = 0;

        const teamsWithMembers: any[] = [];

        const teamStats = teams.map((team: any) => {
            const membersFromArray = Array.isArray(team.teamMembers)
                ? team.teamMembers.length
                : 0;

            const memberCount =
                typeof team.memberCount === "number"
                    ? team.memberCount
                    : membersFromArray;

            totalMembersInTeams += memberCount;

            if (memberCount === 0) emptyTeams++;
            if (memberCount >= MAX_TEAM_SIZE) fullTeams++;
            if (memberCount > 0) teamsWithMembers.push(team);

            return {
                teamCode: team.teamCode,
                name: team.teamName || team.teamCode,
                members: memberCount,
                isFull: memberCount >= MAX_TEAM_SIZE,
                isEmpty: memberCount === 0,
                isLooking: team.isLooking ?? false,
            };
        });

        const totalTeams = teams.length;
        const formedTeams = teamsWithMembers.length;

        const averageTeamSize =
            formedTeams > 0
                ? Number((totalMembersInTeams / formedTeams).toFixed(2))
                : 0;

        const teamFillRate =
            totalTeams > 0
                ? Number(
                    (
                        (totalMembersInTeams /
                            (totalTeams * MAX_TEAM_SIZE)) *
                        100
                    ).toFixed(2)
                )
                : 0;

        const formationRate =
            totalTeams > 0
                ? Number(((formedTeams / totalTeams) * 100).toFixed(2))
                : 0;

        /* -------------------- USER METRICS -------------------- */

        const totalUsers = users.length;

        const usersInTeamsSet = new Set<string>();
        users.forEach((user: any) => {
            if (user.uid && user.teamCode) {
                usersInTeamsSet.add(user.uid);
            }
        });

        const usersInTeams = usersInTeamsSet.size;

        const usersWithoutTeam = users.filter(
            (u: any) => !u.teamCode
        ).length;

        const usersLookingForTeam = users.filter(
            (u: any) => u.isLooking === true
        ).length;

        /* -------------------- PROBLEM METRICS -------------------- */

        const activeProblems = problems.filter(
            (p: any) => p.isActive
        );

        const totalProblemTeams = activeProblems.reduce(
            (sum: number, p: any) => sum + (p.teamCount || 0),
            0
        );

        const problemStats = activeProblems.map((p: any) => ({
            title: p.title,
            teamCount: p.teamCount || 0,
        }));

        /* -------------------- MODE: PARTICIPANT DISTRIBUTION -------------------- */

        if (mode === "participant-distribution") {
            return NextResponse.json(
                [
                    { category: "In Teams", value: usersInTeams },
                    { category: "Looking for Team", value: usersLookingForTeam },
                ],
                { status: 200 }
            );
        }

        /* -------------------- EVALUATION METRICS -------------------- */

        const evaluatedTeams = teams.filter(
            (t: any) => t.isEvaluated === true
        ).length;

        const shortlistedTeams = teams.filter(
            (t: any) => t.isShortlisted === true
        ).length;

        const evaluatedRate =
            totalTeams > 0
                ? Number(((evaluatedTeams / totalTeams) * 100).toFixed(2))
                : 0;

        const shortlistedRate =
            totalTeams > 0
                ? Number(((shortlistedTeams / totalTeams) * 100).toFixed(2))
                : 0;


        /* -------------------- FINAL RESPONSE -------------------- */

        return NextResponse.json(
            {
                users: {
                    total: totalUsers,
                    inTeams: usersInTeams,
                    withoutTeam: usersWithoutTeam,
                    lookingForTeam: usersLookingForTeam,
                },
                teams: {
                    total: totalTeams,
                    empty: emptyTeams,
                    full: fullTeams,
                    averageSize: averageTeamSize,
                    fillRate: teamFillRate,
                    formationRate,
                    evaluated: evaluatedTeams,
                    shortlisted: shortlistedTeams,
                    evaluatedRate,
                    shortlistedRate,
                    list: teamStats,
                },
                requests: {
                    pending: pendingJoinRequests,
                },
                problems: {
                    total: problems.length,
                    active: activeProblems.length,
                    teamsAssigned: totalProblemTeams,
                    list: problemStats,
                },
                backend: {
                    up: 1,
                },
                meta: {
                    maxTeamSize: MAX_TEAM_SIZE,
                    generatedAt: new Date().toISOString(),
                    cached: true,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Metrics API error:", error);
        return NextResponse.json(
            {
                backend: { up: 0 },
                error: "Failed to fetch metrics",
                message: error.message,
            },
            { status: 500 }
        );
    }
}

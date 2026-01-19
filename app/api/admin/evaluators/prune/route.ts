import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, requireAdmin, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import Team from "@/models/Team";
import Evaluator from "@/models/Evaluator";

export const dynamic = 'force-dynamic';

function createSuccessResponse(message: string, data: any, status = 200) {
    return NextResponse.json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    }, { status });
}

function createErrorResponse(message: string, code: string, status: number) {
    return NextResponse.json({
        success: false,
        message,
        error: { code, message },
        timestamp: new Date().toISOString(),
    }, { status });
}

export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateUser(request);
        if (!authResult.success) {
            return createAuthErrorResponse(authResult);
        }

        const adminCheck = requireAdmin(authResult);
        if (adminCheck) {
            return createAuthErrorResponse(adminCheck);
        }

        await dbConnect();

        // Get all evaluators
        const evaluators = await Evaluator.find({});

        // Collect all assigned team codes
        const allAssignedCodes = new Set<string>();
        evaluators.forEach(ev => {
            ev.assignedTeams.forEach((t: any) => allAssignedCodes.add(t.teamCode));
        });

        if (allAssignedCodes.size === 0) {
            return createSuccessResponse("No assignments to prune", { prunedCount: 0 });
        }

        // Find which of these are NOT submitted
        const submittedTeams = await Team.find({
            teamCode: { $in: Array.from(allAssignedCodes) },
            submittedAt: { $exists: true, $ne: null }
        }).select('teamCode');

        const submittedTeamCodes = new Set(submittedTeams.map(t => t.teamCode));

        // Identify invalid assignments
        let prunedCount = 0;
        const updates = [];

        for (const evaluator of evaluators) {
            const originalCount = evaluator.assignedTeams.length;
            // Keep assignment if:
            // The team has submitted (is in submittedTeamCodes)
            // OR
            // The team has already been evaluated (preserve history even if submission status is weird)
            const validAssignments = evaluator.assignedTeams.filter((t: any) =>
                submittedTeamCodes.has(t.teamCode) || t.isEvaluated === true
            );

            if (validAssignments.length !== originalCount) {
                evaluator.assignedTeams = validAssignments;
                prunedCount += (originalCount - validAssignments.length);
                updates.push(evaluator.save());
            }
        }

        await Promise.all(updates);

        return createSuccessResponse("Pruned invalid assignments successfully", {
            prunedCount,
            evaluatorsUpdated: updates.length
        });

    } catch (error: any) {
        console.error("Prune assignments error:", error);
        return createErrorResponse("Failed to prune assignments", "SERVER_ERROR", 500);
    }
}

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, requireEvaluator, createAuthErrorResponse } from "@/lib/middleware/auth";
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

/**
 * POST /api/evaluator/vote
 * Submit a vote (up/down) and optional comment for a team
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateUser(request);
        if (!authResult.success) {
            return createAuthErrorResponse(authResult);
        }

        const evaluatorCheck = requireEvaluator(authResult);
        if (evaluatorCheck) {
            return createAuthErrorResponse(evaluatorCheck);
        }

        const body = await request.json();
        const { teamCode, vote, comment } = body;

        // Validation
        if (!teamCode) {
            return createErrorResponse("Team code is required", "VALIDATION_ERROR", 400);
        }

        if (!vote || !["up", "down"].includes(vote)) {
            return createErrorResponse("Invalid vote. Must be 'up' or 'down'", "VALIDATION_ERROR", 400);
        }

        await dbConnect();

        // Verify evaluator is NOT assigned to this team
        const evaluator = await Evaluator.findOne({ uid: authResult.user.uid });
        if (!evaluator) {
            return createErrorResponse("Evaluator not found", "NOT_FOUND", 404);
        }

        const assignmentIndex = evaluator.assignedTeams.findIndex(
            (t: any) => t.teamCode === teamCode
        );
        if (assignmentIndex !== -1) {
            return createErrorResponse("You cannot vote on your assigned team. Please use the evaluation form.", "ASSIGNED_TEAM", 403);
        }

        const team = await Team.findOne({ teamCode });
        if (!team) {
            return createErrorResponse("Team not found", "NOT_FOUND", 404);
        }

        // Check if THIS evaluator has already voted
        const existingVote = team.votes.find((v: any) => v.evaluatorId === authResult.user.uid);

        // Scenario 1: Toggle OFF (Same vote type)
        if (existingVote && existingVote.vote === vote) {
            await Team.findOneAndUpdate(
                { teamCode },
                {
                    $pull: { votes: { evaluatorId: authResult.user.uid } }
                }
            );
            return createSuccessResponse("Vote removed", {
                teamCode,
                vote: null // specific signal that vote was removed
            });
        }

        // Scenario 2 & 3: Switch Vote OR New Vote
        // First remove any existing vote by this evaluator
        await Team.findOneAndUpdate(
            { teamCode },
            {
                $pull: { votes: { evaluatorId: authResult.user.uid } }
            }
        );

        const newVote = {
            evaluatorId: authResult.user.uid,
            vote,
            comment: comment || '',
            createdAt: new Date()
        };

        await Team.findOneAndUpdate(
            { teamCode },
            {
                $push: { votes: newVote }
            },
            { new: true }
        );

        return createSuccessResponse("Vote submitted successfully", {
            teamCode,
            vote: newVote
        });
    } catch (error: any) {
        console.error("Submit vote error:", error);
        return createErrorResponse("Failed to submit vote", "SERVER_ERROR", 500);
    }
}

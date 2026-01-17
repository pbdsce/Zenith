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
 * PUT /api/evaluator/evaluate
 * Submit evaluation scores for a team
 */
export async function PUT(request: NextRequest) {
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
    const { teamCode, tier, comment } = body;

    // Validation
    if (!teamCode) {
      return createErrorResponse("Team code is required", "VALIDATION_ERROR", 400);
    }

    const validTiers = ["strongly_accepted", "accepted", "borderline", "rejected"];
    if (!tier || !validTiers.includes(tier)) {
      return createErrorResponse("Invalid tier selected", "VALIDATION_ERROR", 400);
    }

    await dbConnect();

    // Verify evaluator is assigned to this team
    const evaluator = await Evaluator.findOne({ uid: authResult.user.uid });
    if (!evaluator) {
      return createErrorResponse("Evaluator not found", "NOT_FOUND", 404);
    }

    const assignmentIndex = evaluator.assignedTeams.findIndex(
      (t: any) => t.teamCode === teamCode
    );
    if (assignmentIndex === -1) {
      return createErrorResponse("You are not assigned to this team", "NOT_ASSIGNED", 403);
    }

    const team = await Team.findOne({ teamCode });
    if (!team) {
      return createErrorResponse("Team not found", "NOT_FOUND", 404);
    }

    // Update Team: Remove existing evaluation from this evaluator if any, and push new one
    await Team.findOneAndUpdate(
      { teamCode },
      {
        $pull: { evaluations: { evaluatorId: authResult.user.uid } }
      }
    );

    const newEvaluation = {
      evaluatorId: authResult.user.uid,
      name: authResult.user.name || evaluator.name, // Fallback to evaluator name
      tier,
      comment: comment || '',
      createdAt: new Date()
    };

    const updatedTeam = await Team.findOneAndUpdate(
      { teamCode },
      {
        $push: { evaluations: newEvaluation },
        $set: {
          isEvaluated: true, // Mark global evaluated flag (optional, or based on some logic)
          evaluatedAt: new Date()
        }
      },
      { new: true }
    );

    // Update evaluator assignment status
    evaluator.assignedTeams[assignmentIndex].isEvaluated = true;
    evaluator.lastEvaluationAt = new Date();

    // Update stats
    if (evaluator.stats) {
      // Re-calculate stats
      evaluator.evaluatedCount = evaluator.assignedTeams.filter((t: any) => t.isEvaluated).length;
      evaluator.stats.evaluationsCompleted = evaluator.evaluatedCount;
      evaluator.stats.evaluationsPending = evaluator.assignedCount - evaluator.evaluatedCount;
    }

    await evaluator.save();

    return createSuccessResponse("Evaluation submitted successfully", {
      teamCode,
      evaluation: newEvaluation,
      evaluatorStats: {
        evaluated: evaluator.evaluatedCount,
        pending: evaluator.assignedCount - evaluator.evaluatedCount,
      },
    });
  } catch (error: any) {
    console.error("Submit evaluation error:", error);
    return createErrorResponse("Failed to submit evaluation", "SERVER_ERROR", 500);
  }
}

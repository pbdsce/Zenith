import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import Evaluator from "@/models/Evaluator";
import User from "@/models/User";

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
 * POST /api/evaluator/register
 * Register a new evaluator
 * This endpoint should be called AFTER Firebase Auth registration on the client
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateUser(request);
        if (!authResult.success) {
            return createAuthErrorResponse(authResult);
        }

        // We expect the user to have been created in Firebase.
        const uid = authResult.user.uid;
        const email = authResult.user.email;
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return createErrorResponse("Name is required", "VALIDATION_ERROR", 400);
        }

        await dbConnect();

        // Check if already exists
        const existingEvaluator = await Evaluator.findOne({ uid });
        if (existingEvaluator) {
            return createErrorResponse("Evaluator profile already exists", "DUPLICATE", 409);
        }

        // Check if user exists (User collection)
        const existingUser = await User.findOne({ uid });
        if (existingUser) {
            // Update role if exists
            existingUser.role = "evaluator";
            await existingUser.save();
        } else {
            // Create User if not exists (though AuthProvider might have done it?)
            await User.create({
                uid,
                email,
                name,
                role: "evaluator"
            });
        }

        // Create Evaluator Profile
        const newEvaluator = await Evaluator.create({
            uid,
            email,
            name,
            role: "evaluator",
            assignedTeams: [],
            stats: {
                evaluationsCompleted: 0,
                evaluationsPending: 0
            }
        });

        return createSuccessResponse("Evaluator registered successfully", {
            evaluator: newEvaluator
        });

    } catch (error: any) {
        console.error("Evaluator registration error:", error);
        return createErrorResponse("Failed to register evaluator", "SERVER_ERROR", 500);
    }
}

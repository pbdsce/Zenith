import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, requireAdmin, createAuthErrorResponse } from "@/lib/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
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

export async function PUT(request: NextRequest) {
    try {
        const authResult = await authenticateUser(request);
        if (!authResult.success) {
            return createAuthErrorResponse(authResult);
        }

        const adminCheck = requireAdmin(authResult);
        if (adminCheck) {
            return createAuthErrorResponse(adminCheck);
        }

        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return createErrorResponse("User UID is required", "VALIDATION_ERROR", 400);
        }

        await dbConnect();

        // Check if user exists
        const user = await User.findOne({ uid: userId });
        if (!user) {
            return createErrorResponse("User not found", "USER_NOT_FOUND", 404);
        }

        // Check if already an evaluator
        if (user.role === 'evaluator') {
            // Ensure Evaluator record exists
            const existingEvaluator = await Evaluator.findOne({ uid: userId });
            if (!existingEvaluator) {
                await Evaluator.create({
                    uid: user.uid,
                    email: user.email,
                    name: user.name,
                    assignedTeams: [],
                });
            }
            return createSuccessResponse("User is already an evaluator", {
                uid: user.uid,
                role: user.role
            });
        }

        // Update user role
        user.role = 'evaluator';
        await user.save();

        // Create Evaluator record
        const evaluator = await Evaluator.findOneAndUpdate(
            { uid: userId },
            {
                uid: user.uid,
                email: user.email,
                name: user.name,
                $setOnInsert: { assignedTeams: [] }
            },
            { upsert: true, new: true }
        );

        return createSuccessResponse("User promoted to evaluator successfully", {
            uid: user.uid,
            name: user.name,
            role: user.role,
            evaluatorId: evaluator._id
        });

    } catch (error: any) {
        console.error("Promote user error:", error);
        return createErrorResponse("Failed to promote user", "SERVER_ERROR", 500);
    }
}

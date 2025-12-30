import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ProblemStatement from "@/models/ProblemStatement";

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
 * GET /api/problem-statements
 * Get all active problem statements (public endpoint)
 */
export async function GET() {
  try {
    await dbConnect();

    const problemStatements = await ProblemStatement.find({ isActive: true })
      .select('title description isActive createdAt')
      .sort({ createdAt: -1 });

    const formatted = problemStatements.map(ps => ({
      id: ps._id.toString(),
      title: ps.title,
      description: ps.description,
      isActive: ps.isActive,
    }));

    return createSuccessResponse("Problem statements retrieved successfully", {
      problemStatements: formatted,
      total: formatted.length,
    });
  } catch (error: any) {
    console.error("Get problem statements error:", error);
    return createErrorResponse("Failed to retrieve problem statements", "SERVER_ERROR", 500);
  }
}

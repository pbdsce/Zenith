import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { authenticateUser, createAuthErrorResponse, requireAdmin } from "@/lib/middleware/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateUser(req);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult);
    }

    const adminError = requireAdmin(authResult);
    if (adminError) {
      return createAuthErrorResponse(adminError);
    }

    const { status } = await req.json();

    await dbConnect();

    const targetUser = await User.findByIdAndUpdate(params.id, { status }, { new: true });
    if (!targetUser) {
      return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User status updated successfully",
      id: targetUser._id.toString(),
      uid: targetUser.uid,
      status: "success"
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ message: "Failed to update status", error: String(error), status: "error" }, { status: 500 });
  }
}

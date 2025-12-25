// add mongodb imports
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { uid, status } = await req.json();

    if (!uid) {
      return NextResponse.json({ message: "Unauthorized: Missing UID", status: "error" }, { status: 401 });
    }

    const adminUser = await User.findById(uid);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ message: "Unauthorized: Not an admin", status: "error" }, { status: 403 });
    }

    const targetUser = await User.findById(params.id);
    if (!targetUser) {
      return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "User status updated successfully", 
      uid: targetUser._id,
      status: "success" 
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ 
      message: "Failed to update status", 
      error: String(error), 
      status: "error" 
    }, { status: 500 });
  }
}

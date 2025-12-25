import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { uid, status } = await req.json();

    if (!uid) {
      return NextResponse.json({ message: "Unauthorized: Missing UID", status: "error" }, { status: 401 });
    }

    await dbConnect();
    const adminUser = await User.findOne({ uid: uid });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ message: "Unauthorized: Not an admin", status: "error" }, { status: 403 });
    }

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

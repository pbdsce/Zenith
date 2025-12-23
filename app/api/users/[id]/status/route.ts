// add mongodb imports
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { uid, status } = await req.json(); // The uid of the requester (logged-in user)

    if (!uid) {
      return NextResponse.json({ message: "Unauthorized: Missing UID", status: "error" }, { status: 401 });
    }

    // TODO: Verify admin status using MongoDB User collection
    // const adminUser = await User.findById(uid);
    // if (!adminUser || !adminUser.isAdmin) {
    //   return NextResponse.json({ message: "Unauthorized: Not an admin", status: "error" }, { status: 403 });
    // }

    // TODO: Update user status in MongoDB User collection
    // const targetUser = await User.findByIdAndUpdate(params.id, { status }, { new: true });
    // if (!targetUser) {
    //   return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    // }

    return NextResponse.json({ message: "User status updated successfully", status: "success" });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ message: "Failed to update status", error: String(error), status: "error" }, { status: 500 });
  }
}

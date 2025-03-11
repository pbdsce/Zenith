import { db } from "@/Firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { uid, status } = await req.json(); // The uid of the requester (logged-in user)

    if (!uid) {
      return NextResponse.json({ message: "Unauthorized: Missing UID", status: "error" }, { status: 401 });
    }

    // Fetch the requester's user data
    const adminRef = doc(db, "registrations", uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists() || !adminSnap.data().isAdmin) {
      return NextResponse.json({ message: "Unauthorized: Not an admin", status: "error" }, { status: 403 });
    }

    // Update the status of the target user
    const userRef = doc(db, "registrations", params.id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    }

    await updateDoc(userRef, { status });

    return NextResponse.json({ message: "User status updated successfully", status: "success" });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ message: "Failed to update status", error: String(error), status: "error" }, { status: 500 });
  }
}
    
import { db } from "@/Firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const userRef = doc(db, "registrations", params.id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    }

    return NextResponse.json({ user: userSnap.data(), status: "success" });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ message: "Failed to fetch user", error: String(error), status: "error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
      const updates = await req.json();
      
      if (updates.name) {
        return NextResponse.json({ message: "Name cannot be updated", status: "error" }, { status: 400 });
      }
  
      const userRef = doc(db, "registrations", params.id);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
      }
  
      await updateDoc(userRef, updates);
  
      return NextResponse.json({ message: "User updated successfully", status: "success" });
    } catch (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ message: "Failed to update user", error: String(error), status: "error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
      const { uid } = await req.json(); // The UID of the requester
  
      if (!uid) {
        return NextResponse.json({ message: "Unauthorized: Missing UID", status: "error" }, { status: 401 });
      }
  
      // Fetch the requester's user data
      const adminRef = doc(db, "registrations", uid);
      const adminSnap = await getDoc(adminRef);
  
      if (!adminSnap.exists() || !adminSnap.data().isAdmin) {
        return NextResponse.json({ message: "Unauthorized: Not an admin", status: "error" }, { status: 403 });
      }
  
      // Delete the target user
      const userRef = doc(db, "registrations", params.id);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
      }
  
      await deleteDoc(userRef);
  
      return NextResponse.json({ message: "User deleted successfully", status: "success" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json({ message: "Failed to delete user", error: String(error), status: "error" }, { status: 500 });
    }
  }
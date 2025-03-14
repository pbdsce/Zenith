import { db } from "@/Firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { uid, status } = await req.json(); // The uid of the requester (logged-in user)

    if (!uid) {
      return NextResponse.json({ message: "Unauthorized: Missing UID", status: "error" }, { status: 401 });
    }

    // Fetch the requester's user data to verify admin status
    const adminRef = doc(db, "user_profiles", uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      return NextResponse.json({ message: "Unauthorized: Admin not found", status: "error" }, { status: 403 });
    }

    const adminData = adminSnap.data();
    
    // Check isAdmin flag directly from user_profiles first
    if (adminData.isAdmin !== true) {
      // Fall back to batch check for backward compatibility
      const adminBatchDocId = adminData.batch_doc_id;
      const adminBatchRef = doc(db, "user_batches", adminBatchDocId);
      const adminBatchSnap = await getDoc(adminBatchRef);
      
      if (!adminBatchSnap.exists()) {
        return NextResponse.json({ message: "Admin batch not found", status: "error" }, { status: 404 });
      }

      const adminBatchData = adminBatchSnap.data();
      const adminInBatch = adminBatchData.users.find((u: { uid: string }) => u.uid === uid);

      if (!adminInBatch || !adminInBatch.isAdmin) {
        return NextResponse.json({ message: "Unauthorized: Not an admin", status: "error" }, { status: 403 });
      }
      
      // Update isAdmin in user_profiles for consistency
      await updateDoc(adminRef, {
        isAdmin: true
      });
    }

    // Find target user
    const userRef = doc(db, "user_profiles", params.id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    }

    const userData = userSnap.data();
    const batchDocId = userData.batch_doc_id;

    // Get the target user's batch
    const batchRef = doc(db, "user_batches", batchDocId);
    const batchSnap = await getDoc(batchRef);

    if (!batchSnap.exists()) {
      return NextResponse.json({ message: "User batch not found", status: "error" }, { status: 404 });
    }

    const batchData = batchSnap.data();
    const userIndex = batchData.users.findIndex((u: { uid: string }) => u.uid === params.id);

    if (userIndex === -1) {
      return NextResponse.json({ message: "User not found in batch", status: "error" }, { status: 404 });
    }

    // Update the user's status in the batch
    const updatedUsers = [...batchData.users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      status
    };

    await updateDoc(batchRef, {
      users: updatedUsers,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ message: "User status updated successfully", status: "success" });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ message: "Failed to update status", error: String(error), status: "error" }, { status: 500 });
  }
}

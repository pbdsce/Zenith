import { db } from "@/Firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // Extract user data from request
    const { userId } = await req.json(); // ID of the user who is upvoting
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized: Missing user ID", status: "error" }, 
        { status: 401 }
      );
    }
    
    // Optional authentication header check for development
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn("Authorization header missing or invalid, proceeding anyway for development");
      // In production, you might want to return an error instead
    }
    
    // Get the target user document (the one being upvoted) from user_profiles
    const targetUserRef = doc(db, "user_profiles", params.id);
    const targetUserSnap = await getDoc(targetUserRef);
    
    if (!targetUserSnap.exists()) {
      return NextResponse.json(
        { message: "User not found", status: "error" }, 
        { status: 404 }
      );
    }
    
    const targetUserData = targetUserSnap.data();
    const targetBatchId = targetUserData.batch_doc_id;
    
    // Get the upvoter's user document from user_profiles
    const upvoterRef = doc(db, "user_profiles", userId);
    const upvoterSnap = await getDoc(upvoterRef);
    
    if (!upvoterSnap.exists()) {
      return NextResponse.json(
        { message: "Upvoter account not found", status: "error" }, 
        { status: 404 }
      );
    }
    
    const upvoterData = upvoterSnap.data();
    const upvotedProfiles = upvoterData.upvotedProfiles || [];
    
    // Check if the user has already upvoted this profile
    const hasUpvoted = upvotedProfiles.includes(params.id);
    
    // Get the target batch document
    const targetBatchRef = doc(db, "user_batches", targetBatchId);
    const targetBatchSnap = await getDoc(targetBatchRef);
    
    if (!targetBatchSnap.exists()) {
      return NextResponse.json(
        { message: "User batch not found", status: "error" }, 
        { status: 404 }
      );
    }
    
    const batchData = targetBatchSnap.data();
    const userIndex = batchData.users.findIndex((u: { uid: string }) => u.uid === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { message: "User not found in batch", status: "error" }, 
        { status: 404 }
      );
    }
    
    const userInBatch = batchData.users[userIndex];
    let upVote = userInBatch.upVote || 0;
    
    // Update the upvote count and list
    if (hasUpvoted) {
      // Remove the upvote
      upVote = Math.max(0, upVote - 1);
      
      // Update the target user in the batch
      const updatedUsers = [...batchData.users];
      updatedUsers[userIndex] = {
        ...userInBatch,
        upVote
      };
      
      await updateDoc(targetBatchRef, {
        users: updatedUsers,
        updated_at: new Date().toISOString()
      });
      
      // Update the upvoter's upvotedProfiles list in user_profiles
      await updateDoc(upvoterRef, {
        upvotedProfiles: arrayRemove(params.id)
      });
      
      // Update the target user's upVote in user_profiles
      await updateDoc(targetUserRef, {
        upVote
      });
      
      return NextResponse.json({
        message: "Upvote removed successfully",
        hasUpvoted: false,
        upvotes: upVote,
        status: "success"
      });
    } else {
      // Add the upvote
      upVote++;
      
      // Update the target user in the batch
      const updatedUsers = [...batchData.users];
      updatedUsers[userIndex] = {
        ...userInBatch,
        upVote
      };
      
      await updateDoc(targetBatchRef, {
        users: updatedUsers,
        updated_at: new Date().toISOString()
      });
      
      // Update the upvoter's upvotedProfiles list in user_profiles
      await updateDoc(upvoterRef, {
        upvotedProfiles: arrayUnion(params.id)
      });
      
      // Update the target user's upVote in user_profiles
      await updateDoc(targetUserRef, {
        upVote
      });
      
      return NextResponse.json({
        message: "Upvote added successfully",
        hasUpvoted: true,
        upvotes: upVote,
        status: "success"
      });
    }
  } catch (error) {
    console.error("Error updating upvote:", error);
    return NextResponse.json(
      { message: "Failed to update upvote", error: String(error), status: "error" }, 
      { status: 500 }
    );
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Extract user ID from query parameter
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { message: "Missing user ID parameter", status: "error" }, 
        { status: 400 }
      );
    }
    
    // Get the upvoter's user document from user_profiles
    const upvoterRef = doc(db, "user_profiles", userId);
    const upvoterSnap = await getDoc(upvoterRef);
    
    if (!upvoterSnap.exists()) {
      return NextResponse.json(
        { message: "User not found", status: "error" }, 
        { status: 404 }
      );
    }
    
    const upvoterData = upvoterSnap.data();
    const upvotedProfiles = upvoterData.upvotedProfiles || [];
    
    // Get the target user document from user_profiles
    const targetUserRef = doc(db, "user_profiles", params.id);
    const targetUserSnap = await getDoc(targetUserRef);
    
    if (!targetUserSnap.exists()) {
      return NextResponse.json(
        { message: "Target user not found", status: "error" }, 
        { status: 404 }
      );
    }
    
    const targetUserData = targetUserSnap.data();
    
    // Check if the user has upvoted this profile
    const hasUpvoted = upvotedProfiles.includes(params.id);
    
    return NextResponse.json({
      hasUpvoted,
      upvotes: targetUserData.upVote || 0,
      status: "success"
    });
  } catch (error) {
    console.error("Error checking upvote status:", error);
    return NextResponse.json(
      { message: "Failed to check upvote status", error: String(error), status: "error" }, 
      { status: 500 }
    );
  }
}

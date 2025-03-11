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
    
    // Get the target user document (the one being upvoted)
    const targetUserRef = doc(db, "registrations", params.id);
    const targetUserSnap = await getDoc(targetUserRef);
    
    if (!targetUserSnap.exists()) {
      return NextResponse.json(
        { message: "User not found", status: "error" }, 
        { status: 404 }
      );
    }
    
    const targetUserData = targetUserSnap.data();
    
    // Initialize arrays if they don't exist
    const upVotedBy = targetUserData.upVotedBy || [];
    let upVote = targetUserData.upVote || 0;
    
    // Get the upvoter's user document
    const upvoterRef = doc(db, "registrations", userId);
    const upvoterSnap = await getDoc(upvoterRef);
    
    if (!upvoterSnap.exists()) {
      return NextResponse.json(
        { message: "Upvoter account not found", status: "error" }, 
        { status: 404 }
      );
    }
    
    // Check if the user has already upvoted this profile
    const hasUpvoted = upVotedBy.includes(userId);
    
    // Update the upvote count and list
    if (hasUpvoted) {
      // Remove the upvote
      await updateDoc(targetUserRef, {
        upVote: upVote - 1,
        upVotedBy: arrayRemove(userId)
      });
      return NextResponse.json({
        message: "Upvote removed successfully",
        hasUpvoted: false,
        upvotes: upVote - 1,
        status: "success"
      });
    } else {
      // Add the upvote
      await updateDoc(targetUserRef, {
        upVote: upVote + 1,
        upVotedBy: arrayUnion(userId)
      });
      return NextResponse.json({
        message: "Upvote added successfully",
        hasUpvoted: true,
        upvotes: upVote + 1,
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
    
    // Get the target user document
    const targetUserRef = doc(db, "registrations", params.id);
    const targetUserSnap = await getDoc(targetUserRef);
    
    if (!targetUserSnap.exists()) {
      return NextResponse.json(
        { message: "User not found", status: "error" }, 
        { status: 404 }
      );
    }
    
    const targetUserData = targetUserSnap.data();
    const upVotedBy = targetUserData.upVotedBy || [];
    const upVote = targetUserData.upVote || 0;
    
    // Check if the user has upvoted this profile
    const hasUpvoted = upVotedBy.includes(userId);
    
    return NextResponse.json({
      hasUpvoted,
      upvotes: upVote,
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

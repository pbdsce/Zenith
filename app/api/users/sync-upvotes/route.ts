import { db } from "@/Firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Check for authentication but make it optional for development
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn("Authorization header missing or invalid, proceeding anyway for development");
    }

    // Extract data from the request
    const { userId, upvotes, downvotes } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { message: "Missing user ID", status: "error" },
        { status: 400 }
      );
    }
    
    // Get the upvoter's document
    const userRef = doc(db, "registrations", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return NextResponse.json(
        { message: "User not found", status: "error" },
        { status: 404 }
      );
    }
    
    // User's current upvoted profiles
    const userData = userSnap.data();
    const currentUpvotedProfiles = userData.upvotedProfiles || [];
    
    // Process upvotes and downvotes in batches to avoid too many writes
    const processedUpvotes = [];
    const processedDownvotes = [];
    
    // Process upvotes
    if (upvotes && upvotes.length > 0) {
      for (const profileId of upvotes) {
        // Skip if already upvoted
        if (currentUpvotedProfiles.includes(profileId)) continue;
        
        // Update the target profile's upvote count
        const profileRef = doc(db, "registrations", profileId);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) continue;
        
        // Increment the upvote count
        await updateDoc(profileRef, {
          upVote: increment(1)
        });
        
        processedUpvotes.push(profileId);
      }
    }
    
    // Process downvotes
    if (downvotes && downvotes.length > 0) {
      for (const profileId of downvotes) {
        // Skip if not currently upvoted
        if (!currentUpvotedProfiles.includes(profileId)) continue;
        
        // Update the target profile's upvote count
        const profileRef = doc(db, "registrations", profileId);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) continue;
        
        // Decrement the upvote count, but ensure it doesn't go below 0
        const profileData = profileSnap.data();
        const currentUpvotes = profileData.upVote || 0;
        
        await updateDoc(profileRef, {
          upVote: Math.max(0, currentUpvotes - 1)
        });
        
        processedDownvotes.push(profileId);
      }
    }
    
    // Update the user's upvoted profiles list
    if (processedUpvotes.length > 0 || processedDownvotes.length > 0) {
      // Calculate the new upvoted profiles list
      const newUpvotedProfiles = [...currentUpvotedProfiles];
      
      // Add new upvotes
      for (const profileId of processedUpvotes) {
        if (!newUpvotedProfiles.includes(profileId)) {
          newUpvotedProfiles.push(profileId);
        }
      }
      
      // Remove downvotes
      for (const profileId of processedDownvotes) {
        const index = newUpvotedProfiles.indexOf(profileId);
        if (index !== -1) {
          newUpvotedProfiles.splice(index, 1);
        }
      }
      
      // Update the user document
      await updateDoc(userRef, {
        upvotedProfiles: newUpvotedProfiles
      });
    }
    
    return NextResponse.json({
      message: "Upvotes synchronized successfully",
      status: "success",
      processed: {
        upvotes: processedUpvotes.length,
        downvotes: processedDownvotes.length
      }
    });
    
  } catch (error) {
    console.error("Error syncing upvotes:", error);
    return NextResponse.json(
      { message: "Failed to sync upvotes", error: String(error), status: "error" },
      { status: 500 }
    );
  }
}

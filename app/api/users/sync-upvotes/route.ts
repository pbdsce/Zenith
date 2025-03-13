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
    
    // Get the upvoter's document from user_profiles
    const userRef = doc(db, "user_profiles", userId);
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
        
        // Get the target profile from user_profiles
        const profileRef = doc(db, "user_profiles", profileId);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) continue;
        
        const profileData = profileSnap.data();
        const batchDocId = profileData.batch_doc_id;
        
        // Get the batch document
        const batchRef = doc(db, "user_batches", batchDocId);
        const batchSnap = await getDoc(batchRef);
        
        if (!batchSnap.exists()) continue;
        
        const batchData = batchSnap.data();
        const profileIndex = batchData.users.findIndex((u: { uid: string }) => u.uid === profileId);
        
        if (profileIndex === -1) continue;
        
        // Increment the upvote count in both collections
        // 1. Update in user_profiles
        await updateDoc(profileRef, {
          upVote: (profileData.upVote || 0) + 1
        });
        
        // 2. Update in user_batches
        const updatedUsers = [...batchData.users];
        updatedUsers[profileIndex] = {
          ...updatedUsers[profileIndex],
          upVote: (updatedUsers[profileIndex].upVote || 0) + 1
        };
        
        await updateDoc(batchRef, {
          users: updatedUsers,
          updated_at: new Date().toISOString()
        });
        
        processedUpvotes.push(profileId);
      }
    }
    
    // Process downvotes
    if (downvotes && downvotes.length > 0) {
      for (const profileId of downvotes) {
        // Skip if not currently upvoted
        if (!currentUpvotedProfiles.includes(profileId)) continue;
        
        // Get the target profile from user_profiles
        const profileRef = doc(db, "user_profiles", profileId);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) continue;
        
        const profileData = profileSnap.data();
        const batchDocId = profileData.batch_doc_id;
        
        // Get the batch document
        const batchRef = doc(db, "user_batches", batchDocId);
        const batchSnap = await getDoc(batchRef);
        
        if (!batchSnap.exists()) continue;
        
        const batchData = batchSnap.data();
        const profileIndex = batchData.users.findIndex((u: { uid: string }) => u.uid === profileId);
        
        if (profileIndex === -1) continue;
        
        // Get current upvotes
        const currentUpvotes = profileData.upVote || 0;
        
        // Decrement the upvote count in both collections, but ensure it doesn't go below 0
        const newUpvoteCount = Math.max(0, currentUpvotes - 1);
        
        // 1. Update in user_profiles
        await updateDoc(profileRef, {
          upVote: newUpvoteCount
        });
        
        // 2. Update in user_batches
        const updatedUsers = [...batchData.users];
        updatedUsers[profileIndex] = {
          ...updatedUsers[profileIndex],
          upVote: newUpvoteCount
        };
        
        await updateDoc(batchRef, {
          users: updatedUsers,
          updated_at: new Date().toISOString()
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

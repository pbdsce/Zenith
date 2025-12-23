//  add mongodb imports
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
    
    // TODO: Query MongoDB User collection for target user
    // const targetUser = await User.findById(params.id);
    // if (!targetUser) {
    //   return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    // }
    
    // TODO: Query MongoDB User collection for upvoter
    // const upvoter = await User.findById(userId);
    // if (!upvoter) {
    //   return NextResponse.json({ message: "Upvoter account not found", status: "error" }, { status: 404 });
    // }
    
    // TODO: Check if user has already upvoted
    // const hasUpvoted = upvoter.upvotedProfiles?.includes(params.id) || false;
    
    // TODO: Update upvote logic:
    // if (hasUpvoted) {
    //   // Remove upvote
    //   targetUser.upVote = Math.max(0, targetUser.upVote - 1);
    //   upvoter.upvotedProfiles = upvoter.upvotedProfiles.filter(id => id !== params.id);
    // } else {
    //   // Add upvote
    //   targetUser.upVote = (targetUser.upVote || 0) + 1;
    //   if (!upvoter.upvotedProfiles) upvoter.upvotedProfiles = [];
    //   upvoter.upvotedProfiles.push(params.id);
    // }
    // await targetUser.save();
    // await upvoter.save();
    
    return NextResponse.json({
      message: "Upvote gged",
      hasUpvoted: false,
      upvotes: 0,
      status: "error"
    }, { status: 501 });
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
    
    // TODO: Query MongoDB User collection for upvoter and target user
    // const upvoter = await User.findById(userId);
    // const targetUser = await User.findById(params.id);
    // if (!upvoter || !targetUser) {
    //   return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    // }
    // const hasUpvoted = upvoter.upvotedProfiles?.includes(params.id) || false;
    
    
    return NextResponse.json({
      hasUpvoted: false, // TODO: Replace with MongoDB query result
      upvotes: 0, // TODO: Replace with MongoDB query result
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

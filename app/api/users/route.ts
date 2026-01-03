import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { authenticateUser, createAuthErrorResponse, requireAdmin } from "@/lib/middleware/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult);
    }

    const adminError = requireAdmin(authResult);
    if (adminError) {
      return createAuthErrorResponse(adminError);
    }

    await dbConnect();
    const users = await User.find({}).select('-__v');
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      uid: user.uid,
      name: user.name,
      email: user.email,
      discord_username: user.discord_username || null,
      resume_link: user.resume_link || null,
      profile_picture: user.profile_picture || null,
      leetcode_profile: user.leetcode_profile || null,
      github_link: user.github_link || null,
      linkedin_link: user.linkedin_link || null,
      codeforces_link: user.codeforces_link || null,
      kaggle_link: user.kaggle_link || null,
      devfolio_link: user.devfolio_link || null,
      portfolio_link: user.portfolio_link || null,
      ctf_profile: user.ctf_profile || null,
      bio: user.bio || null,
      age: user.age || null,
      organisation: user.organisation || null,
      role: user.role,
      isLooking: user.isLooking
    }));

    return NextResponse.json({ users: formattedUsers, status: "success" });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users", error: String(error), status: "error" },
      { status: 500 }
    );
  }
}

// add mongodb imports
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TODO: Replace with MongoDB User collection query
    // const users = await User.find({}).select('-password'); // Exclude sensitive fields
    // return NextResponse.json({ users, status: "success" });    
    interface User {
      uid: string;
      name: string;
      email: string;
      phone: string;
      resume_link: string;
      college_name: string | null;
      bio: string | null;
      age: number | null;
      profile_picture: string | null;
      leetcode_profile: string | null;
      github_link: string | null;
      linkedin_link: string | null;
      competitive_profile: string | null;
      ctf_profile: string | null;
      kaggle_link: string | null;
      devfolio_link: string | null;
      portfolio_link: string | null;
      status: string;
    }
    
    // Return empty array until MongoDB is implemented
    const users: User[] = [];

    return NextResponse.json({ users, status: "success" });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users", error: String(error), status: "error" },
      { status: 500 }
    );
  }
}

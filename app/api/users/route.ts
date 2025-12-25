// add mongodb imports
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({ role: { $ne: 'admin' } });
    const usersList = users.map(user => ({
      uid: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      profile_picture: user.profile_picture || null,
      bio: user.bio || null,
      age: user.age || null,
      organisation: user.organisation || null,
      isLooking: user.isLooking,
      role: user.role
    }));

    return NextResponse.json({ users: usersList, status: "success" });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users", error: String(error), status: "error" },
      { status: 500 }
    );
  }
}

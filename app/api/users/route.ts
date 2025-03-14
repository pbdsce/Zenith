import { db } from "@/Firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all batch documents from user_batches
    const batchesRef = collection(db, "user_batches");
    const batchesSnapshot = await getDocs(batchesRef);
    
    // Collect all users from all batches
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
      upVote: number;
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
    
    let users: User[] = [];
    
    for (const batchDoc of batchesSnapshot.docs) {
      const batchData = batchDoc.data();
      if (batchData.users && Array.isArray(batchData.users)) {
        // Filter out deleted users
        const activeUsers = batchData.users
          .filter(user => !user.isDeleted)
          .map(user => ({
            uid: user.uid,
            name: user.name,
            email: user.email,
            phone: user.phone,
            resume_link: user.resume_link,
            college_name: user.college_name || null,
            bio: user.bio || null,
            age: user.age || null,
            profile_picture: user.profile_picture || null,
            upVote: user.upVote || 0,
            leetcode_profile: user.leetcode_profile || null,
            github_link: user.github_link || null,
            linkedin_link: user.linkedin_link || null,
            competitive_profile: user.competitive_profile || null,
            ctf_profile: user.ctf_profile || null,
            kaggle_link: user.kaggle_link || null,
            devfolio_link: user.devfolio_link || null,
            portfolio_link: user.portfolio_link || null,
            status: user.status || "pending",
          }));
        
        users = [...users, ...activeUsers];
      }
    }

    return NextResponse.json({ users, status: "success" });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users", error: String(error), status: "error" },
      { status: 500 }
    );
  }
}

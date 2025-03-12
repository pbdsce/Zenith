import { db } from "@/Firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "registrations"));
    const users = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const returnObj = {  uid: doc.id, // Always use doc.id for consistency
        name: data.name,
        email: data.email,
        phone: data.phone,
        resume_link: data.resume_link,
        college_name: data.college_name,
        bio: data.bio,
        profile_picture: data.profile_picture,
        upVote: data.upVote,
        leetcode_profile: data.leetcode_profile || null,
        github_link: data.github_link || null,
        linkedin_link: data.linkedin_link || null,
        competitive_profile: data.competitive_profile || null,
        ctf_profile: data.ctf_profile || null,
        kaggle_link: data.kaggle_link || null,
        devfolio_link: data.devfolio_link || null,
        portfolio_link: data.portfolio_link || null,
        status: "pending",
      }
      console.log("REturned object is : ", returnObj);
      
      return {
        uid: doc.id, // Always use doc.id for consistency
        name: data.name,
        email: data.email,
        phone: data.phone,
        resume_link: data.resume_link,
        college_name: data.college_name,
        bio: data.bio,
        age: data.age,
        profile_picture: data.profile_picture,
        upVote: data.upVote || 0, // Make consistent with upVote elsewhere
        leetcode_profile: data.leetcode_profile || null,
        github_link: data.github_link || null,
        linkedin_link: data.linkedin_link || null,
        competitive_profile: data.competitive_profile || null,
        ctf_profile: data.ctf_profile || null,
        kaggle_link: data.kaggle_link || null,
        devfolio_link: data.devfolio_link || null,
        portfolio_link: data.portfolio_link || null,
        status: "pending",
      };
    });

    return NextResponse.json({ users, status: "success" });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users", error: String(error), status: "error" },
      { status: 500 }
    );
  }
}

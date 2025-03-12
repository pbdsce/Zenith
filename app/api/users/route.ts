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
        upVote: data.upVote 
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
        profile_picture: data.profile_picture,
        upVote: data.upVote || 0, // Make consistent with upVote elsewhere
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

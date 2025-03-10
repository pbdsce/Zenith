import { db } from "@/Firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "registrations"));
    const users = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: data.uid || doc.id, // Use doc.id if uid is missing
        name: data.name,
        email: data.email,
        phone: data.phone,
        resume_link: data.resume_link,
        college_name:data.college_name
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

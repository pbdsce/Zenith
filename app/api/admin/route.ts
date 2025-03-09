import { db } from "@/Firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { auth } from "@/Firebase"; // Import Firebase Auth
import { createUserWithEmailAndPassword } from "firebase/auth";
import { NextResponse } from "next/server";

const SECRET_CODE = "pbstruggles"; 

export async function POST(request: Request) {
  try {
    const { email, password, secret } = await request.json();

    // **1️⃣ Validate Inputs**
    if (!email || !password || !secret) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // **2️⃣ Check Email Domain**
    if (!email.endsWith("@pointblank.club")) {
      return NextResponse.json({ message: "Unauthorized email domain" }, { status: 403 });
    }

    // **3️⃣ Verify Secret Code**
    if (secret !== SECRET_CODE) {
      return NextResponse.json({ message: "Invalid secret code" }, { status: 403 });
    }

    // **4️⃣ Register User in Firebase Auth**
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // **5️⃣ Store Admin in Firestore**
    const userRef = doc(collection(db, "users"), uid);
    await setDoc(userRef, {
      uid,
      email,
      isAdmin: true, 
    });

    return NextResponse.json({ message: "Admin registered successfully", uid }, { status: 201 });
  } catch (error) {
    console.error("Error registering admin:", error);
    return NextResponse.json({ message: "Failed to register admin", error: String(error) }, { status: 500 });
  }
}

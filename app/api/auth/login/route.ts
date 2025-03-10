import { db, auth } from "@/Firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { NextResponse } from "next/server";

const SECRET_CODE = "pbstruggles";

export async function POST(request: Request) {
  try {
    // Extract login credentials
    const { email, password } = await request.json();

    // Validate request data
    if (!email || !password) {
      return NextResponse.json(
        {
          message: "Email and password are required",
          status: "error"
        },
        { status: 400 }
      );
    }

    // Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Get ID token for client authentication
    const idToken = await firebaseUser.getIdToken();
    
    // Get user data from Firestore
    const userRef = doc(db, "registrations", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    // Handle case where user exists in Auth but not in Firestore
    if (!userSnap.exists()) {
      return NextResponse.json(
        {
          message: "User record not found",
          status: "error"
        },
        { status: 404 }
      );
    }

    const userData = userSnap.data();

    // Check if user is suspended or deactivated
    if (userData.status === "suspended" || userData.status === "deactivated") {
      return NextResponse.json(
        {
          message: "Account is " + userData.status,
          status: "error"
        },
        { status: 403 }
      );
    }

    // Check for admin status - either already an admin or meets criteria to be promoted
    let isAdmin = userData.isAdmin || false;
    let updatedAdminStatus = false;
    
    // Check if eligible to be an admin (email domain + password matches secret)
    if (!isAdmin && email.endsWith("@pointblank.club") && password === SECRET_CODE) {
      // Update user to have admin privileges
      await updateDoc(userRef, { isAdmin: true });
      isAdmin = true;
      updatedAdminStatus = true;
    }

    // Return user data and token
    return NextResponse.json({
      message: updatedAdminStatus 
        ? "Login successful. Admin privileges granted." 
        : "Login successful",
      status: "success",
      user: {
        uid: firebaseUser.uid,
        email: userData.email,
        name: userData.name || null,
        isAdmin: isAdmin,
        profile_picture: userData.profile_picture || null,
        status: userData.status || "active"
      },
      token: idToken
    });

  } catch (error: any) {
    console.error("Login error:", error);
    
    // Handle Firebase Auth specific errors
    const errorCode = error.code;
    let errorMessage = "Login failed";
    let statusCode = 500;

    switch (errorCode) {
      case 'auth/invalid-email':
        errorMessage = "Invalid email format";
        statusCode = 400;
        break;
        
      case 'auth/user-disabled':
        errorMessage = "This account has been disabled";
        statusCode = 403;
        break;
        
      case 'auth/user-not-found':
        errorMessage = "No account found with this email";
        statusCode = 404;
        break;
        
      case 'auth/wrong-password':
        errorMessage = "Incorrect password";
        statusCode = 401;
        break;
        
      case 'auth/too-many-requests':
        errorMessage = "Too many unsuccessful login attempts. Please try again later";
        statusCode = 429;
        break;
    }

    return NextResponse.json(
      {
        message: errorMessage,
        error: errorCode,
        status: "error"
      },
      { status: statusCode }
    );
  }
}

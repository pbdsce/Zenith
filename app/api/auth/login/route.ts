import { db, auth } from "@/Firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { NextResponse } from "next/server";

const SECRET_CODE = "pbstruggles";

export async function POST(request: Request) {
  try {
    // Extract login credentials (removed rememberMe)
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

    // Check if this could be an admin login (before authentication)
    const isAdminAttempt = email.endsWith("@pointblank.club") && password === SECRET_CODE;

    // Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Get ID token for client authentication
    const idToken = await firebaseUser.getIdToken();
    
    // Get user data from Firestore
    const userRef = doc(db, "registrations", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    let userData;
    let isNewAdmin = false;

    // Check if user exists in Firestore
    if (!userSnap.exists()) {
      // If this is an admin attempt, create a new admin user
      if (isAdminAttempt) {
        // Create a new admin user in Firestore
        userData = {
          uid: firebaseUser.uid,
          email: email,
          name: email.split('@')[0], // Use part before @ as default name
          isAdmin: true,
          status: "active",
          registration_time: new Date().toISOString()
        };
        
        // Save the new admin user to Firestore
        await setDoc(userRef, userData);
        isNewAdmin = true;
      } else {
        // Regular user doesn't exist in Firestore
        return NextResponse.json(
          {
            message: "User record not found",
            status: "error"
          },
          { status: 404 }
        );
      }
    } else {
      // User exists in Firestore
      userData = userSnap.data();

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

      // Check if eligible to be promoted to admin
      if (!userData.isAdmin && isAdminAttempt) {
        // Update user to have admin privileges
        await updateDoc(userRef, { isAdmin: true });
        userData.isAdmin = true;
        isNewAdmin = true;
      }
    }

    // Return user data and token (removed rememberMe)
    return NextResponse.json({
      message: isNewAdmin 
        ? "Login successful. Admin privileges granted." 
        : "Login successful",
      status: "success",
      user: {
        uid: firebaseUser.uid,
        email: userData.email,
        name: userData.name || null,
        isAdmin: userData.isAdmin,
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
      
      case 'auth/invalid-credential':
        errorMessage = "Invalid credentials";
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

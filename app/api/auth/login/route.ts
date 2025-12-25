import { auth } from "@/Firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// TODO: Move this to .env file
const SECRET_CODE = "pbstruggles";
const ADMIN_EMAIL_DOMAIN = "@pointblank.club";

// Helper function to create error response
const createErrorResponse = (message: string, status: number, errorCode?: string) => {
  return NextResponse.json(
    { message, status: "error", ...(errorCode && { error: errorCode }) },
    { status }
  );
};

// Handle authentication with Firebase
const authenticateUser = async (email: string, password: string, isAdminAttempt: boolean) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (authError: any) {
    if (isAdminAttempt && 
        (authError.code === 'auth/invalid-credential' || 
         authError.code === 'auth/user-not-found')) {
      // Create new admin account if login fails with valid admin domain
      return await createUserWithEmailAndPassword(auth, email, password);
    }
    // For non-admin users or other errors, propagate the error
    throw authError;
  }
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return createErrorResponse("Email and password are required", 400);
    }
    
    const isAdminAttempt = email.endsWith(ADMIN_EMAIL_DOMAIN) && password === SECRET_CODE;
    
    // Authentication phase
    const userCredential = await authenticateUser(email, password, isAdminAttempt);
    const firebaseUser = userCredential.user;
    const idToken = await firebaseUser.getIdToken();
    
    await dbConnect();
    let user = await User.findOne({ uid: firebaseUser.uid });
    if (!user) {
      user = await User.findOne({ email: email });
    }
    
    // Process based on user type
    if (isAdminAttempt) {
      // Admin login flow
      if (user) {
        if (user.role !== 'admin') {
          await User.findByIdAndUpdate(user._id, { role: 'admin' });
          user.role = 'admin';
        }
        
        return NextResponse.json({
          message: "Login successful",
          status: "success",
          user: {
            id: user._id.toString(),
            uid: user.uid,
            email: user.email,
            name: user.name,
            isAdmin: true,
            profile_picture: user.profile_picture || null,
            status: "active"
          },
          token: idToken
        });
      } else {
        const adminName = email.split('@')[0].split('.')
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');
        
        const newAdminUser = await new User({
          uid: firebaseUser.uid,
          name: adminName,
          email: email,
          role: 'admin',
          isLooking: false
        }).save();
        
        return NextResponse.json({
          message: "Login successful. Admin privileges granted.",
          status: "success",
          user: {
            id: newAdminUser._id.toString(), 
            uid: newAdminUser.uid,
            email: newAdminUser.email,
            name: newAdminUser.name,
            isAdmin: true,
            profile_picture: newAdminUser.profile_picture || null,
            status: "active"
          },
          token: idToken
        });
      }
    } else {
      if (!user) {
        return createErrorResponse("User record not found", 404);
      }
      
      
      return NextResponse.json({
        message: "Login successful",
        status: "success",
        user: {
          id: user._id.toString(),
          uid: user.uid,
          email: user.email,
          name: user.name,
          isAdmin: user.role === 'admin',
          profile_picture: user.profile_picture || null,
          status: "active"
        },
        token: idToken
      });
    }
  } catch (error: any) {
    console.error("Login error:", error);
    
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

    return createErrorResponse(errorMessage, statusCode, errorCode);
  }
}

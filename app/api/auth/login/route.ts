import { auth } from "@/Firebase";
// add mongodb imports
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { NextResponse } from "next/server";

// TODO: Move this to .env file
const SECRET_CODE = "pbstruggles";
const ADMIN_EMAIL_DOMAIN = "@pointblank.club";

// Define types for better maintainability
interface UserBatch {
  id: string;
  users: BatchUser[];
  isAdminBatch: boolean;
  created_at: string;
  updated_at: string;
}

interface BatchUser {
  uid: string;
  authUid: string;
  name: string | null;
  email: string;
  phone: string | null;
  profile_picture: string | null;
  status: 'active' | 'suspended' | 'deactivated';
  isAdmin: boolean;
  isDeleted: boolean;
  registration_time: string;
}

interface UserProfile {
  uid: string;
  authUid: string;
  name: string | null;
  email: string;
  phone: string | null;
  profile_picture: string | null;
  batch_doc_id: string;
  registration_time: string;
  isAdmin: boolean; // Added isAdmin field to UserProfile
}

// Helper function to create error response
const createErrorResponse = (message: string, status: number, errorCode?: string) => {
  return NextResponse.json(
    { message, status: "error", ...(errorCode && { error: errorCode }) },
    { status }
  );
};

// Helper function to find user profile by authUid or email
// ADD Replace with MongoDB query - find user by authUid or email
const findUserProfile = async (authUid: string, email: string): Promise<{ userData: UserProfile | null, userDocId: string | null }> => {
  // TODO: Query MongoDB User collection:
  // - Try finding by authUid first
  // - Fall back to email query
  // - Return userData and userDocId (MongoDB _id)

  
  return { userData: null, userDocId: null };
};

// Helper function to check user status in batch
// Replace with MongoDB query - check user status directly from User collection
const checkUserInBatch = async (batchDocId: string, userId: string): Promise<{ isValid: boolean, userInBatch: BatchUser | null, batchData: UserBatch | null, message?: string }> => {
  // TODO: Query MongoDB User collection by userId
  // - Check if user exists
  // - Check user status field (should not be "suspended" or "deactivated")
  // - Return isValid, userInBatch (mapped from User doc), and message if invalid
  return { isValid: false, userInBatch: null, batchData: null, message: "User status check not implemented - MongoDB migration pending" };
};

// Helper to create a new admin user
// TODO: Replace with MongoDB User.create() - create admin user in MongoDB
const createNewAdminUser = async (uid: string, authUid: string, email: string): Promise<UserProfile> => {
  const userData: UserProfile = {
    uid,
    authUid,
    name: email.split('@')[0].split('.')
      .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' '),
    email,
    phone: null,
    profile_picture: null,
    batch_doc_id: "", // No longer needed with MongoDB
    registration_time: new Date().toISOString(),
    isAdmin: true,
  };
  
  // TODO: Create user in MongoDB User collection
  // await User.create(userData);
  
  return userData;
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
    
    // Find user profile
    const userProfile = await findUserProfile(firebaseUser.uid, email);
    let isNewAdmin = false;
    let userData: UserProfile | null = null;
    let userDocId: string;
    
    // Process based on user type
    if (isAdminAttempt) {
      // Admin login flow
      if (userProfile.userData) {
        userData = userProfile.userData;
        userDocId = userProfile.userDocId!;
        
        // Check if admin status needs to be updated
        const isAdminInProfile = userData.isAdmin === true;
        
        // If admin status is missing, update it
        if (!isAdminInProfile) {
          // TODO: Update user in MongoDB User collection
          // await User.findByIdAndUpdate(userDocId, { isAdmin: true });
          
          isNewAdmin = true;
          
          // Update local userData with admin status
          userData = {
            ...userData,
            isAdmin: true
          };
        }
      } else {
        // Create new admin user - only in user_profiles, no batch needed
        userDocId = firebaseUser.uid;
        userData = await createNewAdminUser(userDocId, firebaseUser.uid, email);
        isNewAdmin = true;
      }
    } else {
      // Regular user login flow
      if (!userProfile.userData) {
        return createErrorResponse("User record not found", 404);
      }
      
      userData = userProfile.userData;
      userDocId = userProfile.userDocId!;
      
      // Update authUid if it doesn't match
      if (userData.authUid !== firebaseUser.uid) {
        // TODO: Update user in MongoDB User collection
        // await User.findByIdAndUpdate(userDocId, { authUid: firebaseUser.uid });
        userData.authUid = firebaseUser.uid;
      }
      
      // Check user status in batch
      const batchCheck = await checkUserInBatch(userData.batch_doc_id, userDocId);
      if (!batchCheck.isValid) {
        const statusCode = batchCheck.message?.includes("not found") ? 404 : 403;
        return createErrorResponse(batchCheck.message || "User status check failed", statusCode);
      }
    }
    
    // Create response based on user type
    if (isAdminAttempt) {
      // For admin users, return data directly from user_profiles
      return NextResponse.json({
        message: isNewAdmin ? "Login successful. Admin privileges granted." : "Login successful",
        status: "success",
        user: {
          uid: userDocId,
          email: userData!.email,
          name: userData!.name || null,
          isAdmin: true, // Always true for admin users
          profile_picture: userData!.profile_picture || null,
          status: "active" // Admin users are always active
        },
        token: idToken
      });
    } else {
      // For regular users, use existing logic to get data from batch
      const batchCheck = await checkUserInBatch(userData!.batch_doc_id, userDocId);
      
      if (!batchCheck.isValid || !batchCheck.userInBatch) {
        return createErrorResponse(batchCheck.message || "User batch data not found", 404);
      }
      
      return NextResponse.json({
        message: "Login successful",
        status: "success",
        user: {
          uid: userDocId,
          email: batchCheck.userInBatch.email,
          name: batchCheck.userInBatch.name || null,
          isAdmin: userData!.isAdmin || false, // Prioritize user_profiles isAdmin
          profile_picture: batchCheck.userInBatch.profile_picture || null,
          status: batchCheck.userInBatch.status || "active"
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

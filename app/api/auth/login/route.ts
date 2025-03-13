import { db, auth } from "@/Firebase";
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { NextResponse } from "next/server";

// Consider moving this to environment variables for better security
const SECRET_CODE = "pbstruggles";

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
  upVote: number;
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
  upvotedProfiles: string[];
  upVote: number;
  registration_time: string;
}

// Helper function to get or create a batch document for admin
const getOrCreateBatchForAdmin = async (): Promise<{ batchId: string, batchDoc: UserBatch }> => {
  const batchesRef = collection(db, "user_batches");
  const q = query(batchesRef, where("isAdminBatch", "==", true));
  const querySnapshot = await getDocs(q);
  
  let batchDoc;
  let batchId;
  
  if (!querySnapshot.empty) {
    // Use the first admin batch found
    batchId = querySnapshot.docs[0].id;
    batchDoc = querySnapshot.docs[0].data() as UserBatch;
  } else {
    // Create a new admin batch
    batchId = doc(collection(db, "user_batches")).id;
    batchDoc = {
      id: batchId,
      users: [],
      isAdminBatch: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await setDoc(doc(db, "user_batches", batchId), batchDoc);
  }
  
  return { batchId, batchDoc };
};

// Helper function to find user profile by authUid or email
const findUserProfile = async (authUid: string, email: string): Promise<{ userData: UserProfile | null, userDocId: string | null }> => {
  // Try finding by authUid first
  const usersRef = collection(db, "user_profiles");
  const authQuery = query(usersRef, where("authUid", "==", authUid));
  const authQuerySnapshot = await getDocs(authQuery);
  
  if (!authQuerySnapshot.empty) {
    return {
      userData: authQuerySnapshot.docs[0].data() as UserProfile,
      userDocId: authQuerySnapshot.docs[0].id
    };
  }
  
  // Fall back to email query
  const emailQuery = query(usersRef, where("email", "==", email));
  const emailQuerySnapshot = await getDocs(emailQuery);
  
  if (!emailQuerySnapshot.empty) {
    return {
      userData: emailQuerySnapshot.docs[0].data() as UserProfile,
      userDocId: emailQuerySnapshot.docs[0].id
    };
  }
  
  return { userData: null, userDocId: null };
};

// Helper function to check user status in batch
const checkUserInBatch = async (batchDocId: string, userId: string): Promise<{ isValid: boolean, userInBatch: BatchUser | null, batchData: UserBatch | null, message?: string }> => {
  const batchRef = doc(db, "user_batches", batchDocId);
  const batchSnap = await getDoc(batchRef);
  
  if (!batchSnap.exists()) {
    return { isValid: false, userInBatch: null, batchData: null, message: "User batch not found" };
  }
  
  const batchData = batchSnap.data() as UserBatch;
  const userInBatch = batchData.users.find(u => u.uid === userId);
  
  if (!userInBatch) {
    return { isValid: false, userInBatch: null, batchData, message: "User not found in batch" };
  }
  
  if (userInBatch.status === "suspended" || userInBatch.status === "deactivated") {
    return { isValid: false, userInBatch, batchData, message: `Account is ${userInBatch.status}` };
  }
  
  return { isValid: true, userInBatch, batchData };
};

// Helper to create a new admin user
const createNewAdminUser = async (uid: string, authUid: string, email: string, batchId: string): Promise<UserProfile> => {
  const userData: UserProfile = {
    uid,
    authUid,
    name: email.split('@')[0],
    email,
    phone: null,
    profile_picture: null,
    batch_doc_id: batchId,
    upvotedProfiles: [],
    upVote: 0,
    registration_time: new Date().toISOString(),
  };
  
  await setDoc(doc(db, "user_profiles", uid), userData);
  
  // Add user to admin batch
  const batchRef = doc(db, "user_batches", batchId);
  const batchSnap = await getDoc(batchRef);
  
  if (batchSnap.exists()) {
    const batchData = batchSnap.data() as UserBatch;
    const batchUsers = batchData.users || [];
    
    const adminBatchData: BatchUser = {
      uid,
      authUid,
      name: email.split('@')[0],
      email,
      phone: null,
      profile_picture: null,
      status: "active",
      isAdmin: true,
      upVote: 0,
      isDeleted: false,
      registration_time: new Date().toISOString()
    };
    
    batchUsers.push(adminBatchData);
    
    await updateDoc(batchRef, {
      users: batchUsers,
      updated_at: new Date().toISOString()
    });
  }
  
  return userData;
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required", status: "error" },
        { status: 400 }
      );
    }
    
    const isAdminAttempt = email.endsWith("@pointblank.club") && password === SECRET_CODE;
    
    let userCredential, firebaseUser, isNewAdmin = false;
    let userDocId: string;
    let userData: UserProfile | null = null;
    
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (authError: any) {
      if (isAdminAttempt && 
          (authError.code === 'auth/invalid-credential' || 
           authError.code === 'auth/user-not-found')) {
        // Create new admin account if login fails with valid admin domain
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // For non-admin users or other errors, propagate the error
        throw authError;
      }
    }
    
    firebaseUser = userCredential.user;
    const idToken = await firebaseUser.getIdToken();
    
    // Find user profile by authUid or email
    const userProfile = await findUserProfile(firebaseUser.uid, email);
    
    if (isAdminAttempt) {
      // Admin login flow
      if (userProfile.userData) {
        // Admin user found in profile
        userData = userProfile.userData;
        userDocId = userProfile.userDocId!;
        
        // Check user status and update admin privileges if needed
        const batchCheck = await checkUserInBatch(userData.batch_doc_id, userDocId);
        
        if (!batchCheck.isValid) {
          return NextResponse.json(
            { message: batchCheck.message, status: "error" }, 
            { status: 404 }
          );
        }
        
        // Update isAdmin if needed
        if (batchCheck.userInBatch && !batchCheck.userInBatch.isAdmin) {
          const batchRef = doc(db, "user_batches", userData.batch_doc_id);
          const updatedUsers = [...batchCheck.batchData!.users];
          const userIndex = updatedUsers.findIndex(u => u.uid === userDocId);
          
          updatedUsers[userIndex] = {
            ...updatedUsers[userIndex],
            isAdmin: true
          };
          
          await updateDoc(batchRef, {
            users: updatedUsers,
            updated_at: new Date().toISOString()
          });
          
          isNewAdmin = true;
        }
      } else {
        // Create new admin user
        userDocId = firebaseUser.uid;
        const { batchId } = await getOrCreateBatchForAdmin();
        
        userData = await createNewAdminUser(userDocId, firebaseUser.uid, email, batchId);
        isNewAdmin = true;
      }
    } else {
      // Normal login flow
      if (!userProfile.userData) {
        return NextResponse.json(
          { message: "User record not found", status: "error" },
          { status: 404 }
        );
      }
      
      userData = userProfile.userData;
      userDocId = userProfile.userDocId!;
      
      // Update authUid if found by email but authUid doesn't match
      if (userData.authUid !== firebaseUser.uid) {
        await updateDoc(doc(db, "user_profiles", userDocId), {
          authUid: firebaseUser.uid
        });
        userData.authUid = firebaseUser.uid;
      }
      
      // Check user status in batch
      const batchCheck = await checkUserInBatch(userData.batch_doc_id, userDocId);
      if (!batchCheck.isValid) {
        return NextResponse.json(
          { message: batchCheck.message, status: "error" },
          { status: batchCheck.message?.includes("not found") ? 404 : 403 }
        );
      }
    }
    
    // Get final user batch data for response
    const batchCheck = await checkUserInBatch(userData!.batch_doc_id, userDocId);
    
    if (!batchCheck.isValid || !batchCheck.userInBatch) {
      return NextResponse.json(
        { message: batchCheck.message || "User batch data not found", status: "error" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: isNewAdmin
        ? "Login successful. Admin privileges granted."
        : "Login successful",
      status: "success",
      user: {
        uid: userDocId,
        email: batchCheck.userInBatch.email,
        name: batchCheck.userInBatch.name || null,
        isAdmin: batchCheck.userInBatch.isAdmin || false,
        profile_picture: batchCheck.userInBatch.profile_picture || null,
        status: batchCheck.userInBatch.status || "active"
      },
      token: idToken
    });
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

    return NextResponse.json(
      { message: errorMessage, error: errorCode, status: "error" },
      { status: statusCode }
    );
  }
}

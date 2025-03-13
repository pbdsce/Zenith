import { db, auth } from "@/Firebase";
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { NextResponse } from "next/server";

const SECRET_CODE = "pbstruggles";

// Helper function to get or create a batch document for admin
const getOrCreateBatchForAdmin = async () => {
  const batchesRef = collection(db, "user_batches");
  const q = query(batchesRef, where("isAdminBatch", "==", true));
  const querySnapshot = await getDocs(q);
  
  let batchDoc;
  let batchId;
  
  if (!querySnapshot.empty) {
    // Use the first admin batch found
    batchId = querySnapshot.docs[0].id;
    batchDoc = querySnapshot.docs[0].data();
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
    
    let userCredential, firebaseUser, idToken, userData, isNewAdmin = false;
    let userDocId: string;
    
    if (isAdminAttempt) {
      // Admin login flow
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (authError: any) {
        if (
          authError.code === 'auth/invalid-credential' ||
          authError.code === 'auth/user-not-found'
        ) {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw authError;
        }
      }
      firebaseUser = userCredential.user;
      idToken = await firebaseUser.getIdToken();
      
      // First check in user_profiles by authUid
      const usersRef = collection(db, "user_profiles");
      const q = query(usersRef, where("authUid", "==", firebaseUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Admin user found by authUid in user_profiles
        userData = querySnapshot.docs[0].data();
        userDocId = querySnapshot.docs[0].id;
        
        // Get batch to check/update isAdmin status
        const batchRef = doc(db, "user_batches", userData.batch_doc_id);
        const batchSnap = await getDoc(batchRef);
        
        if (!batchSnap.exists()) {
          return NextResponse.json({ message: "User batch not found", status: "error" }, { status: 404 });
        }
        
        const batchData = batchSnap.data();
        const userIndex = batchData.users.findIndex((u: { uid: string }) => u.uid === userDocId);
        
        if (userIndex === -1) {
          return NextResponse.json({ message: "User not found in batch", status: "error" }, { status: 404 });
        }
        
        // Check user status in batch
        const userInBatch = batchData.users[userIndex];
        
        if (userInBatch.status === "suspended" || userInBatch.status === "deactivated") {
          return NextResponse.json(
            { message: "Account is " + userInBatch.status, status: "error" },
            { status: 403 }
          );
        }
        
        // Update isAdmin if needed
        if (!userInBatch.isAdmin) {
          const updatedUsers = [...batchData.users];
          updatedUsers[userIndex] = {
            ...userInBatch,
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
        
        // Get or create admin batch
        const { batchId } = await getOrCreateBatchForAdmin();
        
        // Create profile in user_profiles
        userData = {
          uid: userDocId,
          authUid: firebaseUser.uid,
          name: email.split('@')[0],
          email,
          phone: null,
          profile_picture: null,
          batch_doc_id: batchId,
          upvotedProfiles: [],
          upVote: 0,
          registration_time: new Date().toISOString(),
        };
        
        await setDoc(doc(db, "user_profiles", userDocId), userData);
        
        // Get the batch to add the admin user
        const batchRef = doc(db, "user_batches", batchId);
        const batchSnap = await getDoc(batchRef);
        
        if (batchSnap.exists()) {
          const batchData = batchSnap.data();
          const batchUsers = batchData.users || [];
          
          // Add admin to batch
          const adminBatchData = {
            uid: userDocId,
            authUid: firebaseUser.uid,
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
        
        isNewAdmin = true;
      }
    } else {
      // Normal login flow
      userCredential = await signInWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
      idToken = await firebaseUser.getIdToken();
      
      // Find user in user_profiles
      const usersRef = collection(db, "user_profiles");
      const q = query(usersRef, where("authUid", "==", firebaseUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Try fallback to email query
        const emailQuery = query(usersRef, where("email", "==", email));
        const emailQuerySnapshot = await getDocs(emailQuery);
        
        if (emailQuerySnapshot.empty) {
          return NextResponse.json(
            { message: "User record not found", status: "error" },
            { status: 404 }
          );
        } else {
          // Found by email, update authUid
          const userDoc = emailQuerySnapshot.docs[0];
          userData = userDoc.data();
          userDocId = userDoc.id;
          
          await updateDoc(doc(db, "user_profiles", userDoc.id), {
            authUid: firebaseUser.uid
          });
        }
      } else {
        userData = querySnapshot.docs[0].data();
        userDocId = querySnapshot.docs[0].id;
      }
      
      // Get user from batch to check status and isAdmin flag
      const batchRef = doc(db, "user_batches", userData.batch_doc_id);
      const batchSnap = await getDoc(batchRef);
      
      if (!batchSnap.exists()) {
        return NextResponse.json({ message: "User batch not found", status: "error" }, { status: 404 });
      }
      
      const batchData = batchSnap.data();
      const userInBatch = batchData.users.find((u: { uid: string }) => u.uid === userDocId);
      
      if (!userInBatch) {
        return NextResponse.json({ message: "User not found in batch", status: "error" }, { status: 404 });
      }
      
      if (userInBatch.status === "suspended" || userInBatch.status === "deactivated") {
        return NextResponse.json(
          { message: "Account is " + userInBatch.status, status: "error" },
          { status: 403 }
        );
      }
    }
    
    // Get full user info from batch for the response
    const batchRef = doc(db, "user_batches", userData.batch_doc_id);
    const batchSnap = await getDoc(batchRef);
    const batchData = batchSnap.data();
    
    if (!batchData) {
      return NextResponse.json({ message: "User batch data not found", status: "error" }, { status: 404 });
    }
    
    const userInBatch = batchData.users.find((u: { uid: string }) => u.uid === userDocId);
    
    return NextResponse.json({
      message: isNewAdmin
        ? "Login successful. Admin privileges granted."
        : "Login successful",
      status: "success",
      user: {
        uid: userDocId,
        email: userInBatch.email,
        name: userInBatch.name || null,
        isAdmin: userInBatch.isAdmin || false,
        profile_picture: userInBatch.profile_picture || null,
        status: userInBatch.status || "active"
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

import { db, auth } from "@/Firebase";
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { NextResponse } from "next/server";

const SECRET_CODE = "pbstruggles";

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
      
      const userRef = doc(db, "registrations", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        userData = {
          uid: firebaseUser.uid,
          email,
          name: email.split('@')[0],
          isAdmin: true,
          status: "active",
          registration_time: new Date().toISOString()
        };
        await setDoc(userRef, userData);
        isNewAdmin = true;
      } else {
        userData = userSnap.data();
        if (userData.status === "suspended" || userData.status === "deactivated") {
          return NextResponse.json(
            { message: "Account is " + userData.status, status: "error" },
            { status: 403 }
          );
        }
        if (!userData.isAdmin) {
          await updateDoc(userRef, { isAdmin: true });
          userData.isAdmin = true;
          isNewAdmin = true;
        }
      }
    } else {
      // Normal login flow
      userCredential = await signInWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
      idToken = await firebaseUser.getIdToken();
      
      // Changed: Query by authUid field instead of using document ID
      const usersRef = collection(db, "registrations");
      const q = query(usersRef, where("authUid", "==", firebaseUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return NextResponse.json(
          { message: "User record not found", status: "error" },
          { status: 404 }
        );
      }
      
      userData = querySnapshot.docs[0].data();
      if (userData.status === "suspended" || userData.status === "deactivated") {
        return NextResponse.json(
          { message: "Account is " + userData.status, status: "error" },
          { status: 403 }
        );
      }
    }
    
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

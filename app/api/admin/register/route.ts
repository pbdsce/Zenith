import { NextResponse } from "next/server";
import { auth } from "@/Firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/models/User";
import { getAuth } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password: string) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, adminCode } = body;

    const errors: Record<string, string> = {};

    if (!name?.trim() || name.length < 2 || name.length > 100) {
      errors.name = "Name is required (2-100 characters)";
    }

    if (!email?.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Invalid email format";
    }

    if (!password || !validatePassword(password)) {
      errors.password = "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character";
    }

    if (!adminCode?.trim()) {
      errors.adminCode = "Admin code is required";
    } else {
      const expectedAdminCode = process.env.ADMIN_CODE;
      if (!expectedAdminCode) {
        console.error("ADMIN_CODE environment variable is not set");
        return NextResponse.json(
          {
            success: false,
            message: "Server configuration error",
            error: { code: 'server_config_error', message: "Server configuration error" }
          },
          { status: 500 }
        );
      }
      if (adminCode.trim() !== expectedAdminCode) {
        errors.adminCode = "Invalid admin code";
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
          error: { code: 'email_exists', message: "Email already exists" }
        },
        { status: 409 }
      );
    }

    let firebaseUser;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
    } catch (firebaseError: any) {
      if (firebaseError.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          {
            success: false,
            message: "Email already exists",
            error: { code: 'email_exists', message: "Email already exists" }
          },
          { status: 409 }
        );
      }
      if (firebaseError.code === 'auth/weak-password') {
        return NextResponse.json(
          {
            success: false,
            message: "Password is too weak",
            error: { code: 'weak_password', message: "Password is too weak" }
          },
          { status: 400 }
        );
      }
      throw firebaseError;
    }

    const newUser = new User({
      uid: firebaseUser.uid,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: 'admin',
      isLooking: false,
      teamCode: undefined,
    });

    await newUser.save();

    try {
      await getAuth().setCustomUserClaims(firebaseUser.uid, { role: 'admin' });
    } catch (claimsError) {
      console.error('Failed to set custom claims:', claimsError);
    }

    return NextResponse.json({
      message: "Admin registration successful",
      uid: firebaseUser.uid,
      status: "success",
      user: {
        uid: firebaseUser.uid,
        email: newUser.email,
        name: newUser.name,
        isAdmin: true,
        profile_picture: null,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Admin registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Server error",
        error: {
          code: 'server_error',
          message: error instanceof Error ? error.message : "Server error",
          details: process.env.NODE_ENV === 'development' ? error : undefined
        }
      },
      { status: 500 }
    );
  }
}

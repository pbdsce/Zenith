import { NextResponse } from "next/server";
import { auth } from "@/Firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { cloudinaryV2 } from "@/c";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/models/User";

// Configure route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validation functions
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateDiscordUsername = (username: string) => username.length >= 2 && username.length <= 32;
const validatePhone = (phone: string) => /^\+?\d{1,4}[-\s]?\d{10}$/.test(phone);
const validateAge = (age: number) => age >= 13 && age <= 100;
const validatePassword = (password: string) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
};
const validateURL = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Upload base64 file to Cloudinary
async function uploadBase64ToCloudinary(base64Data: string, folder: string, resourceType: 'image' | 'raw'): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinaryV2.uploader.upload(
      base64Data,
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Helper to convert File to base64
    const fileToBase64 = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return `data:${file.type};base64,${buffer.toString('base64')}`;
    };

    // Extract fields
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const discord_username = formData.get('discord_username') as string;
    const phone = formData.get('phone') as string;
    const age = formData.get('age') as string;
    const organisation = formData.get('organisation') as string;
    const bio = formData.get('bio') as string;

    // Handle files
    const resumeFile = formData.get('resume') as File | null;
    const profilePicFile = formData.get('profile_picture') as File | null;

    let resume: string | undefined;
    if (resumeFile && resumeFile.size > 0) {
      resume = await fileToBase64(resumeFile);
    }

    let profile_picture: string | undefined;
    if (profilePicFile && profilePicFile.size > 0) {
      profile_picture = await fileToBase64(profilePicFile);
    }

    const leetcode_profile = formData.get('leetcode_profile') as string;
    const github_link = formData.get('github_link') as string;
    const linkedin_link = formData.get('linkedin_link') as string;
    const codeforces_link = formData.get('codeforces_link') as string;
    const kaggle_link = formData.get('kaggle_link') as string;
    const devfolio_link = formData.get('devfolio_link') as string;
    const portfolio_link = formData.get('portfolio_link') as string;
    const ctf_profile = formData.get('ctf_profile') as string;
    const isLooking = formData.get('isLooking') === 'true';

    // Validation
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

    if (!discord_username?.trim()) {
      errors.discord_username = "Discord username is required";
    } else if (!validateDiscordUsername(discord_username)) {
      errors.discord_username = "Invalid Discord username";
    }

    if (!phone?.trim()) {
      errors.phone = "Phone number is required";
    } else if (!validatePhone(phone)) {
      errors.phone = "Invalid phone format";
    }

    if (age === undefined || age === null) {
      errors.age = "Age is required";
    } else if (!validateAge(Number(age))) {
      errors.age = "Age must be between 13 and 100";
    }

    if (!organisation?.trim() || organisation.length < 2 || organisation.length > 200) {
      errors.organisation = "Organisation is required (2-200 characters)";
    }

    // Optional URL validations
    if (github_link && !validateURL(github_link)) {
      errors.github_link = "Invalid GitHub URL";
    }
    if (linkedin_link && !validateURL(linkedin_link)) {
      errors.linkedin_link = "Invalid LinkedIn URL";
    }
    if (leetcode_profile && !validateURL(leetcode_profile)) {
      errors.leetcode_profile = "Invalid LeetCode URL";
    }
    if (portfolio_link && !validateURL(portfolio_link)) {
      errors.portfolio_link = "Invalid portfolio URL";
    }

    if (Object.keys(errors).length > 0) {
      console.error("Registration validation errors:", errors);
      return NextResponse.json(
        { message: "Validation error", errors },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    // Check if discord username already exists
    const existingDiscord = await User.findOne({ discord_username });
    if (existingDiscord) {
      return NextResponse.json(
        { message: "Discord username already exists" },
        { status: 409 }
      );
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return NextResponse.json(
        { message: "Phone number already exists" },
        { status: 409 }
      );
    }

    // Create Firebase Auth user
    let firebaseUser;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(firebaseUser);
    } catch (firebaseError: any) {
      if (firebaseError.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 409 }
        );
      }
      if (firebaseError.code === 'auth/weak-password') {
        return NextResponse.json(
          { message: "Password is too weak" },
          { status: 400 }
        );
      }
      throw firebaseError;
    }

    // Upload files to Cloudinary if provided
    let resumeUrl: string | undefined;
    let profilePicUrl: string | undefined;

    if (resume) {
      try {
        resumeUrl = await uploadBase64ToCloudinary(resume, 'zenith/resumes', 'raw');
      } catch (uploadError) {
        console.error('Resume upload error:', uploadError);
        // Continue without resume
      }
    }

    if (profile_picture) {
      try {
        profilePicUrl = await uploadBase64ToCloudinary(profile_picture, 'zenith/profiles', 'image');
      } catch (uploadError) {
        console.error('Profile picture upload error:', uploadError);
        // Continue without profile picture
      }
    }

    // Create user in MongoDB
    const newUser = new User({
      uid: firebaseUser.uid,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      discord_username: discord_username.trim(),
      age: Number(age),
      organisation: organisation.trim(),
      bio: bio?.trim(),
      resume_link: resumeUrl,
      profile_picture: profilePicUrl,
      leetcode_profile: leetcode_profile?.trim(),
      github_link: github_link?.trim(),
      linkedin_link: linkedin_link?.trim(),
      codeforces_link: codeforces_link?.trim(),
      kaggle_link: kaggle_link?.trim(),
      devfolio_link: devfolio_link?.trim(),
      portfolio_link: portfolio_link?.trim(),
      ctf_profile: ctf_profile?.trim(),
      isLooking: Boolean(isLooking),
      role: 'user',
      teamCode: undefined,
    });

    await newUser.save();

    return NextResponse.json({
      message: "Registration successful",
      uid: firebaseUser.uid,
      status: "pending_verification",
      user: {
        uid: firebaseUser.uid,
        email: newUser.email,
        name: newUser.name,
        isAdmin: false,
        profile_picture: newUser.profile_picture || null,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

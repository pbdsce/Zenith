import { auth } from "@/Firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { NextResponse } from "next/server";
import { cloudinaryV2 } from "@/c";
import fs from 'fs';
import path from 'path';
import os from 'os';
import dbConnect from "@/lib/db";
import User from "@/models/User";

// Utility functions for format validation
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => /^\+?\d{1,4}[-\s]?\d{10}$/.test(phone);
const validateAge = (age: string) => {
  const ageNum = parseInt(age);
  return !isNaN(ageNum) && ageNum > 0 && ageNum < 120;
};
const validateURL = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    // Check for valid hostname (at least one dot and valid characters)
    if (!parsedUrl.hostname.includes('.') || !/^[a-zA-Z0-9.-]+$/.test(parsedUrl.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};
const validateReferralCode = (code: string) => {
  const validCodes = [
    "APNAADMI",
    "lallanbhaiyasexy", 
    "gandmeindamhaitohyecrackkarkedikha",
    "iAmJustAChillGuy",
    "SirLoodry"
  ];
  return validCodes.includes(code);
};
const validateBio = (bio: string) => bio.length <= 500; // 100 words ≈ 500 chars

// Configure route to disable body parser for file uploads
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // specify nodejs runtime
export const preferredRegion = 'auto'; // or specify regions if needed

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to upload file to Cloudinary
const uploadToCloudinary = async (filePath: string, folder: string, mimeType: string): Promise<string> => {
  // Choose the appropriate resource type based on mimetype
  const resourceType = mimeType.includes('pdf') ? 'raw' : 'auto';
  
  // Prepare upload options
  const uploadOptions: any = {
    folder: folder,
    resource_type: resourceType,
  };
  
  // For PDFs, add specific options to ensure proper rendering in browser
  if (mimeType.includes('pdf')) {
    uploadOptions.format = 'pdf';
    // Add the attachment flag to ensure proper download behavior
    uploadOptions.flags = 'attachment';
  }

  return new Promise((resolve, reject) => {
    cloudinaryV2.uploader.upload(
      filePath,
      uploadOptions,
      (error: any, result: any) => {
        if (error) reject(error);
        else {
          let url = result?.secure_url || '';
          
          // For PDFs, ensure URL format is correct
          if (mimeType.includes('pdf')) {
            // Check if URL needs correction
            if (url.includes('/image/upload/')) {
              // Replace image with raw for PDFs if needed
              url = url.replace('/image/upload/', '/raw/upload/');
            }
          }
          
          resolve(url);
        }
        
        // Clean up temp file
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Failed to delete temp file:", err);
        }
      }
    );
  });
};

// Parse multipart form data
const parseForm = async (req: Request): Promise<{ fields: any, files: any }> => {
  const formData = await req.formData();
  const fields: any = {};
  const files: any = {};
  
  // Get system temp directory
  const tempDir = os.tmpdir();
  
  // Process all form data
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      // Create a safe filename - replace spaces and special chars
      const safeFilename = value.name.replace(/[^a-zA-Z0-9.]/g, '_');
      
      // Save file to system temp directory with a unique name
      const tempFilePath = path.join(tempDir, `${Date.now()}_${safeFilename}`);
      
      // Get file content as ArrayBuffer 
      const arrayBuffer = await value.arrayBuffer();
      
      // Use fs.promises.writeFile which handles Buffer types better
      await fs.promises.writeFile(tempFilePath, new Uint8Array(arrayBuffer));
      
      files[key] = {
        filepath: tempFilePath,
        originalFilename: value.name,
        mimetype: value.type,
        size: value.size
      };
    } else {
      fields[key] = value;
    }
  }
  
  return { fields, files };
};


// Create user in Firebase Authentication
const createAuthUser = async (email: string, password: string): Promise<string> => {
  try {
    // Create the user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send email verification
    await sendEmailVerification(userCredential.user);
    
    // Return the Firebase Auth UID
    return userCredential.user.uid;
  } catch (error: any) {
    console.error("Firebase Auth error:", error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("Email is already in use with Firebase Authentication");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Invalid email format for Firebase Authentication");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Password is too weak. It should be at least 6 characters");
    }
    
    throw error;
  }
};

// Helper function to get or create a batch document
// TODO: Remove batch system - MongoDB doesn't need batching, create user directly
const getOrCreateBatchDocument = async () => {
  // TODO: With MongoDB, we don't need batches - users are stored directly in User collection
  // Return empty batchId since it's not needed with MongoDB
  return { batchId: "", batchDoc: null };
};

export async function POST(request: Request) {
  try {
    // Parse form data with files
    const { fields, files } = await parseForm(request);
    const data = { ...fields };
    const { recaptcha_token, password } = data;

    // Check if required resume file is present
    if (!files.resume) {
      return NextResponse.json(
        {
          message: "Resume file is required.",
          error: "Missing resume file",
        },
        { status: 400 }
      );
    }

    // Validate resume file is PDF
    const resumeFile = files.resume;
    if (!resumeFile.mimetype.includes('pdf')) {
      return NextResponse.json(
        {
          message: "Resume must be in PDF format.",
          error: "Invalid resume format",
        },
        { status: 400 }
      );
    }

    // Check file size limit (1MB = 1,048,576 bytes)
    if (resumeFile.size > 1 * 1024 * 1024) {
      return NextResponse.json(
        {
          message: "Resume file size must be under 1MB.",
          error: "File size limit exceeded",
        },
        { status: 413 }
      );
    }

    // Validate profile picture if provided (must be an image)
    let profilePictureUrl: string | null = null;
    if (files.profile_picture) {
      const profileFile = files.profile_picture;
      if (!profileFile.mimetype.includes('image')) {
        return NextResponse.json(
          {
            message: "Profile picture must be an image format.",
            error: "Invalid profile picture format",
          },
          { status: 400 }
        );
      }

      // Check file size limit (1MB = 1,048,576 bytes)
      if (profileFile.size > 1 * 1024 * 1024) {
        return NextResponse.json(
          {
            message: "Profile picture size must be under 1MB.",
            error: "File size limit exceeded",
          },
          { status: 413 }
        );
      }
      
      // Upload profile picture to Cloudinary
      try {
        profilePictureUrl = await uploadToCloudinary(
          profileFile.filepath,
          'profile_pictures',
          profileFile.mimetype
        );
      } catch (error) {
        console.error("Failed to upload profile picture:", error);
        return NextResponse.json(
          {
            message: "Failed to upload profile picture.",
            error: String(error),
          },
          { status: 500 }
        );
      }
    }

    // Upload resume to Cloudinary
    let resumeUrl: string;
    try {
      resumeUrl = await uploadToCloudinary(
        resumeFile.filepath,
        'resumes',
        resumeFile.mimetype
      );
    } catch (error) {
      console.error("Failed to upload resume:", error);
      return NextResponse.json(
        {
          message: "Failed to upload resume.",
          error: String(error),
        },
        { status: 500 }
      );
    }

    // Validate required fields
    if (
      !data.name ||
      !data.email ||
      !data.phone ||
      !data.linkedin_link||
      !data.github_link||
      !resumeUrl ||
      !password ||
      !data.bio ||
      !data.age ||
      !data.organisation
    ) {
      return NextResponse.json(
        {
          message: "Required information is missing.",
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Validate required fields format
    if (!validateEmail(data.email)) {
      return NextResponse.json(
        {
          message: "Invalid email format.",
          error: "Invalid email",
        },
        { status: 400 }
      );
    }

    if (!validatePhone(data.phone)) {
      return NextResponse.json(
        {
          message: "Invalid phone number format. It should be a 10-digit number starting with 6-9.",
          error: "Invalid phone",
        },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        {
          message: "Password must be at least 6 characters long.",
          error: "Weak password",
        },
        { status: 400 }
      );
    }

    // Validate optional fields if provided
    if (data.leetcode_profile && !validateURL(data.leetcode_profile)) {
      return NextResponse.json(
        {
          message: "Invalid LeetCode profile URL format.",
          error: "Invalid LeetCode profile",
        },
        { status: 400 }
      );
    }

    if (data.github_link && !validateURL(data.github_link)) {
      return NextResponse.json(
        {
          message: "Invalid GitHub profile URL format.",
          error: "Invalid GitHub profile",
        },
        { status: 400 }
      );
    }

    if (data.linkedin_link && !validateURL(data.linkedin_link)) {
      return NextResponse.json(
        {
          message: "Invalid LinkedIn profile URL format.",
          error: "Invalid LinkedIn profile",
        },
        { status: 400 }
      );
    }

    if (data.codeforces_link && !validateURL(data.codeforces_link)) {
      return NextResponse.json(
        {
          message: "Invalid Codeforces profile URL format.",
          error: "Invalid Codeforces profile",
        },
        { status: 400 }
      );
    }

    if (data.ctf_profile && !validateURL(data.ctf_profile)) {
      return NextResponse.json(
        {
          message: "Invalid CTF profile URL format.",
          error: "Invalid CTF profile",
        },
        { status: 400 }
      );
    }

    if (data.kaggle_link && !validateURL(data.kaggle_link)) {
      return NextResponse.json(
        {
          message: "Invalid Kaggle profile URL format.",
          error: "Invalid Kaggle profile",
        },
        { status: 400 }
      );
    }

    if (data.devfolio_link && !validateURL(data.devfolio_link)) {
      return NextResponse.json(
        {
          message: "Invalid Devfolio profile URL format.",
          error: "Invalid Devfolio profile",
        },
        { status: 400 }
      );
    }

    if (data.portfolio_link && !validateURL(data.portfolio_link)) {
      return NextResponse.json(
        {
          message: "Invalid Portfolio URL format.",
          error: "Invalid Portfolio link",
        },
        { status: 400 }
      );
    }

    if (!validateBio(data.bio)) {
      return NextResponse.json(
        {
          message: "Bio exceeds maximum length of 500 characters.",
          error: "Bio too long",
        },
        { status: 400 }
      );
    }

    if (!validateAge(data.age)) {
      return NextResponse.json(
        {
          message: "Invalid age value.",
          error: "Invalid age",
        },
        { status: 400 }
      );
    }

    if (!data.organisation || data.organisation.trim().length === 0) {
      return NextResponse.json(
        {
          message: "Organisation is required.",
          error: "Invalid organisation",
        },
        { status: 400 }
      );
    }

    if (data.referral_code && !validateReferralCode(data.referral_code)) {
      return NextResponse.json(
        {
          message: "Invalid referral code.",
          error: "Invalid referral code",
        },
        { status: 400 }
      );
    }


    await dbConnect();
    // Check for duplicate email registration
    const existingUserByEmail = await User.findOne({ email: data.email });
    if (existingUserByEmail) {
      return NextResponse.json({ 
        message: "Email is already registered!", 
        error: "Email is already registered!" 
      }, { status: 400 });
    }

    // Check for duplicate phone registration
    const existingUserByPhone = await User.findOne({ phone: String(data.phone) });
    if (existingUserByPhone) {
      return NextResponse.json({ 
        message: "Phone number is already registered!", 
        error: "Phone number is already registered!" 
      }, { status: 400 });
    }

    // Validate reCAPTCHA if token provided
    if (recaptcha_token) {
      const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

      // Verify reCAPTCHA token
      const recaptchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptcha_token}`,
        { method: "POST" }
      );
      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        return NextResponse.json(
          {
            message: "reCAPTCHA validation failed",
            error: recaptchaResult["error-codes"],
          },
          { status: 400 }
        );
      }
    }

    // Create user in Firebase Authentication
    let authUid: string;
    try {
      authUid = await createAuthUser(data.email, password);
    } catch (error: any) {
      return NextResponse.json(
        {
          message: error.message || "Authentication failed",
          error: String(error),
        },
        { status: 400 }
      );
    }

    const userData: any = {
      uid: authUid,
      name: data.name,
      email: data.email,
      phone: String(data.phone), // Store phone as string
      resume_link: resumeUrl,
      bio: data.bio,
      age: parseInt(data.age),
      organisation: data.organisation, 
      isLooking: false, // Default value
    };

    if (profilePictureUrl) {
      userData.profile_picture = profilePictureUrl;
    }
    if (data.leetcode_profile) {
      userData.leetcode_profile = data.leetcode_profile;
    }
    if (data.github_link) {
      userData.github_link = data.github_link;
    }
    if (data.linkedin_link) {
      userData.linkedin_link = data.linkedin_link;
    }
    if (data.codeforces_link) {
      userData.codeforces_link = data.codeforces_link;
    }
    if (data.ctf_profile) {
      userData.ctf_profile = data.ctf_profile;
    }
    if (data.kaggle_link) {
      userData.kaggle_link = data.kaggle_link;
    }
    if (data.devfolio_link) {
      userData.devfolio_link = data.devfolio_link;
    }
    if (data.portfolio_link) {
      userData.portfolio_link = data.portfolio_link;
    }

    const newUser = await new User(userData).save();
    const userId = newUser._id.toString();

    return NextResponse.json({ 
      message: "Registration successful", 
      id: userId, 
      uid: authUid,
      status: "pending_verification",
      // Include any token or auth information needed for subsequent requests
      // token: authUid,
      user: {
        id: userId,
        uid: authUid,
        email: data.email,
        name: data.name,
        isAdmin: false,
        profile_picture: profilePictureUrl || null
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { 
        message: "An error occurred during registration", 
        error: String(error),
        status: "error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint for frontend validation
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');

  if (!email && !phone) {
    return NextResponse.json(
      { 
        message: "Missing query parameters", 
        error: "Email or phone must be provided"
      },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    if (email) {
      const existingUser = await User.findOne({ email });
      return NextResponse.json({ 
        exists: !!existingUser,
        field: "email"
      });
    }
    
    if (phone) {
      const existingUser = await User.findOne({ phone: String(phone) });
      return NextResponse.json({ 
        exists: !!existingUser,
        field: "phone"
      });
    }
  } catch (error) {
    console.error("Check registration error:", error);
    return NextResponse.json(
      { message: "An error occurred", error: String(error) },
      { status: 500 }
    );
  }
}
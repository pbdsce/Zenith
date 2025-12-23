import { auth } from "@/Firebase";
// add mongodb imports
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { NextResponse } from "next/server";
import { cloudinaryV2 } from "@/c";
import fs from 'fs';
import path from 'path';
import os from 'os';

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

// Helper function to ensure college exists and increment counter
// TODO: Replace with MongoDB College collection operations
const ensureCollegeExists = async (collegeName: string): Promise<void> => {
  if (!collegeName) return;
  
  const collegeNameTrimmed = collegeName.trim();
  if (collegeNameTrimmed.length === 0) return;
  
  // TODO: Query MongoDB College collection:
  // - Find by name_lower (case-insensitive)
  // - If exists: increment count
  // - If not exists: create new college document
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
      !password
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

    if (data.competitive_profile && !validateURL(data.competitive_profile)) {
      return NextResponse.json(
        {
          message: "Invalid Competitive Programming profile URL format.",
          error: "Invalid CP profile",
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

    if (data.bio && !validateBio(data.bio)) {
      return NextResponse.json(
        {
          message: "Bio exceeds maximum length of 500 characters.",
          error: "Bio too long",
        },
        { status: 400 }
      );
    }

    if (data.age && !validateAge(data.age)) {
      return NextResponse.json(
        {
          message: "Invalid age value.",
          error: "Invalid age",
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

    // Validate competitive profiles (array of URLs)
    try {
      const competitiveProfiles = JSON.parse(data.competitive_profiles || '[]');
      for (const cpProfile of competitiveProfiles) {
        if (cpProfile && !validateURL(cpProfile)) {
          return NextResponse.json(
            {
              message: "Invalid Competitive Programming profile URL format.",
              error: "Invalid CP profile",
            },
            { status: 400 }
          );
        }
      }
    } catch (error) {
      return NextResponse.json(
        {
          message: "Invalid format for competitive profiles.",
          error: "Invalid CP profiles format",
        },
        { status: 400 }
      );
    }

    // Validate CTF profiles (array of URLs)
    try {
      const ctfProfiles = JSON.parse(data.ctf_profiles || '[]');
      for (const ctfProfile of ctfProfiles) {
        if (ctfProfile && !validateURL(ctfProfile)) {
          return NextResponse.json(
            {
              message: "Invalid CTF profile URL format.",
              error: "Invalid CTF profile",
            },
            { status: 400 }
          );
        }
      }
    } catch (error) {
      return NextResponse.json(
        {
          message: "Invalid format for CTF profiles.",
          error: "Invalid CTF profiles format",
        },
        { status: 400 }
      );
    }

    // Check for duplicate email registration
    // TODO: Query MongoDB User collection to check if email exists
    // const existingUserByEmail = await User.findOne({ email: data.email });
    // if (existingUserByEmail) {
    //   return NextResponse.json({ message: "Email is already registered!", error: "Email is already registered!" }, { status: 400 });
    // }

    // Check for duplicate phone registration
    // TODO: Query MongoDB User collection to check if phone exists
    // const existingUserByPhone = await User.findOne({ phone: data.phone });
    // if (existingUserByPhone) {
    //   return NextResponse.json({ message: "Phone number is already registered!", error: "Phone number is already registered!" }, { status: 400 });
    // }

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

    // If college name is provided, ensure it exists in the colleges collection
    if (data.college_name) {
      await ensureCollegeExists(data.college_name);
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

    // Create user in MongoDB
    // TODO: Replace Firestore transaction with MongoDB User.create()
    let profileId = '';
    
    // TODO: Create user document in MongoDB User collection:
    // const userData = {
    //   uid: profileId, // Generate or use MongoDB _id
    //   authUid: authUid,
    //   name: data.name,
    //   email: data.email,
    //   phone: data.phone,
    //   resume_link: resumeUrl,
    //   profile_picture: profilePictureUrl,
    //   leetcode_profile: data.leetcode_profile || null,
    //   github_link: data.github_link || null,
    //   linkedin_link: data.linkedin_link || null,
    //   competitive_profiles: data.competitive_profiles || null,
    //   ctf_profile: data.ctf_profile || null,
    //   kaggle_link: data.kaggle_link || null,
    //   devfolio_link: data.devfolio_link || null,
    //   portfolio_link: data.portfolio_link || null,
    //   bio: data.bio || null,
    //   age: data.age || null,
    //   college: data.college_name || null, // Note: field name changed from college_name
    //   isLooking: false, // Add required field
    //   registration_time: new Date().toISOString(),
    //   status: "pending",
    //   isAdmin: false,
    // };
    // const newUser = await User.create(userData);
    // profileId = newUser._id.toString();
    // });

    return NextResponse.json({ 
      message: "Registration successful", 
      id: profileId,
      authUid: authUid,
      status: "pending_verification",
      // Include any token or auth information needed for subsequent requests
      // token: authUid,
      user: {
        uid: profileId,
        authUid: authUid,
        email: data.email,
        name: data.name,
        isAdmin: false,
        profile_picture: profilePictureUrl
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
    if (email) {
      // TODO: Query MongoDB User collection to check if email exists
      // const existingUser = await User.findOne({ email });
      // return NextResponse.json({ exists: !!existingUser, field: "email" });
      
      return NextResponse.json({ 
        exists: false, // TODO: Replace with MongoDB query result
        field: "email"
      });
    }
    
    if (phone) {
      // TODO: Query MongoDB User collection to check if phone exists
      // const existingUser = await User.findOne({ phone });
      // return NextResponse.json({ exists: !!existingUser, field: "phone" });
      
      return NextResponse.json({ 
        exists: false, // TODO: Replace with MongoDB query result
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
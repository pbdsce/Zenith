import { db, auth } from "@/Firebase";
import { addDoc, collection, getDocs, query, where, runTransaction, doc, setDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { NextResponse } from "next/server";
import { cloudinary } from "@/Cloudinary";
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
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
const validateReferralCode = (code: string) => code === "APNAADMI";
const validateBio = (bio: string) => bio.length <= 500; // 100 words ≈ 500 chars

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure Cloudinary
cloudinary.config({
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
    cloudinary.uploader.upload(
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
const ensureCollegeExists = async (collegeName: string): Promise<void> => {
  if (!collegeName) return;
  
  const collegeNameTrimmed = collegeName.trim();
  if (collegeNameTrimmed.length === 0) return;
  
  // Check if college already exists
  const collegesRef = collection(db, "colleges");
  const collegeQuery = query(
    collegesRef, 
    where("name_lower", "==", collegeNameTrimmed.toLowerCase())
  );
  
  const querySnapshot = await getDocs(collegeQuery);
  
  if (!querySnapshot.empty) {
    // College exists, increment count
    const collegeDoc = querySnapshot.docs[0];
    const currentCount = collegeDoc.data().count || 0;
    
    await updateDoc(doc(db, "colleges", collegeDoc.id), {
      count: currentCount + 1
    });
  } else {
    // College doesn't exist, add it
    const newCollegeRef = doc(collection(db, "colleges"));
    await setDoc(newCollegeRef, {
      name: collegeNameTrimmed,
      name_lower: collegeNameTrimmed.toLowerCase(),
      count: 1,
      created_at: new Date().toISOString()
    });
  }
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
    let profilePictureUrl = null;
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
    let resumeUrl;
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

    // Check for duplicate email registration
    const emailQuery = query(
      collection(db, "registrations"),
      where("email", "==", data.email)
    );
    const emailQuerySnapshot = await getDocs(emailQuery);

    if (!emailQuerySnapshot.empty) {
      return NextResponse.json(
        {
          message: "Email is already registered!",
          error: "Email is already registered!",
        },
        { status: 400 }
      );
    }

    // Check for duplicate phone registration
    const phoneQuery = query(
      collection(db, "registrations"),
      where("phone", "==", data.phone)
    );
    const phoneQuerySnapshot = await getDocs(phoneQuery);

    if (!phoneQuerySnapshot.empty) {
      return NextResponse.json(
        {
          message: "Phone number is already registered!",
          error: "Phone number is already registered!",
        },
        { status: 400 }
      );
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

    // If college name is provided, ensure it exists in the colleges collection
    if (data.college_name) {
      await ensureCollegeExists(data.college_name);
    }

    // Create user in Firebase Authentication
    let authUid;
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

    // Use transaction to ensure data consistency
    let registrationId = '';
    
    await runTransaction(db, async (transaction) => {
      
      // Create a new registration document
      const registrationRef = doc(collection(db, "registrations"));
      registrationId = registrationRef.id;

      const registrationData = {
        uid: registrationId,
        authUid: authUid, // Store the Firebase Auth UID
        name: data.name,
        email: data.email,
        phone: data.phone,
        resume_link: resumeUrl,
        profile_picture: profilePictureUrl,
        leetcode_profile: data.leetcode_profile || null,
        github_link: data.github_link || null,
        linkedin_link: data.linkedin_link || null,
        competitive_profile: data.competitive_profile || null,
        ctf_profile: data.ctf_profile || null,
        kaggle_link: data.kaggle_link || null,
        devfolio_link: data.devfolio_link || null,
        portfolio_link: data.portfolio_link || null,
        bio: data.bio || null,
        age: data.age || null,
        college_name: data.college_name || null,
        referral_code: data.referral_code || null,
        registration_time: new Date().toISOString(),
        status: "pending", 
        isAdmin: false,
        upVote: 0 // Add upVote field with default value 0
      };
      
      // Set the registration data in the transaction
      transaction.set(registrationRef, registrationData);
    });

    return NextResponse.json({ 
      message: "Registration successful", 
      id: registrationId,
      authUid: authUid,
      status: "success",
      // Include any token or auth information needed for subsequent requests
      token: authUid, // You may want to use a proper JWT token system
      user: {
        uid: registrationId,
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
      const emailQuery = query(
        collection(db, "registrations"),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(emailQuery);
      
      return NextResponse.json({ 
        exists: !querySnapshot.empty,
        field: "email"
      });
    }
    
    if (phone) {
      const phoneQuery = query(
        collection(db, "registrations"),
        where("phone", "==", phone)
      );
      const querySnapshot = await getDocs(phoneQuery);
      
      return NextResponse.json({ 
        exists: !querySnapshot.empty,
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
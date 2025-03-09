import { db } from "@/Firebase";
import { addDoc, collection, getDocs, query, where, runTransaction, doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Utility functions for format validation
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => /^[6-9]\d{9}$/.test(phone);
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

// Function to upload file to Cloudinary
const uploadToCloudinary = async (filePath: string, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: folder,
        resource_type: 'auto', // Automatically detect file type
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || '');
        
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
      
      // Get file content as ArrayBuffer and write to disk
      const buffer = Buffer.from(await value.arrayBuffer());
      fs.writeFileSync(tempFilePath, buffer);
      
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

export async function POST(request: Request) {
  try {
    // Parse form data with files
    const { fields, files } = await parseForm(request);
    const data = { ...fields };
    const { recaptcha_token } = data;

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
      
      // Upload profile picture to Cloudinary
      try {
        profilePictureUrl = await uploadToCloudinary(
          profileFile.filepath,
          'profile_pictures'
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
        'resumes'
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
      !resumeUrl
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

    // Use transaction to ensure data consistency
    let registrationId = '';
    
    await runTransaction(db, async (transaction) => {
      // Prepare registration data
      const registrationData = {
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
        status: "PENDING", // You can use this for tracking status
        isAdmin: true
      };
      
      // Create a new registration document
      const registrationRef = doc(collection(db, "registrations"));
      registrationId = registrationRef.id;
      
      // Set the registration data in the transaction
      transaction.set(registrationRef, registrationData);
    });

    return NextResponse.json({ 
      message: "Registration successful", 
      id: registrationId,
      status: "success"
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
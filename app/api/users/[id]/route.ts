// add mongodb imports
import { NextResponse } from "next/server";
import { cloudinaryV2 } from "@/c";
import fs from 'fs';
import path from 'path';
import os from 'os';
import dbConnect from "@/lib/db";
import User from "@/models/User";

// Define types to prevent 'any' type errors
interface BatchUser {
  uid: string;
  authUid?: string;
  name: string;
  email: string;
  phone: string | null;
  resume_link?: string;
  profile_picture?: string | null;
  leetcode_profile?: string | null;
  github_link?: string | null;
  linkedin_link?: string | null;
  competitive_profile?: string | null;
  ctf_profile?: string | null;
  kaggle_link?: string | null;
  devfolio_link?: string | null;
  portfolio_link?: string | null;
  bio?: string | null;
  age?: number | null;
  college_name?: string | null;
  referral_code?: string | null;
  registration_time?: string;
  status?: string;
  isAdmin?: boolean;
  isDeleted?: boolean;
}

interface BatchDocument {
  id: string;
  users: BatchUser[];
  isAdminBatch?: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  uid: string;
  authUid: string;
  name: string;
  email: string;
  phone: string | null;
  profile_picture: string | null;
  batch_doc_id: string;
  registration_time: string;
  resume_link?: string; // Add this optional property
  isAdmin?: boolean; // Add isAdmin property
}

// Replace the deprecated config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // specify nodejs runtime
export const preferredRegion = 'auto'; // or specify regions if needed

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to extract public_id from Cloudinary URL
const extractPublicIdFromUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    // Extract the path from URL
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    
    // Remove /image/upload/ or /raw/upload/ part
    pathname = pathname.replace(/\/(image|raw)\/upload\//, '');
    
    // Extract file path without extension
    const publicId = pathname.substring(0, pathname.lastIndexOf('.'));
    
    return publicId;
  } catch (error) {
    console.error("Failed to extract public ID from URL:", error);
    return '';
  }
};

// Function to delete file from Cloudinary
const deleteFromCloudinary = async (url: string, resourceType: string = 'image'): Promise<boolean> => {
  if (!url) return true;
  
  const publicId = extractPublicIdFromUrl(url);
  
  if (!publicId) return false;
  
  return new Promise((resolve) => {
    cloudinaryV2.uploader.destroy(
      publicId,
      { resource_type: resourceType },
      (error: Error | null, result: any) => {
        if (error || result.result !== 'ok') {
          console.error("Failed to delete from Cloudinary:", error || result);
          resolve(false);
        } else {
          console.log("Successfully deleted from Cloudinary:", publicId);
          resolve(true);
        }
      }
    );
  });
};

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
const parseForm = async (req: Request): Promise<{ fields: Record<string, any>, files: Record<string, any> }> => {
  const formData = await req.formData();
  const fields: Record<string, any> = {};
  const files: Record<string, any> = {};
  
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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    let user = await User.findById(params.id);
    
    if (!user && params.id.includes('@')) {
      user = await User.findOne({ email: params.id });
    }
    
    if (!user) {
      return NextResponse.json({ 
        message: "User not found", 
        status: "error" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      uid: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      resume_link: user.resume_link || null,
      profile_picture: user.profile_picture || null,
      leetcode_profile: user.leetcode_profile || null,
      github_link: user.github_link || null,
      linkedin_link: user.linkedin_link || null,
      codeforces_link: user.codeforces_link || null,
      kaggle_link: user.kaggle_link || null,
      devfolio_link: user.devfolio_link || null,
      portfolio_link: user.portfolio_link || null,
      ctf_profile: user.ctf_profile || null,
      bio: user.bio || null,
      age: user.age || null,
      organisation: user.organisation || null,
      isLooking: user.isLooking,
      role: user.role,
      status: "success" 
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ 
      message: "Failed to fetch user", 
      error: String(error), 
      status: "error" 
    }, { status: 500 });
  }
}

// Helper function to manage college changes
// TODO: Replace with MongoDB College collection operations
const handleCollegeChange = async (oldCollege: string | null, newCollege: string): Promise<void> => {
  if (!newCollege || (oldCollege && oldCollege.toLowerCase() === newCollege.toLowerCase())) {
    // No change or no college provided
    return;
  }

  const newCollegeTrimmed = newCollege.trim();
  if (newCollegeTrimmed.length === 0) return;

  // TODO: Query MongoDB College collection:
  // - Find by name_lower (case-insensitive)
  // - If exists: increment count
  // - If not exists: create new college document
  // - If oldCollege exists: decrement its count
};

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    // Parse form data with files
    const { fields, files } = await parseForm(req);
    const updates: Record<string, any> = { ...fields };
    
    // Check if name update is attempted (not allowed)
    if (updates.name) {
      return NextResponse.json({ message: "Name cannot be updated", status: "error" }, { status: 400 });
    }
    
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    }
    
    // Handle college name update if provided
    // TODO: Get current college from user document
    // if (updates.college_name && updates.college_name !== user.college) {
    //   await handleCollegeChange(user.college || null, updates.college_name.toString());
    // }    
    // Handle resume update if provided
    if (files.resume) {
      const resumeFile = files.resume;
      
      // Validate resume file is PDF
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
      
      // Delete old resume from Cloudinary if it exists
      if (user.resume_link) {
        await deleteFromCloudinary(user.resume_link, 'raw');
      }
      
      // Upload new resume to Cloudinary
      try {
        const resumeUrl = await uploadToCloudinary(
          resumeFile.filepath,
          'resumes',
          resumeFile.mimetype
        );
        
        // Add resume URL to updates
        updates.resume_link = resumeUrl;
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
    }
    
    // Handle profile picture update if provided
    if (files.profile_picture) {
      const profileFile = files.profile_picture;
      
      // Validate profile picture is an image
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

      // Delete old profile picture from Cloudinary if it exists
      if (user.profile_picture) {
        await deleteFromCloudinary(user.profile_picture, 'image');
      }

      // Upload new profile picture to Cloudinary
      try {
        const profilePictureUrl = await uploadToCloudinary(
          profileFile.filepath,
          'profile_pictures',
          profileFile.mimetype
        );
        
        // Add profile picture URL to updates
        updates.profile_picture = profilePictureUrl;
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
    
    Object.assign(user, updates);
    const updatedUser = await user.save();
    
    return NextResponse.json({ 
      message: "User updated successfully",
      uid: updatedUser._id,
      status: "success" 
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ 
      message: "Failed to update user", 
      error: String(error), 
      status: "error" 
    }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ message: "Unauthorized: Missing UID", status: "error" }, { status: 401 });
    }
    
    const adminUser = await User.findById(uid);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ message: "Unauthorized: Not an admin", status: "error" }, { status: 403 });
    }
    const targetUser = await User.findById(params.id);
    if (!targetUser) {
      return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    }
    
    await User.findByIdAndDelete(params.id);
    
    return NextResponse.json({ 
      message: "User deleted successfully", 
      uid: params.id,
      status: "success" 
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ 
      message: "Failed to delete user", 
      error: String(error), 
      status: "error" 
    }, { status: 500 });
  }
}
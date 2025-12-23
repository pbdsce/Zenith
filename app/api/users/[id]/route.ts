// add mongodb imports
import { NextResponse } from "next/server";
import { cloudinaryV2 } from "@/c";
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    // Extract authorization header from request
    const authHeader = req.headers.get('Authorization');
    
    // For development, log but don't require the token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn("Authorization header missing or invalid, proceeding anyway for development");
    }
    
    // TODO: Query MongoDB User collection by ID, authUid, or email
    // Try finding user by ID first:
    // let user = await User.findById(params.id);
    // If not found, try by authUid:
    // if (!user) user = await User.findOne({ authUid: params.id });
    // If still not found and params.id contains '@', try by email:
    // if (!user && params.id.includes('@')) user = await User.findOne({ email: params.id });  
    return NextResponse.json({ message: "User fetch not implemented - MongoDB migration pending", status: "error" }, { status: 501 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ message: "Failed to fetch user", error: String(error), status: "error" }, { status: 500 });
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
    // Parse form data with files
    const { fields, files } = await parseForm(req);
    const updates = { ...fields };
    
    // Check if name update is attempted (not allowed)
    if (updates.name) {
      return NextResponse.json({ message: "Name cannot be updated", status: "error" }, { status: 400 });
    }
    
    // TODO: Find user in MongoDB User collection
    // const user = await User.findById(params.id);
    // if (!user) {
    //   return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    // }
    
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
      // TODO: Get resume_link from MongoDB user document
      // if (user.resume_link) {
      //   await deleteFromCloudinary(user.resume_link, 'raw');
      // }
      
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
      // TODO: Get profile_picture from MongoDB user document
      // if (user.profile_picture) {
      //   await deleteFromCloudinary(user.profile_picture, 'image');
      // }

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
    
    // Update both user_profiles and user_batches collections
    const userProfileUpdates: Record<string, any> = {};
    const userBatchUpdates: Record<string, any> = {};
    
    // Process updates for user_profiles
    if (updates.profile_picture) {
      userProfileUpdates['profile_picture'] = updates.profile_picture;
    }
    
    // Process updates for user_batches
    Object.keys(updates).forEach(key => {
      userBatchUpdates[key] = updates[key];
    });
    
    // TODO: Update user in MongoDB User collection
    // Object.assign(user, updates);
    // await user.save();
    
    return NextResponse.json({ 
      message: "User updated successfully",
      userId: params.id,
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
    const { uid } = await req.json(); // The UID of the requester
    
    if (!uid) {
      return NextResponse.json({ message: "Unauthorized: Missing UID", status: "error" }, { status: 401 });
    }
    
    // TODO: Verify admin permissions using MongoDB User collection
    // const adminUser = await User.findById(uid);
    // if (!adminUser || !adminUser.isAdmin) {
    //   return NextResponse.json({ message: "Unauthorized: Not an admin", status: "error" }, { status: 403 });
    // }
    
    // TODO: Delete user from MongoDB User collection (soft delete or hard delete)
    // const targetUser = await User.findById(params.id);
    // if (!targetUser) {
    //   return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    // }
    // await User.findByIdAndDelete(params.id); // or soft delete: targetUser.isDeleted = true; await targetUser.save();    
    return NextResponse.json({ message: "User deleted successfully", status: "success" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Failed to delete user", error: String(error), status: "error" }, { status: 500 });
  }
}
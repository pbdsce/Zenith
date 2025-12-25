import { NextResponse } from "next/server";
import { cloudinaryV2 } from "@/c";
import fs from 'fs';
import path from 'path';
import os from 'os';
import dbConnect from "@/lib/db";
import User from "@/models/User";
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
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    pathname = pathname.replace(/\/(image|raw)\/upload\//, '');
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
  const resourceType = mimeType.includes('pdf') ? 'raw' : 'auto';
  
  const uploadOptions: any = {
    folder: folder,
    resource_type: resourceType,
  };
  
  if (mimeType.includes('pdf')) {
    uploadOptions.format = 'pdf';
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
          
          if (mimeType.includes('pdf')) {
            if (url.includes('/image/upload/')) {
              url = url.replace('/image/upload/', '/raw/upload/');
            }
          }
          
          resolve(url);
        }
        
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
  
  const tempDir = os.tmpdir();
  
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const safeFilename = value.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const tempFilePath = path.join(tempDir, `${Date.now()}_${safeFilename}`);
      const arrayBuffer = await value.arrayBuffer();
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
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn("Authorization header missing or invalid, proceeding anyway for development");
    }
    
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
      message: "User found",
      status: "success",
      user: {
        uid: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        profile_picture: user.profile_picture || null,
        resume_link: user.resume_link || null,
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
        isAdmin: user.role === 'admin'
      }
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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { fields, files } = await parseForm(req);
    const updates: Record<string, any> = { ...fields };
    
    // Check if name update is attempted (not allowed)
    if (updates.name) {
      return NextResponse.json({ 
        message: "Name cannot be updated", 
        status: "error" 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    // Find user by MongoDB _id (Firebase UID)
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ 
        message: "User not found", 
        status: "error" 
      }, { status: 404 });
    }
    
    // Handle resume update if provided
    if (files.resume) {
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
      
      if (!profileFile.mimetype.includes('image')) {
        return NextResponse.json(
          {
            message: "Profile picture must be an image format.",
            error: "Invalid profile picture format",
          },
          { status: 400 }
        );
      }

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
    
    const allowedFields = [
      'phone', 'bio', 'age', 'organisation', 'resume_link', 'profile_picture',
      'leetcode_profile', 'github_link', 'linkedin_link', 'codeforces_link',
      'kaggle_link', 'devfolio_link', 'portfolio_link', 'ctf_profile', 'isLooking'
    ];
    
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'age' && updates[field]) {
          updateData[field] = parseInt(updates[field]);
        } else if (field === 'isLooking') {
          updateData[field] = updates[field] === 'true' || updates[field] === true;
        } else {
          updateData[field] = updates[field];
        }
      }
    }
    
    await User.findByIdAndUpdate(params.id, updateData, { new: true });
    
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
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ 
        message: "Unauthorized: Missing UID", 
        status: "error" 
      }, { status: 401 });
    }
    
    await dbConnect();
    
    const adminUser = await User.findById(uid);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ 
        message: "Unauthorized: Not an admin", 
        status: "error" 
      }, { status: 403 });
    }
    const targetUser = await User.findById(params.id);
    if (!targetUser) {
      return NextResponse.json({ 
        message: "User not found", 
        status: "error" 
      }, { status: 404 });
    }
    
    await User.findByIdAndDelete(params.id);
    
    return NextResponse.json({ 
      message: "User deleted successfully", 
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
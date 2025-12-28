import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, isAuthError } from "@/lib/middleware/auth";
import { cloudinaryV2 } from "@/c";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// Configure route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper to create success response
function createSuccessResponse(message: string, data: any, status = 200) {
  return NextResponse.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }, { status });
}

// Helper to create error response
function createErrorResponse(message: string, code: string, status: number, details?: string) {
  return NextResponse.json({
    success: false,
    message,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  }, { status });
}

// Upload base64 file to Cloudinary
async function uploadBase64ToCloudinary(base64Data: string, folder: string, resourceType: 'image' | 'raw'): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinaryV2.uploader.upload(
      base64Data,
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
  });
}

// Extract public ID from Cloudinary URL for deletion
function extractPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Delete file from Cloudinary
async function deleteFromCloudinary(url: string, resourceType: string = 'image'): Promise<boolean> {
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) return false;
  
  try {
    await cloudinaryV2.uploader.destroy(publicId, { resource_type: resourceType });
    return true;
  } catch {
    return false;
  }
}

/**
 * GET /api/user/profile
 * Get authenticated user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error.message },
        { status: authResult.status }
      );
    }

    await dbConnect();
    const user = await User.findOne({ uid: authResult.user.uid }).select('-__v');

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      uid: user.uid,
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
      role: user.role,
      isLooking: user.isLooking,
      teamCode: user.teamCode || null,
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update authenticated user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error.message },
        { status: authResult.status }
      );
    }

    const body = await request.json();

    // Fields that can be updated
    const {
      name,
      bio,
      phone,
      organisation,
      age,
      resume, // base64 encoded PDF
      profile_picture, // base64 encoded image
      github_link,
      linkedin_link,
      leetcode_profile,
      codeforces_link,
      kaggle_link,
      devfolio_link,
      portfolio_link,
      ctf_profile,
      isLooking,
    } = body;

    await dbConnect();
    const user = await User.findOne({ uid: authResult.user.uid });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (organisation !== undefined) updateData.organisation = organisation.trim();
    if (age !== undefined) updateData.age = Number(age);
    if (github_link !== undefined) updateData.github_link = github_link?.trim() || null;
    if (linkedin_link !== undefined) updateData.linkedin_link = linkedin_link?.trim() || null;
    if (leetcode_profile !== undefined) updateData.leetcode_profile = leetcode_profile?.trim() || null;
    if (codeforces_link !== undefined) updateData.codeforces_link = codeforces_link?.trim() || null;
    if (kaggle_link !== undefined) updateData.kaggle_link = kaggle_link?.trim() || null;
    if (devfolio_link !== undefined) updateData.devfolio_link = devfolio_link?.trim() || null;
    if (portfolio_link !== undefined) updateData.portfolio_link = portfolio_link?.trim() || null;
    if (ctf_profile !== undefined) updateData.ctf_profile = ctf_profile?.trim() || null;
    if (isLooking !== undefined) updateData.isLooking = Boolean(isLooking);

    // Handle file uploads
    if (resume) {
      try {
        // Delete old resume if exists
        if (user.resume_link) {
          await deleteFromCloudinary(user.resume_link, 'raw');
        }
        updateData.resume_link = await uploadBase64ToCloudinary(resume, 'zenith/resumes', 'raw');
      } catch (uploadError) {
        console.error('Resume upload error:', uploadError);
      }
    }

    if (profile_picture) {
      try {
        // Delete old profile picture if exists
        if (user.profile_picture) {
          await deleteFromCloudinary(user.profile_picture, 'image');
        }
        updateData.profile_picture = await uploadBase64ToCloudinary(profile_picture, 'zenith/profiles', 'image');
      } catch (uploadError) {
        console.error('Profile picture upload error:', uploadError);
      }
    }

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { uid: authResult.user.uid },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "User updated successfully",
      id: updatedUser._id.toString(),
      uid: updatedUser.uid,
      status: "success"
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

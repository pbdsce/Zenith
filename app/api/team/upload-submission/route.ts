import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import { cloudinaryV2 } from "@/c";
import dbConnect from "@/lib/db";
import Team from "@/models/Team";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validate YouTube URL
function isValidYouTubeURL(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
  ];
  return patterns.some(pattern => pattern.test(url));
}

async function uploadToCloudinary(filePath: string, folder: string, mimetype: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinaryV2.uploader.upload(
      filePath,
      {
        folder,
        resource_type: 'raw',
        use_filename: true,
        unique_filename: true,
      },
      (error: any, result: any) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
  });
}
async function parseForm(req: Request): Promise<{ fields: Record<string, any>, files: Record<string, any> }> {
  const formData = await req.formData();
  const fields: Record<string, any> = {};
  const files: Record<string, any> = {};
  
  const tempDir = os.tmpdir();
  
  for (const [key, value] of formData.entries()) {
    const isFile = typeof value === 'object' && 
                   value !== null && 
                   typeof (value as any).name === 'string' && 
                   typeof (value as any).arrayBuffer === 'function' &&
                   typeof (value as any).type === 'string';
    
    if (isFile) {
      const file = value as any;
      const safeFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const tempFilePath = path.join(tempDir, `${Date.now()}_${safeFilename}`);
      const arrayBuffer = await file.arrayBuffer();
      await fs.promises.writeFile(tempFilePath, new Uint8Array(arrayBuffer));
      
      files[key] = {
        filepath: tempFilePath,
        originalFilename: file.name,
        mimetype: file.type,
        size: file.size
      };
    } else {
      fields[key] = value;
    }
  }
  
  return { fields, files };
}

/**
 * POST /api/team/upload-submission
 * Upload video pitch and PDF submission (team lead only)
 */
export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error.message },
        { status: authResult.status }
      );
    }

    const emailError = requireEmailVerified(authResult);
    if (emailError) {
      return createAuthErrorResponse(emailError);
    }

    // Check if submission deadline has passed (Extended)
    const SUBMISSION_DEADLINE = new Date('2026-01-21T10:00:00+05:30');
    if (new Date() > SUBMISSION_DEADLINE) {
      return NextResponse.json(
        { message: "Submissions are closed. No new submissions are being accepted." },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const { fields, files } = await parseForm(request);
    const { teamCode, videoURL, anyOtherLink } = fields;
    const submissionPDF = files.submissionPDF;

    if (!teamCode) {
      return NextResponse.json(
        { message: "Team code is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const team = await Team.findOne({ teamCode });
    if (!team) {
      return NextResponse.json(
        { message: "Team not found" },
        { status: 404 }
      );
    }

    // Check if user is team lead
    if (team.teamLead !== authResult.user.uid) {
      return NextResponse.json(
        { message: "User is not team lead" },
        { status: 403 }
      );
    }

    if (team.teamStatus === 'submitted' || team.teamStatus === 'shortlisted' || team.teamStatus === 'rsvped') {
      return NextResponse.json(
        { message: "Team must not have submitted yet" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {};

    // Validate and set video URL
    if (videoURL) {
      if (!isValidYouTubeURL(videoURL)) {
        return NextResponse.json(
          { message: "Invalid YouTube URL format" },
          { status: 400 }
        );
      }
      updateData.videoURL = videoURL;
    }

    // Upload PDF if provided
    if (submissionPDF) {
      if (!submissionPDF.mimetype.includes('pdf')) {
        return NextResponse.json(
          { message: "Submission must be a PDF file" },
          { status: 400 }
        );
      }

      const maxSize = 4.5 * 1024 * 1024;
      if (submissionPDF.size > maxSize) {
        return NextResponse.json(
          { message: "PDF file size must be under 4.5MB" },
          { status: 400 }
        );
      }

      tempFilePath = submissionPDF.filepath;
      try {
        updateData.submissionPDF = await uploadToCloudinary(
          submissionPDF.filepath,
          'zenith/submissions',
          submissionPDF.mimetype
        );
      } catch (uploadError) {
        console.error('PDF upload error:', uploadError);
        return NextResponse.json(
          { message: "Failed to upload PDF" },
          { status: 500 }
        );
      }
    }

    // Set any other link
    if (anyOtherLink) {
      updateData.anyOtherLink = anyOtherLink;
    }

    // Update team
    const updatedTeam = await Team.findOneAndUpdate(
      { teamCode },
      { $set: updateData },
      { new: true }
    );

    if (!updatedTeam) {
      return NextResponse.json(
        { message: "Failed to update team" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission uploaded successfully",
      data: {
        teamCode: updatedTeam.teamCode,
        videoURL: updatedTeam.videoURL || null,
        submissionPDF: updatedTeam.submissionPDF || null,
        anyOtherLink: updatedTeam.anyOtherLink || null,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Upload submission error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError);
      }
    }
  }
}

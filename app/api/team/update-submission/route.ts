import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthErrorResponse, requireEmailVerified } from "@/lib/middleware/auth";
import { cloudinaryV2 } from "@/c";
import dbConnect from "@/lib/db";
import Team from "@/models/Team";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function isValidYouTubeURL(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
  ];
  return patterns.some(pattern => pattern.test(url));
}

async function uploadBase64ToCloudinary(base64Data: string, folder: string, resourceType: 'raw'): Promise<string> {
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

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { teamCode, videoURL, submissionPDF, anyOtherLink } = body;

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

    if (team.teamLead !== authResult.user.uid) {
      return NextResponse.json(
        { message: "User is not team lead" },
        { status: 403 }
      );
    }

    if (team.teamStatus !== 'submitted') {
      return NextResponse.json(
        { message: "Invalid status for update" },
        { status: 400 }
      );
    }

    if (team.isEvaluated) {
      return NextResponse.json(
        { message: "Team already evaluated" },
        { status: 403 }
      );
    }

    const SUBMISSION_DEADLINE = new Date('2026-01-21T00:00:00+05:30');
    
    if (new Date() > SUBMISSION_DEADLINE) {
      return NextResponse.json(
        {
          message: "Submissions are closed. No updates allowed.",
          error: {
            code: 'DEADLINE_PASSED',
            message: 'Submissions are closed. No updates allowed.',
            deadline: SUBMISSION_DEADLINE.toISOString()
          }
        },
        { status: 403 }
      );
    }

    const updateData: Record<string, any> = {};

    if (videoURL !== undefined) {
      if (videoURL && !isValidYouTubeURL(videoURL)) {
        return NextResponse.json(
          { message: "Invalid YouTube URL format" },
          { status: 400 }
        );
      }
      updateData.videoURL = videoURL || null;
    }

    if (submissionPDF) {
      try {
        updateData.submissionPDF = await uploadBase64ToCloudinary(
          submissionPDF,
          'zenith/submissions',
          'raw'
        );
      } catch (uploadError) {
        console.error('PDF upload error:', uploadError);
        return NextResponse.json(
          { message: "Failed to upload PDF" },
          { status: 500 }
        );
      }
    }

    if (anyOtherLink !== undefined) {
      updateData.anyOtherLink = anyOtherLink || null;
    }
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
      message: "Submission updated successfully",
      data: {
        teamCode: updatedTeam.teamCode,
        updatedAt: updatedTeam.updatedAt || new Date().toISOString(),
        deadline: SUBMISSION_DEADLINE.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Update submission error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

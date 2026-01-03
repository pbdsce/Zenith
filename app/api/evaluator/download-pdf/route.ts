import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, requireEvaluator, createAuthErrorResponse } from "@/lib/middleware/auth";
import { cloudinaryV2 } from "@/c";
import dbConnect from "@/lib/db";
import Team from "@/models/Team";
import Evaluator from "@/models/Evaluator";

export const dynamic = 'force-dynamic';

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function extractPublicIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    const match = pathname.match(/\/(?:raw|image)\/upload\/v\d+\/(.+)/);
    if (match && match[1]) {
      const publicId = match[1].replace(/\.(pdf|jpg|jpeg|png|gif)$/i, '');
      return publicId;
    }
    
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      return lastPart.replace(/\.(pdf|jpg|jpeg|png|gif)$/i, '');
    }
    
    return null;
  } catch (error) {
    console.error("Failed to extract public ID from URL:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult);
    }

    const evaluatorCheck = requireEvaluator(authResult);
    if (evaluatorCheck) {
      return createAuthErrorResponse(evaluatorCheck);
    }

    const { searchParams } = new URL(request.url);
    const teamCode = searchParams.get('teamCode');
    const pdfUrl = searchParams.get('url');

    if (!teamCode && !pdfUrl) {
      return NextResponse.json(
        { success: false, message: "Team code or PDF URL is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    if (teamCode) {
      const evaluator = await Evaluator.findOne({ uid: authResult.user.uid });
      if (!evaluator) {
        return NextResponse.json(
          { success: false, message: "Evaluator not found" },
          { status: 404 }
        );
      }

      const assignment = evaluator.assignedTeams.find(
        (t: any) => t.teamCode === teamCode
      );
      if (!assignment) {
        return NextResponse.json(
          { success: false, message: "You are not assigned to this team" },
          { status: 403 }
        );
      }

      const team = await Team.findOne({ teamCode });
      if (!team || !team.submissionPDF) {
        return NextResponse.json(
          { success: false, message: "Team or submission PDF not found" },
          { status: 404 }
        );
      }

      const finalUrl = team.submissionPDF;
      const publicId = extractPublicIdFromUrl(finalUrl);
      if (publicId) {
        console.log(`Extracted public ID: ${publicId}`);
        console.log(`Original URL: ${finalUrl}`);
        
        try {
          await new Promise<void>((resolve, reject) => {
            cloudinaryV2.api.resource(
              publicId,
              { resource_type: 'raw' },
              (error: any, result: any) => {
                if (error) {
                  console.warn(`Cloudinary API resource error:`, {
                    message: error.message,
                    http_code: error.http_code
                  });
                  resolve();
                } else {
                  resolve();
                }
              }
            );
          });
        } catch (error: any) {
          console.warn(`Error verifying resource in Cloudinary:`, error?.message || error);
        }
      }
      return NextResponse.json({
        success: true,
        url: finalUrl,
        message: "PDF URL retrieved successfully"
      });
    }
    if (pdfUrl) {
      if (!pdfUrl.includes('cloudinary.com')) {
        return NextResponse.json(
          { success: false, message: "Invalid PDF URL" },
          { status: 400 }
        );
      }

      const publicId = extractPublicIdFromUrl(pdfUrl);
      if (publicId) {
        try {
          await new Promise<void>((resolve, reject) => {
            cloudinaryV2.api.resource(
              publicId,
              { resource_type: 'raw' },
              (error: any, result: any) => {
                if (error) {
                  console.warn(`Cloudinary API resource error:`, {
                    message: error.message,
                    http_code: error.http_code
                  });
                  resolve();
                } else {
                  resolve();
                }
              }
            );
          });
        } catch (error: any) {
          console.warn(`Error verifying resource:`, error?.message || error);
        }
      }

      return NextResponse.json({
        success: true,
        url: pdfUrl,
        message: "PDF URL retrieved successfully"
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Download PDF error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to download PDF",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

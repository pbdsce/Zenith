import { db } from "@/Firebase";
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import { cloudinary } from "@/Cloudinary";
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
  upVote?: number;
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
  upvotedProfiles: string[];
  upVote: number;
  registration_time: string;
  resume_link?: string; // Add this optional property
}

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
    cloudinary.uploader.destroy(
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
    
    // Try finding user in user_profiles by ID
    const userRef = doc(db, "user_profiles", params.id);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      
      // Get batch document to get full user details
      const batchRef = doc(db, "user_batches", userData.batch_doc_id);
      const batchSnap = await getDoc(batchRef);
      
      if (!batchSnap.exists()) {
        return NextResponse.json({ message: "User batch not found", status: "error" }, { status: 404 });
      }
      
      const batchData = batchSnap.data() as BatchDocument;
      const userInBatch = batchData.users.find((u: BatchUser) => u.uid === params.id);
      
      if (!userInBatch) {
        return NextResponse.json({ message: "User data not found in batch", status: "error" }, { status: 404 });
      }
      
      // Combine data from both collections
      const user = {
        uid: params.id,
        authUid: userData.authUid,
        email: userInBatch.email,
        name: userInBatch.name,
        isAdmin: userInBatch.isAdmin || false,
        profile_picture: userInBatch.profile_picture || null,
        status: userInBatch.status || "active",
        college_name: userInBatch.college_name || null,
        bio: userInBatch.bio || null,
        github_link: userInBatch.github_link || null,
        linkedin_link: userInBatch.linkedin_link || null,
        portfolio_link: userInBatch.portfolio_link || null,
        resume_link: userInBatch.resume_link || null,
        upVote: userInBatch.upVote || 0,
        upvotedProfiles: userData.upvotedProfiles || [],
      };

      return NextResponse.json({ user, status: "success" });
    } else {
      // Try finding by authUid in user_profiles
      const usersRef = collection(db, "user_profiles");
      const q = query(usersRef, where("authUid", "==", params.id));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Try finding by email
        if (params.id.includes('@')) {
          const emailQuery = query(usersRef, where("email", "==", params.id));
          const emailSnapshot = await getDocs(emailQuery);
          
          if (emailSnapshot.empty) {
            return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
          }
          
          const userData = emailSnapshot.docs[0].data() as UserProfile;
          const userId = emailSnapshot.docs[0].id;
          
          // Get batch document for user details
          const batchRef = doc(db, "user_batches", userData.batch_doc_id);
          const batchSnap = await getDoc(batchRef);
          
          if (!batchSnap.exists()) {
            return NextResponse.json({ message: "User batch not found", status: "error" }, { status: 404 });
          }
          
          const batchData = batchSnap.data() as BatchDocument;
          const userInBatch = batchData.users.find((u: BatchUser) => u.uid === userId);
          
          if (!userInBatch) {
            return NextResponse.json({ message: "User data not found in batch", status: "error" }, { status: 404 });
          }
          
          // Combine data
          const user = {
            uid: userId,
            authUid: userData.authUid,
            email: userInBatch.email,
            name: userInBatch.name,
            isAdmin: userInBatch.isAdmin || false,
            profile_picture: userInBatch.profile_picture || null,
            status: userInBatch.status || "active",
            college_name: userInBatch.college_name || null,
            bio: userInBatch.bio || null,
            github_link: userInBatch.github_link || null,
            linkedin_link: userInBatch.linkedin_link || null,
            portfolio_link: userInBatch.portfolio_link || null,
            resume_link: userInBatch.resume_link || null,
            upVote: userInBatch.upVote || 0,
            upvotedProfiles: userData.upvotedProfiles || [],
          };
          
          return NextResponse.json({ user, status: "success" });
        } else {
          return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
        }
      } else {
        const userData = querySnapshot.docs[0].data() as UserProfile;
        const userId = querySnapshot.docs[0].id;
        
        // Get batch document
        const batchRef = doc(db, "user_batches", userData.batch_doc_id);
        const batchSnap = await getDoc(batchRef);
        
        if (!batchSnap.exists()) {
          return NextResponse.json({ message: "User batch not found", status: "error" }, { status: 404 });
        }
        
        const batchData = batchSnap.data() as BatchDocument;
        const userInBatch = batchData.users.find((u: BatchUser) => u.uid === userId);
        
        if (!userInBatch) {
          return NextResponse.json({ message: "User data not found in batch", status: "error" }, { status: 404 });
        }
        
        // Combine data
        const user = {
          uid: userId,
          authUid: userData.authUid,
          email: userInBatch.email,
          name: userInBatch.name,
          isAdmin: userInBatch.isAdmin || false,
          profile_picture: userInBatch.profile_picture || null,
          status: userInBatch.status || "active",
          college_name: userInBatch.college_name || null,
          bio: userInBatch.bio || null,
          github_link: userInBatch.github_link || null,
          linkedin_link: userInBatch.linkedin_link || null,
          portfolio_link: userInBatch.portfolio_link || null,
          resume_link: userInBatch.resume_link || null,
          upVote: userInBatch.upVote || 0,
          upvotedProfiles: userData.upvotedProfiles || [],
        };
        
        return NextResponse.json({ user, status: "success" });
      }
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ message: "Failed to fetch user", error: String(error), status: "error" }, { status: 500 });
  }
}

// Helper function to manage college changes
const handleCollegeChange = async (oldCollege: string | null, newCollege: string): Promise<void> => {
  if (!newCollege || (oldCollege && oldCollege.toLowerCase() === newCollege.toLowerCase())) {
    // No change or no college provided
    return;
  }

  const newCollegeTrimmed = newCollege.trim();
  if (newCollegeTrimmed.length === 0) return;

  // Check if the new college exists
  const collegesRef = collection(db, "colleges");
  const collegeQuery = query(
    collegesRef, 
    where("name_lower", "==", newCollegeTrimmed.toLowerCase())
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
      name: newCollegeTrimmed,
      name_lower: newCollegeTrimmed.toLowerCase(),
      count: 1,
      created_at: new Date().toISOString()
    });
  }

  // If there was an old college, decrement its count
  if (oldCollege) {
    const oldCollegeQuery = query(
      collegesRef, 
      where("name_lower", "==", oldCollege.toLowerCase())
    );
    
    const oldCollegeSnapshot = await getDocs(oldCollegeQuery);
    
    if (!oldCollegeSnapshot.empty) {
      const oldCollegeDoc = oldCollegeSnapshot.docs[0];
      const currentCount = oldCollegeDoc.data().count || 0;
      
      // Only decrement if count is greater than 0
      if (currentCount > 0) {
        await updateDoc(doc(db, "colleges", oldCollegeDoc.id), {
          count: currentCount - 1
        });
      }
    }
  }
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
    
    // Find the user in user_profiles
    const userRef = doc(db, "user_profiles", params.id);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    }
    
    const userData = userSnap.data() as UserProfile;
    const batchDocId = userData.batch_doc_id;
    
    // Get the batch document
    const batchRef = doc(db, "user_batches", batchDocId);
    const batchSnap = await getDoc(batchRef);
    
    if (!batchSnap.exists()) {
      return NextResponse.json({ message: "User batch not found", status: "error" }, { status: 404 });
    }
    
    const batchData = batchSnap.data() as BatchDocument;
    const userIndex = batchData.users.findIndex((u: BatchUser) => u.uid === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json({ message: "User not found in batch", status: "error" }, { status: 404 });
    }
    
    // Get the user data from the batch
    const userInBatch = batchData.users[userIndex];
    
    // Handle college name update if provided
    if (updates.college_name && updates.college_name !== userInBatch.college_name) {
      await handleCollegeChange(userInBatch.college_name || null, updates.college_name.toString());
    }
    
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
      // We need to get the resume_link from the batch since it might not be in the user profile
      const userInBatchResumeLink = userInBatch.resume_link;
      if (userInBatchResumeLink) {
        await deleteFromCloudinary(userInBatchResumeLink, 'raw');
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
      if (userData.profile_picture) {
        await deleteFromCloudinary(userData.profile_picture, 'image');
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
    
    // Update both user_profiles and user_batches collections
    const userProfileUpdates: Record<string, any> = {};
    const userBatchUpdates: Record<string, any> = {};
    
    // Process updates for user_profiles
    if (updates.profile_picture) {
      userProfileUpdates['profile_picture'] = updates.profile_picture;
    }
    
    // Process updates for user_batches
    Object.keys(updates).forEach(key => {
      if (key !== 'upvotedProfiles') { // Don't update upvotedProfiles in batch
        userBatchUpdates[key] = updates[key];
      }
    });
    
    // Update the user_profiles collection
    if (Object.keys(userProfileUpdates).length > 0) {
      await updateDoc(userRef, userProfileUpdates);
    }
    
    // Update the user in the batch
    if (Object.keys(userBatchUpdates).length > 0) {
      const updatedUsers = [...batchData.users];
      updatedUsers[userIndex] = {
        ...userInBatch,
        ...userBatchUpdates
      };
      
      await updateDoc(batchRef, {
        users: updatedUsers,
        updated_at: new Date().toISOString()
      });
    }
    
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
    
    // Verify admin permissions
    const adminRef = doc(db, "user_profiles", uid);
    const adminSnap = await getDoc(adminRef);
    
    if (!adminSnap.exists()) {
      return NextResponse.json({ message: "Unauthorized: Admin not found", status: "error" }, { status: 403 });
    }
    
    // Check isAdmin directly in user_profiles
    let isAdmin = adminSnap.data().isAdmin === true;
    
    // If not found in user_profiles, fall back to batch check (for backward compatibility)
    if (!isAdmin) {
      const adminData = adminSnap.data() as UserProfile;
      const adminBatchRef = doc(db, "user_batches", adminData.batch_doc_id);
      const adminBatchSnap = await getDoc(adminBatchRef);
      
      if (adminBatchSnap.exists()) {
        const adminBatchData = adminBatchSnap.data() as BatchDocument;
        const adminInBatch = adminBatchData.users.find((u: BatchUser) => u.uid === uid);
        isAdmin = adminInBatch?.isAdmin || false;
        
        // If admin in batch but not in profile, update profile for consistency
        if (isAdmin) {
          await updateDoc(adminRef, {
            isAdmin: true
          });
        }
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json({ message: "Unauthorized: Not an admin", status: "error" }, { status: 403 });
    }
    
    // Find the user to delete
    const userRef = doc(db, "user_profiles", params.id);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    }
    
    const userData = userSnap.data() as UserProfile;
    const batchDocId = userData.batch_doc_id;
    
    // Get the batch document
    const batchRef = doc(db, "user_batches", batchDocId);
    const batchSnap = await getDoc(batchRef);
    
    if (!batchSnap.exists()) {
      return NextResponse.json({ message: "User batch not found", status: "error" }, { status: 404 });
    }
    
    const batchData = batchSnap.data() as BatchDocument;
    const userIndex = batchData.users.findIndex((u: BatchUser) => u.uid === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json({ message: "User not found in batch", status: "error" }, { status: 404 });
    }
    
    // Soft delete: set isDeleted flag in the batch
    const updatedUsers = [...batchData.users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      isDeleted: true
    };
    
    await updateDoc(batchRef, {
      users: updatedUsers,
      updated_at: new Date().toISOString()
    });
    
    // We don't delete the user_profiles document, just to maintain references
    
    return NextResponse.json({ message: "User deleted successfully", status: "success" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Failed to delete user", error: String(error), status: "error" }, { status: 500 });
  }
}
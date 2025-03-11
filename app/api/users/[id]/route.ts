import { db } from "@/Firebase";
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import { cloudinary } from "@/Cloudinary";
import fs from 'fs';
import path from 'path';
import os from 'os';

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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Extract authorization header from request
    const authHeader = req.headers.get('Authorization');
    
    // Check if token is provided in the format "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: "Unauthorized: Missing or invalid token", status: "error" }, { status: 401 });
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];
    
    // In a production app, you would verify the token here
    // For example, with Firebase Admin SDK or a JWT library
    
    // Try finding user by document ID first
    const userRef = doc(db, "registrations", params.id);
    const userSnap = await getDoc(userRef);

    let userData;
    let userId = params.id;

    if (userSnap.exists()) {
      userData = userSnap.data();
    } else {
      // If not found, try finding by authUid
      const usersRef = collection(db, "registrations");
      const q = query(usersRef, where("authUid", "==", params.id));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Last resort: try by email (in case the ID is actually an email)
        if (params.id.includes('@')) {
          const emailQuery = query(usersRef, where("email", "==", params.id));
          const emailSnapshot = await getDocs(emailQuery);
          
          if (emailSnapshot.empty) {
            return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
          }
          
          userData = emailSnapshot.docs[0].data();
          userId = emailSnapshot.docs[0].id;
        } else {
          return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
        }
      } else {
        userData = querySnapshot.docs[0].data();
        userId = querySnapshot.docs[0].id; // Use the document ID, not authUid
      }
    }

    // Construct the response object with only necessary fields
    const user = {
      uid: userId,
      authUid: userData.authUid || null,
      email: userData.email,
      name: userData.name,
      isAdmin: userData.isAdmin || false,
      profile_picture: userData.profile_picture || null,
      status: userData.status || "active",
      college_name: userData.college_name,
      bio: userData.bio,
      github_link: userData.github_link,
      linkedin_link: userData.linkedin_link,
      portfolio_link: userData.portfolio_link,
      resume_link: userData.resume_link,
    };

    return NextResponse.json({ user, status: "success" });
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
    
    // Find the user document by document ID or authUid
    let userRef;
    let userData;
    let userDocId = params.id;
    
    // First try by document ID
    const directRef = doc(db, "registrations", params.id);
    const directSnap = await getDoc(directRef);
    
    if (directSnap.exists()) {
      userRef = directRef;
      userData = directSnap.data();
    } else {
      // If not found, try finding by authUid
      const usersRef = collection(db, "registrations");
      const q = query(usersRef, where("authUid", "==", params.id));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Last resort: try by email (in case the ID is actually an email)
        if (params.id.includes('@')) {
          const emailQuery = query(usersRef, where("email", "==", params.id));
          const emailSnapshot = await getDocs(emailQuery);
          
          if (emailSnapshot.empty) {
            return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
          }
          
          userDocId = emailSnapshot.docs[0].id;
          userRef = doc(db, "registrations", userDocId);
          userData = emailSnapshot.docs[0].data();
        } else {
          return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
        }
      } else {
        userDocId = querySnapshot.docs[0].id;
        userRef = doc(db, "registrations", userDocId);
        userData = querySnapshot.docs[0].data();
      }
    }
    
    // Handle college name update if provided
    if (updates.college_name && updates.college_name !== userData.college_name) {
      await handleCollegeChange(userData.college_name, updates.college_name);
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
      if (userData.resume_link) {
        await deleteFromCloudinary(userData.resume_link, 'raw');
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
    
    // Apply all updates to the user document
    await updateDoc(userRef, updates);
    
    return NextResponse.json({ 
      message: "User updated successfully",
      userId: userDocId,
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
    
    // Verify admin permissions - allow checking by either document ID or authUid
    const adminRef = doc(db, "registrations", uid);
    let adminSnap = await getDoc(adminRef);
    let isAdmin = false;
    
    if (adminSnap.exists()) {
      isAdmin = adminSnap.data().isAdmin || false;
    } else {
      // Try finding admin by authUid
      const adminsRef = collection(db, "registrations");
      const q = query(adminsRef, where("authUid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        isAdmin = querySnapshot.docs[0].data().isAdmin || false;
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json({ message: "Unauthorized: Not an admin", status: "error" }, { status: 403 });
    }
    
    // Find the user to delete by document ID or authUid
    let userRef;
    let userExists = false;
    
    // First try by document ID
    const directRef = doc(db, "registrations", params.id);
    const directSnap = await getDoc(directRef);
    
    if (directSnap.exists()) {
      userRef = directRef;
      userExists = true;
    } else {
      // If not found, try finding by authUid
      const usersRef = collection(db, "registrations");
      const q = query(usersRef, where("authUid", "==", params.id));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Last resort: try by email (in case the ID is actually an email)
        if (params.id.includes('@')) {
          const emailQuery = query(usersRef, where("email", "==", params.id));
          const emailSnapshot = await getDocs(emailQuery);
          
          if (emailSnapshot.empty) {
            return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
          }
          
          userRef = doc(db, "registrations", emailSnapshot.docs[0].id);
          userExists = true;
        } else {
          return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
        }
      } else {
        userRef = doc(db, "registrations", querySnapshot.docs[0].id);
        userExists = true;
      }
    }
    
    if (!userExists) {
      return NextResponse.json({ message: "User not found", status: "error" }, { status: 404 });
    }
    
    // Delete the user document
    await deleteDoc(userRef);
    
    return NextResponse.json({ message: "User deleted successfully", status: "success" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Failed to delete user", error: String(error), status: "error" }, { status: 500 });
  }
}
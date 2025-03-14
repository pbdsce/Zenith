import { db } from "@/Firebase";
import { 
  collection, getDocs, query, where, doc, setDoc, updateDoc, orderBy, 
  limit, startAfter, getDoc, runTransaction, DocumentReference
} from "firebase/firestore";
import { NextResponse } from "next/server";

// Collection name for colleges
const COLLEGES_COLLECTION = "colleges";

// Define interfaces for better type safety
interface College {
  id: string;
  name: string;
  name_lower: string;
  count: number;
  created_at: string;
  updated_at: string;
}

interface CollegeResponse {
  id: string;
  name: string;
  count: number;
}

/**
 * Formats a college name properly
 * - Trims whitespace
 * - Capitalizes first letter of each word
 * - Handles special cases like "of", "and", etc.
 */
function formatCollegeName(name: string): string {
  if (!name) return "";
  
  const cleaned = name.trim();
  if (!cleaned) return "";
  
  // Words that should not be capitalized unless they're the first word
  const lowercaseWords = ['of', 'and', 'the', 'for', 'in', 'on', 'at', 'by', 'to'];
  
  return cleaned.split(' ')
    .map((word, index) => {
      // Always capitalize first word or if it contains abbreviations (like "IIT", "NIT")
      if (index === 0 || word.toUpperCase() === word || word.length <= 2) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      // Handle lowercase words
      return lowercaseWords.includes(word.toLowerCase()) 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Sanitizes inputs to prevent injection attacks
 */
function sanitizeInput(input: string): string {
  if (!input) return "";
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[^\w\s.,\-()&']/g, '') // Keep only safe characters
    .trim();
}

/**
 * Validates the request to ensure it comes from an authorized source
 */
async function validateRequest(request: Request): Promise<boolean> {
  try {
    // Check for required headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    // Additional validation could be implemented here:
    // - Verify token with Firebase Admin SDK
    // - Check rate limits based on IP or user
    
    return true;
  } catch (error) {
    console.error("Request validation error:", error);
    return false;
  }
}

/**
 * GET endpoint to fetch colleges for dropdown
 * Supports pagination with optional lastId and pageSize query parameters
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastId = searchParams.get('lastId');
    const pageSizeParam = searchParams.get('pageSize');
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 100;
    
    // Validate pageSize to prevent excessive queries
    const validPageSize = Math.min(Math.max(10, pageSize), 500);
    
    let collegesQuery;
    const collegesRef = collection(db, COLLEGES_COLLECTION);
    
    if (lastId) {
      // Get the document to use as cursor for pagination
      const lastDocRef = doc(db, COLLEGES_COLLECTION, lastId);
      const lastDocSnap = await getDoc(lastDocRef);
      
      if (lastDocSnap.exists()) {
        collegesQuery = query(
          collegesRef, 
          orderBy("name"),
          startAfter(lastDocSnap),
          limit(validPageSize)
        );
      } else {
        return NextResponse.json(
          { message: "Invalid pagination cursor", status: "error" }, 
          { status: 400 }
        );
      }
    } else {
      collegesQuery = query(
        collegesRef, 
        orderBy("name"),
        limit(validPageSize)
      );
    }
    
    const querySnapshot = await getDocs(collegesQuery);
    
    const colleges: CollegeResponse[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      count: doc.data().count || 0
    }));

    // Get the last document ID for pagination
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = querySnapshot.docs.length === validPageSize;

    return NextResponse.json({
      colleges,
      pagination: {
        hasMore,
        lastId: hasMore && lastVisible ? lastVisible.id : null,
        pageSize: validPageSize
      },
      status: "success"
    });
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return NextResponse.json(
      { 
        message: "Failed to fetch colleges", 
        error: String(error), 
        status: "error" 
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to add a new college
 */
export async function POST(request: Request) {
  try {
    // Validate the request
    if (!(await validateRequest(request))) {
      return NextResponse.json(
        { message: "Unauthorized request", status: "error" },
        { status: 403 }
      );
    }
    
    const { name } = await request.json();
    
    // Validate request
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { message: "College name is required", status: "error" },
        { status: 400 }
      );
    }
    
    if (name.trim().length === 0) {
      return NextResponse.json(
        { message: "College name cannot be empty", status: "error" },
        { status: 400 }
      );
    }
    
    if (name.length > 200) {
      return NextResponse.json(
        { message: "College name is too long (maximum 200 characters)", status: "error" },
        { status: 400 }
      );
    }
    
    // Sanitize and format the college name
    const cleanName = sanitizeInput(name);
    const collegeName = formatCollegeName(cleanName);
    
    if (!collegeName) {
      return NextResponse.json(
        { message: "Invalid college name after sanitization", status: "error" },
        { status: 400 }
      );
    }
    
    // Define the name in lowercase for case insensitive search
    const nameLower = collegeName.toLowerCase();
    
    // Check if college already exists (case insensitive search)
    const collegesRef = collection(db, COLLEGES_COLLECTION);
    const collegeQuery = query(collegesRef, where("name_lower", "==", nameLower));
    
    const querySnapshot = await getDocs(collegeQuery);
    
    if (!querySnapshot.empty) {
      // College already exists, use transaction to safely increment the count
      const existingCollegeId = querySnapshot.docs[0].id;
      const existingCollegeRef = doc(db, COLLEGES_COLLECTION, existingCollegeId);
      
      try {
        const result = await runTransaction(db, async (transaction) => {
          const collegeDoc = await transaction.get(existingCollegeRef);
          
          if (!collegeDoc.exists()) {
            throw new Error("College document doesn't exist!");
          }
          
          const existingData = collegeDoc.data();
          const currentCount = existingData.count || 0;
          const newCount = currentCount + 1;
          
          transaction.update(existingCollegeRef, {
            count: newCount,
            updated_at: new Date().toISOString()
          });
          
          return {
            id: existingCollegeId,
            name: existingData.name,
            count: newCount
          };
        });
        
        return NextResponse.json({
          message: "College reference count incremented",
          college: result,
          status: "success"
        });
      } catch (transactionError) {
        console.error("Transaction error while updating college count:", transactionError);
        return NextResponse.json(
          { message: "Failed to update college reference count", status: "error" },
          { status: 500 }
        );
      }
    }
    
    // College doesn't exist, add it using a transaction
    const newCollegeId = doc(collection(db, COLLEGES_COLLECTION)).id;
    const newCollegeRef = doc(db, COLLEGES_COLLECTION, newCollegeId);
    
    try {
      // First, check if college was created in the meantime
      const doubleCheckQuery = query(collegesRef, where("name_lower", "==", nameLower));
      const doubleCheckSnapshot = await getDocs(doubleCheckQuery);
      
      if (!doubleCheckSnapshot.empty) {
        throw new Error("College was created by another operation");
      }
      
      await runTransaction(db, async (transaction) => {
        const collegeData = {
          name: collegeName,
          name_lower: nameLower,
          count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        transaction.set(newCollegeRef, collegeData);
      });
      
      console.log(`New college added: "${collegeName}" (ID: ${newCollegeId})`);
      
      return NextResponse.json({
        message: "College added successfully",
        college: {
          id: newCollegeId,
          name: collegeName,
          count: 1
        },
        status: "success"
      }, { status: 201 });
    } catch (transactionError: any) {
      console.error("Transaction error while creating college:", transactionError);
      
      // Check if it's due to a concurrent creation
      if (transactionError.message.includes("created by another operation")) {
        // Try to fetch the college that was concurrently created
        const retryQuery = query(collegesRef, where("name_lower", "==", nameLower));
        const retrySnapshot = await getDocs(retryQuery);
        
        if (!retrySnapshot.empty) {
          const concurrentCollege = retrySnapshot.docs[0];
          const concurrentData = concurrentCollege.data();
          
          return NextResponse.json({
            message: "College already exists (created concurrently)",
            college: {
              id: concurrentCollege.id,
              name: concurrentData.name,
              count: concurrentData.count || 1
            },
            status: "success"
          });
        }
      }
      
      return NextResponse.json(
        { message: "Failed to add college", error: String(transactionError), status: "error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error adding college:", error);
    
    // More specific error handling
    let errorMessage = "Failed to add college";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("quota") || error.message.includes("limit")) {
        errorMessage = "Database quota exceeded. Please try again later.";
        statusCode = 429;
      } else if (error.message.includes("permission") || error.message.includes("unauthorized")) {
        errorMessage = "Permission denied to add college";
        statusCode = 403;
      }
    }
    
    return NextResponse.json(
      { message: errorMessage, error: String(error), status: "error" },
      { status: statusCode }
    );
  }
}

/**
 * PUT endpoint to update college information
 */
export async function PUT(request: Request) {
  try {
    // Validate the request
    if (!(await validateRequest(request))) {
      return NextResponse.json(
        { message: "Unauthorized request", status: "error" },
        { status: 403 }
      );
    }
    
    const { id, name } = await request.json();
    
    if (!id || !name || typeof id !== 'string' || typeof name !== 'string') {
      return NextResponse.json(
        { message: "College ID and name are required", status: "error" },
        { status: 400 }
      );
    }
    
    // Sanitize and format the college name
    const cleanName = sanitizeInput(name);
    const collegeName = formatCollegeName(cleanName);
    
    if (!collegeName) {
      return NextResponse.json(
        { message: "Invalid college name after sanitization", status: "error" },
        { status: 400 }
      );
    }
    
    // Check if college exists
    const collegeRef = doc(db, COLLEGES_COLLECTION, id) as DocumentReference<College>;
    
    try {
      // First check if the name we want to use already exists
      const collegeLower = collegeName.toLowerCase();
      const collegesRef = collection(db, COLLEGES_COLLECTION);
      const nameQuery = query(collegesRef, where("name_lower", "==", collegeLower));
      const nameQuerySnapshot = await getDocs(nameQuery);
      
      // If name exists but for a different college, reject the update
      if (!nameQuerySnapshot.empty) {
        const existingDoc = nameQuerySnapshot.docs[0];
        if (existingDoc.id !== id) {
          throw new Error("DUPLICATE_NAME");
        }
      }
      
      // Use transaction for atomicity
      const result = await runTransaction(db, async (transaction) => {
        const collegeDoc = await transaction.get(collegeRef);
        
        if (!collegeDoc.exists()) {
          throw new Error("NOT_FOUND");
        }
        
        // Update the college data
        const oldData = collegeDoc.data();
        
        transaction.update(collegeRef, {
          name: collegeName,
          name_lower: collegeLower,
          updated_at: new Date().toISOString()
        });
        
        return {
          id: collegeRef.id,
          name: collegeName,
          count: oldData?.count || 0
        };
      });
      
      return NextResponse.json({
        message: "College updated successfully",
        college: result,
        status: "success"
      });
    } catch (transactionError: any) {
      if (transactionError.message === "NOT_FOUND") {
        return NextResponse.json(
          { message: "College not found", status: "error" },
          { status: 404 }
        );
      } else if (transactionError.message === "DUPLICATE_NAME") {
        return NextResponse.json(
          { message: "College with this name already exists", status: "error" },
          { status: 409 }
        );
      }
      
      console.error("Transaction error while updating college:", transactionError);
      return NextResponse.json(
        { message: "Failed to update college", error: String(transactionError), status: "error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating college:", error);
    return NextResponse.json(
      { message: "Failed to update college", error: String(error), status: "error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to mark a college as inactive or remove it
 * This uses a soft delete approach for data integrity
 */
export async function DELETE(request: Request) {
  try {
    // Validate the request
    if (!(await validateRequest(request))) {
      return NextResponse.json(
        { message: "Unauthorized request", status: "error" },
        { status: 403 }
      );
    }
    
    // Get college ID from URL parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: "College ID is required", status: "error" },
        { status: 400 }
      );
    }
    
    const collegeRef = doc(db, COLLEGES_COLLECTION, id);
    
    try {
      // Use transaction to safely mark as inactive
      await runTransaction(db, async (transaction) => {
        const collegeDoc = await transaction.get(collegeRef);
        
        if (!collegeDoc.exists()) {
          throw new Error("NOT_FOUND");
        }
        
        // Instead of hard deletion, mark as inactive or archive
        transaction.update(collegeRef, {
          is_active: false,
          updated_at: new Date().toISOString()
        });
      });
      
      return NextResponse.json({
        message: "College successfully marked as inactive",
        status: "success"
      });
    } catch (transactionError: any) {
      if (transactionError.message === "NOT_FOUND") {
        return NextResponse.json(
          { message: "College not found", status: "error" },
          { status: 404 }
        );
      }
      
      console.error("Transaction error while deleting college:", transactionError);
      return NextResponse.json(
        { message: "Failed to delete college", status: "error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting college:", error);
    return NextResponse.json(
      { message: "Failed to delete college", error: String(error), status: "error" },
      { status: 500 }
    );
  }
}

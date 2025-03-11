import { db } from "@/Firebase";
import { collection, getDocs, query, where, doc, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { NextResponse } from "next/server";

// Collection name for colleges
const COLLEGES_COLLECTION = "colleges";

/**
 * GET endpoint to fetch all colleges for dropdown
 */
export async function GET() {
  try {
    const collegesRef = collection(db, COLLEGES_COLLECTION);
    const collegesQuery = query(collegesRef, orderBy("name"));
    const querySnapshot = await getDocs(collegesQuery);
    
    const colleges = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      count: doc.data().count || 0
    }));

    return NextResponse.json({
      colleges,
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
    const { name } = await request.json();
    
    // Validate request
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { 
          message: "Invalid college name", 
          status: "error"
        },
        { status: 400 }
      );
    }
    
    // Clean up the college name - trim spaces and capitalize properly
    const collegeName = name.trim();
    
    // Check if college already exists (case insensitive search)
    const collegesRef = collection(db, COLLEGES_COLLECTION);
    const collegeQuery = query(
      collegesRef, 
      where("name_lower", "==", collegeName.toLowerCase())
    );
    
    const querySnapshot = await getDocs(collegeQuery);
    
    if (!querySnapshot.empty) {
      // College already exists, just return it
      const existingCollege = querySnapshot.docs[0];
      return NextResponse.json({
        message: "College already exists",
        college: {
          id: existingCollege.id,
          name: existingCollege.data().name,
          count: existingCollege.data().count || 0
        },
        status: "success"
      });
    }
    
    // College doesn't exist, add it
    const newCollegeRef = doc(collection(db, COLLEGES_COLLECTION));
    const collegeData = {
      name: collegeName,
      name_lower: collegeName.toLowerCase(), // For case-insensitive search
      count: 1,
      created_at: new Date().toISOString()
    };
    
    await setDoc(newCollegeRef, collegeData);
    
    return NextResponse.json({
      message: "College added successfully",
      college: {
        id: newCollegeRef.id,
        name: collegeName,
        count: 1
      },
      status: "success"
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error adding college:", error);
    return NextResponse.json(
      { 
        message: "Failed to add college", 
        error: String(error), 
        status: "error" 
      },
      { status: 500 }
    );
  }
}

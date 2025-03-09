import { db } from "@/Firebase";
import { addDoc, collection, getDocs, query, where, runTransaction, doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

// Utility functions for format validation
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => /^[6-9]\d{9}$/.test(phone);
const validateAge = (age: string) => {
  const ageNum = parseInt(age);
  return !isNaN(ageNum) && ageNum > 0 && ageNum < 120;
};
const validateURL = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
const validateReferralCode = (code: string) => code === "APNAADMI";
const validateBio = (bio: string) => bio.length <= 500; // 100 words ≈ 500 chars

export async function POST(request: Request) {
  // Extract JSON data from request
  const formData = await request.json();
  const { recaptcha_token, ...data } = formData;

  // Validate required fields
  if (
    !data.name ||
    !data.email ||
    !data.phone ||
    !data.resume_link
  ) {
    return NextResponse.json(
      {
        message: "Required information is missing.",
        error: "Missing required fields",
      },
      { status: 400 }
    );
  }

  // Validate required fields format
  if (!validateEmail(data.email)) {
    return NextResponse.json(
      {
        message: "Invalid email format.",
        error: "Invalid email",
      },
      { status: 400 }
    );
  }

  if (!validatePhone(data.phone)) {
    return NextResponse.json(
      {
        message: "Invalid phone number format. It should be a 10-digit number starting with 6-9.",
        error: "Invalid phone",
      },
      { status: 400 }
    );
  }

  if (!validateURL(data.resume_link)) {
    return NextResponse.json(
      {
        message: "Invalid resume link format.",
        error: "Invalid resume link",
      },
      { status: 400 }
    );
  }

  // Validate optional fields if provided
  if (data.leetcode_profile && !validateURL(data.leetcode_profile)) {
    return NextResponse.json(
      {
        message: "Invalid LeetCode profile URL format.",
        error: "Invalid LeetCode profile",
      },
      { status: 400 }
    );
  }

  if (data.github_link && !validateURL(data.github_link)) {
    return NextResponse.json(
      {
        message: "Invalid GitHub profile URL format.",
        error: "Invalid GitHub profile",
      },
      { status: 400 }
    );
  }

  if (data.linkedin_link && !validateURL(data.linkedin_link)) {
    return NextResponse.json(
      {
        message: "Invalid LinkedIn profile URL format.",
        error: "Invalid LinkedIn profile",
      },
      { status: 400 }
    );
  }

  if (data.competitive_profile && !validateURL(data.competitive_profile)) {
    return NextResponse.json(
      {
        message: "Invalid Competitive Programming profile URL format.",
        error: "Invalid CP profile",
      },
      { status: 400 }
    );
  }

  if (data.ctf_profile && !validateURL(data.ctf_profile)) {
    return NextResponse.json(
      {
        message: "Invalid CTF profile URL format.",
        error: "Invalid CTF profile",
      },
      { status: 400 }
    );
  }

  if (data.kaggle_link && !validateURL(data.kaggle_link)) {
    return NextResponse.json(
      {
        message: "Invalid Kaggle profile URL format.",
        error: "Invalid Kaggle profile",
      },
      { status: 400 }
    );
  }

  if (data.devfolio_link && !validateURL(data.devfolio_link)) {
    return NextResponse.json(
      {
        message: "Invalid Devfolio profile URL format.",
        error: "Invalid Devfolio profile",
      },
      { status: 400 }
    );
  }

  if (data.portfolio_link && !validateURL(data.portfolio_link)) {
    return NextResponse.json(
      {
        message: "Invalid Portfolio URL format.",
        error: "Invalid Portfolio link",
      },
      { status: 400 }
    );
  }

  if (data.profile_picture && !validateURL(data.profile_picture)) {
    return NextResponse.json(
      {
        message: "Invalid Profile Picture URL format.",
        error: "Invalid Profile Picture link",
      },
      { status: 400 }
    );
  }

  if (data.bio && !validateBio(data.bio)) {
    return NextResponse.json(
      {
        message: "Bio exceeds maximum length of 500 characters.",
        error: "Bio too long",
      },
      { status: 400 }
    );
  }

  if (data.age && !validateAge(data.age)) {
    return NextResponse.json(
      {
        message: "Invalid age value.",
        error: "Invalid age",
      },
      { status: 400 }
    );
  }

  if (data.referral_code && !validateReferralCode(data.referral_code)) {
    return NextResponse.json(
      {
        message: "Invalid referral code.",
        error: "Invalid referral code",
      },
      { status: 400 }
    );
  }

  try {
    // Check for duplicate email registration
    const emailQuery = query(
      collection(db, "registrations"),
      where("email", "==", data.email)
    );
    const emailQuerySnapshot = await getDocs(emailQuery);

    if (!emailQuerySnapshot.empty) {
      return NextResponse.json(
        {
          message: "Email is already registered!",
          error: "Email is already registered!",
        },
        { status: 400 }
      );
    }

    // Check for duplicate phone registration
    const phoneQuery = query(
      collection(db, "registrations"),
      where("phone", "==", data.phone)
    );
    const phoneQuerySnapshot = await getDocs(phoneQuery);

    if (!phoneQuerySnapshot.empty) {
      return NextResponse.json(
        {
          message: "Phone number is already registered!",
          error: "Phone number is already registered!",
        },
        { status: 400 }
      );
    }

    // Validate reCAPTCHA if token provided
    // if (recaptcha_token) {
    //   const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

    //   // Verify reCAPTCHA token
    //   const recaptchaResponse = await fetch(
    //     `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptcha_token}`,
    //     { method: "POST" }
    //   );
    //   const recaptchaResult = await recaptchaResponse.json();

    //   if (!recaptchaResult.success) {
    //     return NextResponse.json(
    //       {
    //         message: "reCAPTCHA validation failed",
    //         error: recaptchaResult["error-codes"],
    //       },
    //       { status: 400 }
    //     );
    //   }
    // }

    // Use transaction to ensure data consistency
    let registrationId = '';
    
    await runTransaction(db, async (transaction) => {
      // Prepare registration data
      const registrationData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        resume_link: data.resume_link,
        leetcode_profile: data.leetcode_profile || null,
        github_link: data.github_link || null,
        linkedin_link: data.linkedin_link || null,
        competitive_profile: data.competitive_profile || null,
        ctf_profile: data.ctf_profile || null,
        kaggle_link: data.kaggle_link || null,
        devfolio_link: data.devfolio_link || null,
        portfolio_link: data.portfolio_link || null,
        bio: data.bio || null,
        age: data.age || null,
        college_name: data.college_name || null,
        profile_picture: data.profile_picture || null,
        referral_code: data.referral_code || null,
        registration_time: new Date().toISOString(),
        status: "PENDING" // You can use this for tracking status
      };
      
      // Create a new registration document
      const registrationRef = doc(collection(db, "registrations"));
      registrationId = registrationRef.id;
      
      // Set the registration data in the transaction
      transaction.set(registrationRef, registrationData);
      
      // Add to users collection with minimal data
      // const userData = {
      //   name: data.name,
      //   email: data.email,
      //   phone: data.phone,
      //   registration_id: registrationId,
      //   registration_time: new Date().toISOString()
      // };
      
      // const userRef = doc(collection(db, "users"));
      // transaction.set(userRef, userData);
    });

    return NextResponse.json({ 
      message: "Registration successful", 
      id: registrationId,
      status: "success"
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { 
        message: "An error occurred during registration", 
        error: String(error),
        status: "error"
      },
      { status: 500 }
    );
  }
}

// If you want to keep the GET endpoint for frontend validation:
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');

  if (!email && !phone) {
    return NextResponse.json(
      { 
        message: "Missing query parameters", 
        error: "Email or phone must be provided"
      },
      { status: 400 }
    );
  }

  try {
    if (email) {
      const emailQuery = query(
        collection(db, "registrations"),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(emailQuery);
      
      return NextResponse.json({ 
        exists: !querySnapshot.empty,
        field: "email"
      });
    }
    
    if (phone) {
      const phoneQuery = query(
        collection(db, "registrations"),
        where("phone", "==", phone)
      );
      const querySnapshot = await getDocs(phoneQuery);
      
      return NextResponse.json({ 
        exists: !querySnapshot.empty,
        field: "phone"
      });
    }
  } catch (error) {
    console.error("Check registration error:", error);
    return NextResponse.json(
      { message: "An error occurred", error: String(error) },
      { status: 500 }
    );
  }
}
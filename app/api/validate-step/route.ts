import { NextResponse } from "next/server";
import { db } from "@/Firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Validation functions
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => /^\+?\d{1,4}[-\s]?\d{10}$/.test(phone);
const validateURL = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
const validateAge = (age: string) => {
  const ageNum = parseInt(age);
  return !isNaN(ageNum) && ageNum > 0 && ageNum < 120;
};

// URL validation patterns
const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\//;
const linkedinUrlPattern = /^https?:\/\/(www\.)?linkedin\.com\//;
const leetcodeUrlPattern = /^https?:\/\/(www\.)?leetcode\.com\//;
const kaggleUrlPattern = /^https?:\/\/(www\.)?kaggle\.com\//;
const devfolioUrlPattern = /^https?:\/\/(www\.)?devfolio\.co\//;

// Step 1: Basic Information
const validateStep1 = async (data: any) => {
  const errors: Record<string, string> = {};

  // Validate name
  if (!data.name?.trim()) {
    errors.name = "Name is required";
  }

  // Validate email
  if (!data.email?.trim()) {
    errors.email = "Email is required";
  } else if (!validateEmail(data.email)) {
    errors.email = "Invalid email format";
  } else {
    // Check for duplicate email in database
    const emailQuery = query(
      collection(db, "user_profiles"),
      where("email", "==", data.email)
    );
    const emailQuerySnapshot = await getDocs(emailQuery);
    if (!emailQuerySnapshot.empty) {
      errors.email = "Email is already registered";
    }
  }

  // Validate password
  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters long";
  }

  // Validate confirm password
  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
};

// Step 2: Contact and Resume
const validateStep2 = async (data: any) => {
  const errors: Record<string, string> = {};

  // Validate phone
  if (!data.phone?.trim()) {
    errors.phone = "Phone number is required";
  } else if (data.phone.length !== 10) {
    errors.phone = "Phone number must be 10 digits";
  } else {
    // Check if phone is already registered
    const phoneQuery = query(
      collection(db, "user_profiles"),
      where("phone", "==", data.stdCode + data.phone)
    );
    const phoneQuerySnapshot = await getDocs(phoneQuery);
    if (!phoneQuerySnapshot.empty) {
      errors.phone = "Phone number is already registered";
    }
  }

  // Resume is required but we can't validate it here since we don't have file access
  // We'll note this in the response to handle in frontend

  return errors;
};

// Step 3: Professional Profiles
const validateStep3 = async (data: any) => {
  const errors: Record<string, string> = {};

  // Validate GitHub link (required)
  if (!data.githubLink?.trim()) {
    errors.githubLink = "GitHub profile link is required";
  } else if (!githubUrlPattern.test(data.githubLink)) {
    errors.githubLink = "Please enter a valid GitHub profile URL (https://github.com/username)";
  }

  // Validate LinkedIn link (required)
  if (!data.linkedinLink?.trim()) {
    errors.linkedinLink = "LinkedIn profile link is required";
  } else if (!linkedinUrlPattern.test(data.linkedinLink)) {
    errors.linkedinLink = "Please enter a valid LinkedIn profile URL (https://linkedin.com/in/username)";
  }

  // Validate LeetCode link (optional)
  if (data.leetcodeProfile && !leetcodeUrlPattern.test(data.leetcodeProfile)) {
    errors.leetcodeProfile = "Please enter a valid LeetCode profile URL (https://leetcode.com/username)";
  }

  // Validate Portfolio link (optional)
  if (data.portfolioLink && !validateURL(data.portfolioLink)) {
    errors.portfolioLink = "Please enter a valid portfolio URL";
  }

  return errors;
};

// Step 4: Competition Profiles
const validateStep4 = async (data: any) => {
  const errors: Record<string, string> = {};
  const cpProfilesErrors: string[] = [];
  const ctfProfilesErrors: string[] = [];

  // Validate CP profiles
  const cpProfiles = JSON.parse(data.cpProfiles || '[]');
  cpProfiles.forEach((link: string, index: number) => {
    if (link && !validateURL(link)) {
      cpProfilesErrors[index] = "Invalid URL format";
    }
  });
  
  if (cpProfilesErrors.length > 0 && cpProfilesErrors.some(error => error)) {
    errors.cpProfiles = JSON.stringify(cpProfilesErrors);
  }

  // Validate CTF profiles
  const ctfProfiles = JSON.parse(data.ctfProfileLinks || '[]');
  ctfProfiles.forEach((link: string, index: number) => {
    if (link && !validateURL(link)) {
      ctfProfilesErrors[index] = "Invalid URL format";
    }
  });
  
  if (ctfProfilesErrors.length > 0 && ctfProfilesErrors.some(error => error)) {
    errors.ctfProfileLinks = JSON.stringify(ctfProfilesErrors);
  }

  // Validate Kaggle link (optional)
  if (data.kaggleLink && !kaggleUrlPattern.test(data.kaggleLink)) {
    errors.kaggleLink = "Please enter a valid Kaggle profile URL (https://kaggle.com/username)";
  }

  // Validate Devfolio link (optional)
  if (data.devfolioLink && !devfolioUrlPattern.test(data.devfolioLink)) {
    errors.devfolioLink = "Please enter a valid Devfolio profile URL (https://devfolio.co/@username)";
  }

  return errors;
};

// Step 5: Personal Information
const validateStep5 = async (data: any) => {
  const errors: Record<string, string> = {};

  // Validate age (required)
  if (!data.age?.trim()) {
    errors.age = "Age is required";
  } else if (!validateAge(data.age)) {
    errors.age = "Please enter a valid age between 1 and 120";
  }

  // No validation for college name, bio, profile pic, or referral code as they're optional

  return errors;
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { step } = data;
    let errors = {};

    // Validate based on current step
    switch (parseInt(step)) {
      case 0:
        errors = await validateStep1(data);
        break;
      case 1:
        errors = await validateStep2(data);
        break;
      case 2:
        errors = await validateStep3(data);
        break;
      case 3:
        errors = await validateStep4(data);
        break;
      case 4:
        errors = await validateStep5(data);
        break;
      default:
        return NextResponse.json(
          { message: "Invalid step", error: "Step out of range" },
          { status: 400 }
        );
    }

    // Check if we have any validation errors
    const hasErrors = Object.keys(errors).length > 0;

    return NextResponse.json({
      valid: !hasErrors,
      errors: errors,
      step: step
    });
  } catch (error) {
    console.error("Step validation error:", error);
    return NextResponse.json(
      { message: "An error occurred during validation", error: String(error) },
      { status: 500 }
    );
  }
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { LogIn, UserPlus, Zap } from "lucide-react";
import { FormInput } from "./form-input";
import { FormTextarea } from "./form-textarea";
import { FormSelect } from "./form-select";
import { FormFileUpload } from "./form-file-upload";
import { FormSection } from "./form-section";
import { Button } from "./button";
import { StickyAlert } from "./sticky-alert";

// PRODUCTION MODE - Debug features disabled
const DEBUG_MODE = false;

interface RegistrationContainerProps {
  onSuccess?: () => void;
}

export function RegistrationContainer({ onSuccess }: RegistrationContainerProps) {
  const router = useRouter();
  const { register } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  // Registration form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    age: "",
    organisation: "",
    bio: "",
    github: "",
    linkedin: "",
    portfolio: "",
    leetcode: "",
    kaggle: "",
    devfolio: "",
    referralCode: "",
  });

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // File states
  const [resume, setResume] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [profilePhotoFileName, setProfilePhotoFileName] = useState("");

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DEBUG: Auto-fill function
  const handleAutoFill = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setRegisterData({
      name: `Test User ${randomId}`,
      email: `testuser${randomId}@example.com`,
      password: "password123",
      confirmPassword: "password123",
      phone: `+1 555 ${String(randomId).padStart(4, '0')}`,
      age: "22",
      organisation: "Test University",
      bio: "I'm a passionate developer interested in AI, web development, and hackathons. Looking forward to participating in Zenith!",
      github: "https://github.com/testuser",
      linkedin: "https://linkedin.com/in/testuser",
      portfolio: "https://testuser.dev",
      leetcode: "https://leetcode.com/testuser",
      kaggle: "https://kaggle.com/testuser",
      devfolio: "https://devfolio.co/@testuser",
      referralCode: "TEST2024",
    });
    
    // Create a dummy PDF file for resume
    const resumeBlob = new Blob(['This is a test resume PDF content'], { type: 'application/pdf' });
    const resumeFile = new File([resumeBlob], 'test_resume.pdf', { type: 'application/pdf' });
    setResume(resumeFile);
    setResumeFileName('test_resume.pdf');
    
    setAlert({
      type: "info",
      message: "Form auto-filled with test data! (Debug mode)",
    });
    setTimeout(() => setAlert(null), 3000);
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    setAlert({
      type: "info",
      message: "Login functionality will be implemented separately",
    });
    setTimeout(() => setAlert(null), 3000);
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setAlert(null);

    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!registerData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!registerData.email.trim() || !/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = "Valid email is required";
    }
    
    if (!registerData.password || registerData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (!registerData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }
    
    if (!registerData.age.trim() || parseInt(registerData.age) < 1 || parseInt(registerData.age) > 120) {
      newErrors.age = "Valid age is required";
    }
    
    if (!registerData.organisation.trim()) {
      newErrors.organisation = "Organisation is required";
    }
    
    if (!registerData.bio.trim()) {
      newErrors.bio = "Bio is required";
    }
    
    if (!registerData.github.trim()) {
      newErrors.github = "GitHub link is required";
    }
    
    if (!registerData.linkedin.trim()) {
      newErrors.linkedin = "LinkedIn link is required";
    }
    
    if (!resume) {
      newErrors.resume = "Resume is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData for API request
      const formData = new FormData();
      formData.append('name', registerData.name);
      formData.append('email', registerData.email);
      formData.append('password', registerData.password);
      formData.append('phone', registerData.phone);
      formData.append('age', registerData.age);
      formData.append('organisation', registerData.organisation);
      formData.append('bio', registerData.bio);
      formData.append('github_link', registerData.github);
      formData.append('linkedin_link', registerData.linkedin);
      
      if (resume) formData.append('resume', resume);
      if (profilePhoto) formData.append('profile_picture', profilePhoto);
      if (registerData.portfolio) formData.append('portfolio_link', registerData.portfolio);
      if (registerData.leetcode) formData.append('leetcode_profile', registerData.leetcode);
      if (registerData.kaggle) formData.append('kaggle_link', registerData.kaggle);
      if (registerData.devfolio) formData.append('devfolio_link', registerData.devfolio);
      if (registerData.referralCode) formData.append('referral_code', registerData.referralCode);

      // Register user - This will store user data
      await register(formData);

      setAlert({
        type: "success",
        message: "🎉 Registration successful! Redirecting to dashboard...",
      });
      
      // Give user time to see success message, then redirect
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to dashboard
          router.push('/dashboard');
        }
      }, 1500);
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Registration failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        setErrors({ ...errors, resume: "Please upload a PDF file" });
        return;
      }
      setResume(file);
      setResumeFileName(file.name);
      if (errors.resume) {
        const newErrors = { ...errors };
        delete newErrors.resume;
        setErrors(newErrors);
      }
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setProfilePhoto(files[0]);
      setProfilePhotoFileName(files[0].name);
    }
  };

  return (
    <div className="flex flex-col gap-[32px] max-w-[600px] w-full">
      <div className="flex flex-col gap-[12px] items-center text-center">
        <div className="backdrop-blur-[2.5px] backdrop-filter bg-[rgba(255,255,255,0)] flex items-center justify-center px-[12px] py-[7px] rounded-[15px] shadow-[0px_3px_10px_0px_rgba(209,63,0,0.5)] relative">
          <p className="text-[14px] text-white leading-[16.8px]" style={{ fontFamily: 'var(--font-body)' }}>
            Registration Open
          </p>
          <div className="absolute inset-0 rounded-[15px]">
            <div className="absolute border border-[#b85c00] border-solid inset-0 pointer-events-none rounded-[15px]" />
          </div>
        </div>

        <h1 className="text-[48px] text-white leading-[52px] tracking-[-1px]" style={{ fontFamily: 'var(--font-heading)' }}>
          Welcome to Zenith
        </h1>

        <p className="text-[15.9px] text-white opacity-90 leading-[23.8px]" style={{ fontFamily: 'var(--font-body)' }}>
          Join us for an intense 24-hour hackathon experience.
          Login or create an account to get started.
        </p>
      </div>

      <div className="flex gap-[12px] items-center justify-center flex-wrap">
        <Button
          onClick={() => {
            router.push('/login');
          }}
          variant="secondary"
        >
          <LogIn className="w-4 h-4" />
          Login
        </Button>
        <Button
          onClick={() => setAuthMode("register")}
          variant="primary"
        >
          <UserPlus className="w-4 h-4" />
          Register
        </Button>
        {DEBUG_MODE && (
          <Button
            onClick={handleAutoFill}
            variant="secondary"
          >
            <Zap className="w-4 h-4" />
            Auto-Fill (Debug)
          </Button>
        )}
      </div>

      {alert && (
        <StickyAlert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {DEBUG_MODE && (
        <div className="backdrop-blur-[2.5px] backdrop-filter bg-[rgba(255,165,0,0.2)] border border-orange-500 rounded-[15px] p-[12px] flex items-center gap-[12px]">
          <Zap className="w-5 h-5 text-orange-400" />
          <div className="flex flex-col gap-[4px]">
            <span className="text-[13px] text-white font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
              Debug Mode Active
            </span>
            <span className="text-[12px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
              Set DEBUG_MODE = false in registration-container.tsx before production
            </span>
          </div>
        </div>
      )}

      <FormSection title="Create Your Account">
          <form onSubmit={handleRegister} className="flex flex-col gap-[20px]">
            <FormInput
              label="Full Name"
              placeholder="John Doe"
              required
              value={registerData.name}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  name: e.target.value,
                })
              }
              error={errors.name}
            />
            <FormInput
              label="Email Address"
              type="email"
              placeholder="your.email@example.com"
              required
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  email: e.target.value,
                })
              }
              error={errors.email}
            />
            <FormInput
              label="Password"
              type="password"
              placeholder="Create a strong password (min 6 characters)"
              required
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  password: e.target.value,
                })
              }
              error={errors.password}
            />
            <FormInput
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              required
              value={registerData.confirmPassword}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  confirmPassword: e.target.value,
                })
              }
              error={errors.confirmPassword}
            />
            <div className="grid grid-cols-2 gap-[16px]">
              <FormInput
                label="Phone"
                type="tel"
                placeholder="+1 555 0100"
                required
                value={registerData.phone}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    phone: e.target.value,
                  })
                }
                error={errors.phone}
              />
              <FormInput
                label="Age"
                type="number"
                placeholder="22"
                required
                value={registerData.age}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    age: e.target.value,
                  })
                }
                error={errors.age}
              />
            </div>
            <FormInput
              label="Organisation"
              placeholder="Your University"
              required
              value={registerData.organisation}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  organisation: e.target.value,
                })
              }
              error={errors.organisation}
            />
            <FormTextarea
              label="Bio"
              placeholder="Tell us about yourself..."
              required
              value={registerData.bio}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  bio: e.target.value,
                })
              }
              rows={3}
            />
            <FormFileUpload
              label="Resume (PDF)"
              accept=".pdf"
              required
              onChange={handleResumeChange}
              currentFile={resumeFileName}
            />
            {errors.resume && (
              <span className="text-[12px] text-red-400" style={{ fontFamily: 'var(--font-body)' }}>
                {errors.resume}
              </span>
            )}
            <FormFileUpload
              label="Profile Photo"
              accept="image/*"
              onChange={handleProfilePhotoChange}
              currentFile={profilePhotoFileName}
            />
            <div className="flex flex-col gap-[12px]">
              <p className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                Professional Links (Required)
              </p>
              <FormInput
                label="GitHub"
                placeholder="https://github.com/username"
                required
                value={registerData.github}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    github: e.target.value,
                  })
                }
                error={errors.github}
              />
              <FormInput
                label="LinkedIn"
                placeholder="https://linkedin.com/in/username"
                required
                value={registerData.linkedin}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    linkedin: e.target.value,
                  })
                }
                error={errors.linkedin}
              />
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                Optional: Add your social links
              </p>
              <FormInput
                label="Portfolio"
                placeholder="https://yourportfolio.com"
                value={registerData.portfolio}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    portfolio: e.target.value,
                  })
                }
              />
              <FormInput
                label="LeetCode"
                placeholder="https://leetcode.com/username"
                value={registerData.leetcode}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    leetcode: e.target.value,
                  })
                }
              />
              <FormInput
                label="Kaggle"
                placeholder="https://kaggle.com/username"
                value={registerData.kaggle}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    kaggle: e.target.value,
                  })
                }
              />
              <FormInput
                label="Devfolio"
                placeholder="https://devfolio.co/@username"
                value={registerData.devfolio}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    devfolio: e.target.value,
                  })
                }
              />
              <FormInput
                label="Referral Code"
                placeholder="Enter referral code (if any)"
                value={registerData.referralCode}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    referralCode: e.target.value,
                  })
                }
              />
            </div>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </FormSection>
    </div>
  );
}


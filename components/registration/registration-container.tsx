"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Zap, Info, ExternalLink } from "lucide-react";
import { FormInput } from "./form-input";
import { FormTextarea } from "./form-textarea";
import { FormSelect } from "./form-select";
import { FormFileUpload } from "./form-file-upload";
import { FormSection } from "./form-section";
import { Button } from "./button";
import { Card } from "./card";
import { StickyAlert } from "./sticky-alert";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "./modal";

// PRODUCTION MODE - Debug features disabled
const DEBUG_MODE = false;

interface RegistrationContainerProps {
  onSuccess?: () => void;
}

export function RegistrationContainer({ onSuccess }: RegistrationContainerProps) {
  const router = useRouter();
  const { register } = useAuth();
  const { toast } = useToast();
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
    discord_username: "",
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
    codeforces: "",
    ctf: "",
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
  const [isCodeOfConductModalOpen, setIsCodeOfConductModalOpen] = useState(false);
  const [acceptedCodeOfConduct, setAcceptedCodeOfConduct] = useState(false);

  // DEBUG: Auto-fill function
  const handleAutoFill = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setRegisterData({
      name: `Test User ${randomId}`,
      email: `testuser${randomId}@example.com`,
      password: "Password@123",
      confirmPassword: "Password@123",
      discord_username: "testuser.discord",
      phone: "+1 555 123 4567",
      age: "22",
      organisation: "Test University",
      bio: "I'm a passionate developer interested in AI, web development, and hackathons. Looking forward to participating in Zenith!",
      github: "https://github.com/testuser",
      linkedin: "https://linkedin.com/in/testuser",
      portfolio: "https://testuser.dev",
      leetcode: "https://leetcode.com/testuser",
      kaggle: "https://kaggle.com/testuser",
      devfolio: "https://devfolio.co/@testuser",
      codeforces: "https://codeforces.com/profile/testuser",
      ctf: "https://ctftime.org/user/testuser",
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

  const validateField = (fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) return "Name is required";
        break;
      case 'email':
        if (!value.trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Please enter a valid email address";
        break;
      case 'password':
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!value) return "Password is required";
        if (!passwordRegex.test(value)) return "Password must be 8+ chars, incl. uppercase, lowercase, number, special char";
        break;
      case 'confirmPassword':
        if (!value) return "Please confirm your password";
        if (value !== registerData.password) return "Passwords do not match";
        break;
      case 'discord_username':
        if (!value.trim()) return "Discord username is required";
        break;
      case 'phone':
        if (!value.trim()) return "Phone is required";
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length < 10 || phoneDigits.length > 13) {
          return "Please enter a valid 10-digit phone number";
        }
        break;
      case 'age':
        if (!value || !value.trim()) return "Age is required";
        const ageNum = parseInt(value.trim());
        if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
          return "Please enter a valid age (13-100)";
        }
        break;
      case 'organisation':
        if (!value.trim()) return "Organisation is required";
        break;
      case 'bio':
        if (!value.trim()) return "Bio is required";
        break;
      case 'github':
        if (!value.trim()) return "GitHub link is required";
        const githubPattern = /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+(\/)?$/i;
        if (!githubPattern.test(value.trim())) {
          return "Please enter a valid GitHub URL (e.g., https://github.com/username)";
        }
        break;
      case 'linkedin':
        if (!value.trim()) return "LinkedIn link is required";
        const linkedinPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|profile)\/[\w-]+(\/)?$/i;
        if (!linkedinPattern.test(value.trim())) {
          return "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)";
        }
        break;
      default:
        return null;
    }
    return null;
  };

  const handleFieldBlur = (fieldName: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    const error = validateField(fieldName, value);
    
    if (error) {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const newErrors: Record<string, string> = {};
    
    const fieldsToValidate: Array<keyof typeof registerData> = [
      'name', 'email', 'password', 'confirmPassword', 'discord_username',
      'phone', 'age', 'organisation', 'bio', 'github', 'linkedin'
    ];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, registerData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    if (!resume) {
      newErrors.resume = "Resume is required";
    }
    if (!acceptedCodeOfConduct) {
      newErrors.codeOfConduct = "You must accept the Code of Conduct to register";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      let formattedPhone = registerData.phone.trim();
      const phoneDigits = formattedPhone.replace(/\D/g, '');
      
      if (phoneDigits.length === 10) {
        formattedPhone = `+91${phoneDigits}`;
      } else if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
        formattedPhone = `+${phoneDigits}`;
      } else if (phoneDigits.length === 11 && phoneDigits.startsWith('0')) {
        formattedPhone = `+91${phoneDigits.substring(1)}`;
      }
      // Create FormData for API request
      const formData = new FormData();
      formData.append('name', registerData.name);
      formData.append('email', registerData.email);
      formData.append('password', registerData.password);
      formData.append('discord_username', registerData.discord_username);
      formData.append('phone', formattedPhone);
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
      if (registerData.codeforces) formData.append('codeforces_link', registerData.codeforces);
      if (registerData.ctf) formData.append('ctf_profile', registerData.ctf);
      if (registerData.referralCode) formData.append('referral_code', registerData.referralCode);

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
      let errorMessage = "Registration failed. Please try again.";
      const fieldErrors: Record<string, string> = {};
      const fieldNameMap: Record<string, string> = {
        'github_link': 'github',
        'linkedin_link': 'linkedin',
        'portfolio_link': 'portfolio',
        'leetcode_profile': 'leetcode',
        'kaggle_link': 'kaggle',
        'devfolio_link': 'devfolio',
        'codeforces_link': 'codeforces',
        'ctf_profile': 'ctf',
      };
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        const fieldErrorsFromApi = (error as any).fieldErrors;
        if (fieldErrorsFromApi && typeof fieldErrorsFromApi === 'object') {
          Object.keys(fieldErrorsFromApi).forEach((backendField) => {
            const frontendField = fieldNameMap[backendField] || backendField;
            fieldErrors[frontendField] = fieldErrorsFromApi[backendField];
          });
        } else {
          const errorMsg = error.message.toLowerCase();
          if (errorMsg.includes('email already exists') || errorMsg.includes('email is already')) {
            fieldErrors.email = 'This email is already registered';
          } else if (errorMsg.includes('discord username already exists') || errorMsg.includes('discord username is already')) {
            fieldErrors.discord_username = 'This Discord username is already registered';
          } else if (errorMsg.includes('phone number already exists') || errorMsg.includes('phone number is already')) {
            fieldErrors.phone = 'This phone number is already registered';
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        setAlert({
          type: "error",
          message: "Please fix the errors highlighted in red below.",
        });
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: errorMessage,
        });
      } else {
        setAlert({
          type: "error",
          message: errorMessage,
        });
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const maxSize = 1 * 1024 * 1024; // 1MB
      
      if (file.type !== 'application/pdf') {
        setErrors({ ...errors, resume: "Please upload a PDF file" });
        return;
      }
      
      if (file.size > maxSize) {
        setErrors({ ...errors, resume: "Resume file size must be under 1MB" });
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
      const file = files[0];
      const maxSize = 1 * 1024 * 1024; // 1MB
      
      if (!file.type.includes('image')) {
        setErrors({ ...errors, profilePhoto: "Please upload an image file" });
        return;
      }
      
      if (file.size > maxSize) {
        setErrors({ ...errors, profilePhoto: "Profile photo file size must be under 1MB" });
        return;
      }
      
      setProfilePhoto(file);
      setProfilePhotoFileName(file.name);
      if (errors.profilePhoto) {
        const newErrors = { ...errors };
        delete newErrors.profilePhoto;
        setErrors(newErrors);
      }
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
          <>
            <Button onClick={handleAutoFill} variant="secondary">
              <Zap className="w-4 h-4" />
              Auto-Fill (Debug)
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Debug Toast",
                  description: "If you can see this, toasts are working.",
                  variant: "destructive",
                });
              }}
              variant="secondary"
            >
              <Zap className="w-4 h-4" />
              Show Toast (Debug)
            </Button>
          </>
        )}
      </div>

      {alert && (
        <StickyAlert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Card about filling more fields */}
      <Card className="bg-[rgba(255,77,0,0.1)] border-[#ff4d00]/30">
        <div className="flex items-start gap-[12px]">
          <Info className="w-5 h-5 text-[#ff4d00] flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-[4px]">
            <p className="text-[14px] text-white font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
              💡 Complete Your Profile
            </p>
            <p className="text-[13px] text-white/80" style={{ fontFamily: 'var(--font-body)' }}>
              Filling out more fields increases your chances of being selected by teams. The more complete your profile, the more likely you are to stand out to potential team members!
            </p>
          </div>
        </div>
      </Card>

      {DEBUG_MODE && (
        <div className="backdrop-blur-[2.5px] backdrop-filter bg-[rgba(255,77,0,0.2)] border border-[#ff4d00] rounded-[15px] p-[12px] flex items-center gap-[12px]">
          <Zap className="w-5 h-5 text-[#ff4d00]" />
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
              onBlur={handleFieldBlur('name')}
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
              onBlur={handleFieldBlur('email')}
              error={errors.email}
            />
            <FormInput
              label="Password"
              type="password"
              placeholder="8+ characters with uppercase, lowercase, number, special character"
              required
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  password: e.target.value,
                })
              }
              onBlur={handleFieldBlur('password')}
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
              onBlur={handleFieldBlur('confirmPassword')}
              error={errors.confirmPassword}
            />
            <div className="grid grid-cols-2 gap-[16px]">
              <FormInput
              label="Discord Username"
              placeholder="username"
              required
              value={registerData.discord_username}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  discord_username: e.target.value,
                })
              }
              onBlur={handleFieldBlur('discord_username')}
              error={errors.discord_username}
              />
              <FormInput
                label="Phone"
                type="tel"
                placeholder="9876543210"
                required
                value={registerData.phone}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    phone: e.target.value,
                  })
                }
                onBlur={handleFieldBlur('phone')}
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
                onBlur={handleFieldBlur('age')}
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
              onBlur={handleFieldBlur('organisation')}
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
              onBlur={handleFieldBlur('bio')}
              rows={3}
              error={errors.bio}
            />
            <FormFileUpload
              label="Resume (PDF)"
              accept=".pdf"
              required
              onChange={handleResumeChange}
              currentFile={resumeFileName}
            />
            {errors.resume && (
              <span className="text-[12px] text-[#ff4d00]" style={{ fontFamily: 'var(--font-body)' }}>
                {errors.resume}
              </span>
            )}
            <FormFileUpload
              label="Profile Photo"
              accept="image/*"
              onChange={handleProfilePhotoChange}
              currentFile={profilePhotoFileName}
            />
            {errors.profilePhoto && (
              <span className="text-[12px] text-red-400" style={{ fontFamily: 'var(--font-body)' }}>
                {errors.profilePhoto}
              </span>
            )}
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
                onBlur={handleFieldBlur('github')}
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
                onBlur={handleFieldBlur('linkedin')}
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
                label="Codeforces"
                placeholder="https://codeforces.com/profile/username"
                value={registerData.codeforces}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    codeforces: e.target.value,
                  })
                }
              />
              <FormInput
                label="CTF Profile"
                placeholder="your CTF profile URL"
                value={registerData.ctf}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    ctf: e.target.value,
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
            {/* Code of Conduct Section */}
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-start gap-[12px]">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    id="codeOfConduct"
                    checked={acceptedCodeOfConduct}
                    onChange={(e) => {
                      setAcceptedCodeOfConduct(e.target.checked);
                      if (errors.codeOfConduct) {
                        const newErrors = { ...errors };
                        delete newErrors.codeOfConduct;
                        setErrors(newErrors);
                      }
                    }}
                    className="w-[18px] h-[18px] rounded-[4px] border border-[rgba(255,255,255,0.38)] backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.2)] text-[#ff4d00] focus:ring-2 focus:ring-[#ff4d00] focus:ring-offset-0 cursor-pointer appearance-none checked:bg-[#ff4d00] checked:border-[#ff4d00] transition-all"
                    style={{
                      backgroundImage: acceptedCodeOfConduct 
                        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%23ffffff' stroke-width='2' d='M2 6l3 3 5-5'/%3E%3C/svg%3E")`
                        : 'none',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundSize: '12px 12px'
                    }}
                  />
                </div>
                <label
                  htmlFor="codeOfConduct"
                  className="text-[14px] text-white leading-[20px] cursor-pointer flex-1"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsCodeOfConductModalOpen(true);
                    }}
                    className="text-[#ff4d00] hover:text-[#ff8800] underline inline-flex items-center gap-1 transition-colors"
                  >
                    Code of Conduct
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </label>
              </div>
              {errors.codeOfConduct && (
                <span className="text-[12px] text-[#ff4d00]" style={{ fontFamily: 'var(--font-body)' }}>
                  {errors.codeOfConduct}
                </span>
              )}
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting || !acceptedCodeOfConduct}
            >
              {isSubmitting && <Spinner size="sm" className="mr-2" />}
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </FormSection>
        {/* Code of Conduct Modal */}
        <Modal
          isOpen={isCodeOfConductModalOpen}
          onClose={() => setIsCodeOfConductModalOpen(false)}
          title="Code of Conduct"
        >
          <div className="flex flex-col gap-[24px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
         

            <div className="flex flex-col gap-[16px]">
              <div>
                <h3 className="text-[18px] font-semibold mb-[8px]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Overview
                </h3>
                <p className="text-[14px] leading-[22px] opacity-90">
                  Point Blank is committed to providing a safe, inclusive, and respectful environment for all hackathon participants. This event is about building the future of work in an AI-native world, and that requires professionalism, integrity, and mutual respect.
                </p>
                <p className="text-[14px] leading-[22px] opacity-90 mt-[8px]">
                  By participating, you agree to follow this Code of Conduct.
                </p>
              </div>

              <div>
                <h3 className="text-[18px] font-semibold mb-[8px]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Expected Behavior
                </h3>
                <p className="text-[14px] leading-[22px] opacity-90 mb-[8px]">
                  Participants must:
                </p>
                <ul className="list-disc list-inside space-y-[4px] text-[14px] leading-[22px] opacity-90 ml-[8px]">
                  <li>Treat others with respect and professionalism</li>
                  <li>Communicate constructively and collaborate in good faith</li>
                  <li>Compete fairly and honestly</li>
                  <li>Respect diverse perspectives and backgrounds</li>
                  <li>Follow all hackathon rules and guidelines</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[18px] font-semibold mb-[8px]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Prohibited Conduct
                </h3>
                <p className="text-[14px] leading-[22px] opacity-90 mb-[8px]">
                  The following will not be tolerated:
                </p>
                <ul className="list-disc list-inside space-y-[4px] text-[14px] leading-[22px] opacity-90 ml-[8px]">
                  <li>Harassment, discrimination, or offensive behavior</li>
                  <li>Plagiarism or misrepresentation of work</li>
                  <li>Cheating, sabotage, or misuse of platforms</li>
                  <li>Disruptive or unethical conduct in any form</li>
                </ul>
                <p className="text-[14px] leading-[22px] opacity-90 mt-[8px]">
                  This applies across all hackathon-related spaces and platforms.
                </p>
              </div>

              <div>
                <h3 className="text-[18px] font-semibold mb-[8px]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Intellectual Property
                </h3>
                <p className="text-[14px] leading-[22px] opacity-90 mb-[8px]">
                  By participating, you agree that:
                </p>
                <ul className="list-disc list-inside space-y-[4px] text-[14px] leading-[22px] opacity-90 ml-[8px]">
                  <li>All code, submissions, designs, documentation, and intellectual property created during the hackathon are the exclusive property of FinalRound AI.</li>
                  <li>Participants may reference their work for non-commercial portfolio or resume use unless otherwise stated.</li>
                  <li>FinalRound AI reserves the right to use, modify, and commercialize submissions.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[18px] font-semibold mb-[8px]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Original Work & AI Usage
                </h3>
                <ul className="list-disc list-inside space-y-[4px] text-[14px] leading-[22px] opacity-90 ml-[8px]">
                  <li>All submissions must be created during the hackathon</li>
                  <li>Use of AI tools is allowed but must be ethical and license-compliant</li>
                  <li>Any third-party tools or APIs must follow their respective terms</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[18px] font-semibold mb-[8px]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Enforcement
                </h3>
                <ul className="list-disc list-inside space-y-[4px] text-[14px] leading-[22px] opacity-90 ml-[8px]">
                  <li>Point Blank reserves the right to take action for violations, including warnings, disqualification, or removal from the event.</li>
                  <li>Reports of misconduct will be handled confidentially.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[18px] font-semibold mb-[8px]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Final Note
                </h3>
                <p className="text-[14px] leading-[22px] opacity-90">
                  This hackathon is about building real systems for the future of work.
                </p>
                <p className="text-[14px] leading-[22px] opacity-90 mt-[8px]">
                  Bring curiosity, build responsibly, and respect the community.
                </p>
                <p className="text-[14px] leading-[22px] opacity-90 mt-[12px] text-right">
                  — Point Blank
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-[16px] border-t border-[rgba(255,255,255,0.2)]">
              <Button
                onClick={() => {
                  setAcceptedCodeOfConduct(true);
                  setIsCodeOfConductModalOpen(false);
                  if (errors.codeOfConduct) {
                    const newErrors = { ...errors };
                    delete newErrors.codeOfConduct;
                    setErrors(newErrors);
                  }
                }}
                variant="primary"
              >
                I Accept
              </Button>
            </div>
          </div>
        </Modal>
    </div>
  );
}


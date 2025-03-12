"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StarsBackground } from "@/components/ui/stars-background";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from "next/link";
import NavButtons from "@/components/navbar";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, X, Plus } from "lucide-react";

// Add CSS for shake animation
const shakeAnimation = {
  x: [-10, 10, -10, 10, -5, 5, -2, 2, 0],
  transition: { duration: 0.5 }
};

// Multi-link input component for CP and CTF profiles
const MultiLinkInput = ({ 
  links, 
  setLinks, 
  placeholder,
  hasError,
  setHasError
}: { 
  links: string[], 
  setLinks: (links: string[]) => void,
  placeholder: string,
  hasError: boolean[],
  setHasError: (errors: boolean[]) => void
}) => {
  const addLink = () => {
    setLinks([...links, '']);
    setHasError([...hasError, false]);
  };

  const removeLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
    
    const newErrors = [...hasError];
    newErrors.splice(index, 1);
    setHasError(newErrors);
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
    
    // Clear error when typing
    if (hasError[index]) {
      const newErrors = [...hasError];
      newErrors[index] = false;
      setHasError(newErrors);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  };

  return (
    <div className="space-y-2">
      {links.map((link, index) => (
        <div key={index} className="flex items-center space-x-2">
          <motion.div 
            className="relative flex-1"
            whileHover={{ scale: 1.02 }}
            animate={hasError[index] ? shakeAnimation : undefined}
          >
            <Input
              type="url" 
              value={link}
              onChange={(e) => updateLink(index, e.target.value)}
              placeholder={`${placeholder} ${index + 1}`}
              className={`bg-transparent border ${hasError[index] ? 'border-red-500' : 'border-gray-300'}`}
            />
            {hasError[index] && (
              <p className="text-xs text-red-500 mt-1">Please enter a valid URL</p>
            )}
          </motion.div>
          <Button 
            type="button"
            variant="outline"
            size="icon"
            onClick={() => removeLink(index)}
            className="flex-shrink-0 bg-transparent border-border border-gray-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline" 
        size="sm"
        onClick={addLink}
        className="mt-2 bg-transparent border-border border-gray-300"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {placeholder}
      </Button>
    </div>
  );
};

export default function Signup() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stdCode, setStdCode] = useState("+91"); 
  const [phone, setPhone] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  
  // Optional fields
  const [leetcodeProfile, setLeetcodeProfile] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [linkedinLink, setLinkedinLink] = useState("");
  const [cpProfiles, setCpProfiles] = useState<string[]>(['']);
  const [ctfProfileLinks, setCtfProfileLinks] = useState<string[]>(['']);
  const [kaggleLink, setKaggleLink] = useState("");
  const [devfolioLink, setDevfolioLink] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [age, setAge] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setshowConfPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const countryCodes = [
    { value: "+91", label: "+91 (India)" },
    { value: "+1", label: "+1 (USA/Canada)" },
    { value: "+44", label: "+44 (UK)" },
    { value: "+61", label: "+61 (Australia)" },
    { value: "+86", label: "+86 (China)" },
    { value: "+49", label: "+49 (Germany)" },
    { value: "+33", label: "+33 (France)" },
    { value: "+81", label: "+81 (Japan)" },
  ];
  
  // Add validation states
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [resumeError, setResumeError] = useState(false);
  const [githubError, setGithubError] = useState(false);
  const [linkedinError, setLinkedinError] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState(false);
  const [portfolioError, setPortfolioError] = useState(false);
  const [kaggleError, setKaggleError] = useState(false);
  const [devfolioError, setDevfolioError] = useState(false);
  const [cpProfilesErrors, setCpProfilesErrors] = useState<boolean[]>([false]);
  const [ctfProfilesErrors, setCtfProfilesErrors] = useState<boolean[]>([false]);
  const [ageError, setAgeError] = useState(false);

  // Add reference to file input element
  const resumeInputRef = useRef<HTMLInputElement>(null);
  
  // Add state for resume file name
  const [resumeFileName, setResumeFileName] = useState<string>("");

  const [colleges, setColleges] = useState<{ id: string, name: string }[]>([]);
  const [collegeSearchInput, setCollegeSearchInput] = useState("");
  const [isCustomCollege, setIsCustomCollege] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const collegeDropdownRef = useRef<HTMLDivElement>(null);

  // URL validation patterns
  const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/;
  const linkedinUrlPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?$/;
  const leetcodeUrlPattern = /^https?:\/\/(www\.)?leetcode\.com\/[a-zA-Z0-9_-]+\/?$/;
  const kaggleUrlPattern = /^https?:\/\/(www\.)?kaggle\.com\/[a-zA-Z0-9_-]+\/?$/;
  const devfolioUrlPattern = /^https?:\/\/(www\.)?devfolio\.co\/@?[a-zA-Z0-9_-]+\/?$/;
  
  // Generic URL validation function
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty values for optional fields
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch('/api/colleges');
        const data = await response.json();
        if (data.status === "success") {
          setColleges(data.colleges);
        } else {
          console.error("Failed to fetch colleges:", data.message);
        }
      } catch (error) {
        console.error("Error fetching colleges:", error);
      }
    };

    fetchColleges();
    
    // Add click outside listener to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter colleges based on search input
  const filteredColleges = collegeSearchInput
    ? colleges.filter(college => 
        college.name.toLowerCase().includes(collegeSearchInput.toLowerCase()))
    : colleges;

  const handleCollegeSelect = (collegeName: string) => {
    setCollegeName(collegeName);
    setCollegeSearchInput(collegeName);
    setIsCustomCollege(false);
    setDropdownVisible(false);
  };

  const handleCollegeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCollegeSearchInput(value);
    
    // If the input doesn't match any college exactly, it's potentially a custom college
    const matchingCollege = colleges.find(
      college => college.name.toLowerCase() === value.toLowerCase()
    );
    
    if (!matchingCollege && value.trim()) {
      setIsCustomCollege(true);
      setCollegeName(value); // Update collegeName with the custom value
    } else {
      setIsCustomCollege(false);
      // Only update collegeName if a college is selected from the dropdown
      if (matchingCollege) {
        setCollegeName(matchingCollege.name);
      } else {
        setCollegeName("");
      }
    }
    
    // Show dropdown when typing
    if (value.trim()) {
      setDropdownVisible(true);
    } else {
      setDropdownVisible(false);
    }
  };

  // Add this new function to handle key press in college input
  const handleCollegeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed and we have a custom college
    if (e.key === 'Enter' && isCustomCollege && collegeSearchInput.trim()) {
      e.preventDefault(); // Prevent form submission
      
      try {
        // Call the API to add the new college
        const response = await fetch('/api/colleges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: collegeSearchInput.trim() }),
        });
        
        const data = await response.json();
        
        if (data.status === "success") {
          // Update the list of colleges with the new one
          setColleges(prev => [...prev, { 
            id: data.college.id, 
            name: data.college.name 
          }]);
          
          // Close dropdown and set college name
          setCollegeName(data.college.name);
          setCollegeSearchInput(data.college.name);
          setDropdownVisible(false);
          
          // Show success message
          toast.success("College added successfully!", {
            position: "top-center",
            autoClose: 2000,
            theme: "dark",
          });
          
          // College is now from database, no longer custom
          setIsCustomCollege(false);
        }
      } catch (error) {
        console.error("Error adding college:", error);
        toast.error("Failed to add college", {
          position: "top-center",
          theme: "dark",
        });
      }
    }
  };

  const validateStep1 = () => {
    let isValid = true;
    
    // Reset error states
    setNameError(false);
    setEmailError(false);
    setPasswordError(false);
    setConfirmPasswordError(false);
    
    if (!name.trim()) {
      setNameError(true);
      isValid = false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      isValid = false;
    }
    if (!password) {
      setPasswordError(true);
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError(true);
      setError("Password must be at least 6 characters long");
      isValid = false;
    }
    if (!confirmPassword) {
      setConfirmPasswordError(true);
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      setError("Passwords do not match");
      isValid = false;
    }
    
    return isValid;
  };

  const validateStep2 = () => {
    let isValid = true;
    
    // Reset error states
    setPhoneError(false);
    setResumeError(false);
    
    if (!phone.trim()) {
      setPhoneError(true);
      isValid = false;
    } else if (phone.length !== 10) {
      setPhoneError(true);
      isValid = false;
    }
    
    if (!resume) {
      setResumeError(true);
      isValid = false;
    }
    
    return isValid;
  };

  const validateStep3 = () => {
    let isValid = true;
    
    // Reset error states
    setGithubError(false);
    setLinkedinError(false);
    setLeetcodeError(false);
    setPortfolioError(false);
    
    // Validate GitHub link
    if (!githubLink.trim()) {
      setGithubError(true);
      setError("GitHub profile link is required");
      isValid = false;
    } else if (!githubUrlPattern.test(githubLink)) {
      setGithubError(true);
      setError("Please enter a valid GitHub profile URL (https://github.com/username)");
      isValid = false;
    }
    
    // Validate LinkedIn link
    if (!linkedinLink.trim()) {
      setLinkedinError(true);
      setError("LinkedIn profile link is required");
      isValid = false;
    } else if (!linkedinUrlPattern.test(linkedinLink)) {
      setLinkedinError(true);
      setError("Please enter a valid LinkedIn profile URL (https://linkedin.com/in/username)");
      isValid = false;
    }
    
    // Validate LeetCode link (optional)
    if (leetcodeProfile && !leetcodeUrlPattern.test(leetcodeProfile)) {
      setLeetcodeError(true);
      setError("Please enter a valid LeetCode profile URL (https://leetcode.com/username)");
      isValid = false;
    }
    
    // Validate Portfolio link (optional)
    if (portfolioLink && !isValidUrl(portfolioLink)) {
      setPortfolioError(true);
      setError("Please enter a valid portfolio URL");
      isValid = false;
    }
    
    return isValid;
  };

  const validateStep4 = () => {
    let isValid = true;
    
    // Reset error states
    setKaggleError(false);
    setDevfolioError(false);
    const newCpErrors = cpProfiles.map(() => false);
    const newCtfErrors = ctfProfileLinks.map(() => false);
    setCpProfilesErrors(newCpErrors);
    setCtfProfilesErrors(newCtfErrors);
    
    // Validate CP profiles
    cpProfiles.forEach((link, index) => {
      if (link && !isValidUrl(link)) {
        newCpErrors[index] = true;
        isValid = false;
      }
    });
    
    // Validate CTF profiles
    ctfProfileLinks.forEach((link, index) => {
      if (link && !isValidUrl(link)) {
        newCtfErrors[index] = true;
        isValid = false;
      }
    });
    
    // Update error states
    setCpProfilesErrors(newCpErrors);
    setCtfProfilesErrors(newCtfErrors);
    
    // Validate Kaggle link (optional)
    if (kaggleLink && !kaggleUrlPattern.test(kaggleLink)) {
      setKaggleError(true);
      setError("Please enter a valid Kaggle profile URL (https://kaggle.com/username)");
      isValid = false;
    }
    
    // Validate Devfolio link (optional)
    if (devfolioLink && !devfolioUrlPattern.test(devfolioLink)) {
      setDevfolioError(true);
      setError("Please enter a valid Devfolio profile URL (https://devfolio.co/@username)");
      isValid = false;
    }
    
    if (!isValid && !error) {
      setError("Please fix the validation errors in the profile links");
    }
    
    return isValid;
  };

  const validateStep5 = () => {
    let isValid = true;
    
    // Reset error states
    setAgeError(false);
    
    // Validate age (required)
    if (!age.trim()) {
      setAgeError(true);
      setError("Age is required");
      isValid = false;
    } else {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        setAgeError(true);
        setError("Please enter a valid age between 1 and 120");
        isValid = false;
      }
    }
    
    return isValid;
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        setResumeError(true);
        setError("Please upload a PDF file for your resume");
        return;
      }
      
      // Check file size (limit to 500KB)
      const fileSizeInKB = file.size / 1024;
      if (fileSizeInKB > 500) {
        setResumeError(true);
        setError("Resume file size must be less than 500KB");
        return;
      }
      
      setResume(file);
      setResumeFileName(file.name);
      if (resumeError) setResumeError(false);
      if (error) setError("");
    }
  };

  const handleNext = () => {
    setError("");  // Clear any existing errors
    
    if (step === 0) {
      const isValid = validateStep1();
      if (isValid) setStep(1);
    } else if (step === 1) {
      const isValid = validateStep2();
      if (isValid) setStep(2);
    } else if (step === 2) {
      const isValid = validateStep3();
      if (isValid) setStep(3);
    } else if (step === 3) {
      const isValid = validateStep4();
      if (isValid) setStep(4);
    }
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
  
    const step1Valid = validateStep1();
    const step2Valid = validateStep2();
    const step3Valid = validateStep3();
    const step4Valid = validateStep4();
    const step5Valid = validateStep5();
    
    if (!step1Valid || !step2Valid || !step3Valid || !step4Valid || !step5Valid) {
      setIsSubmitting(false);
      return;
    }
  
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('phone', stdCode + phone);
    if (resume) formData.append('resume', resume);
    if (profilePic) formData.append('profile_picture', profilePic);
    formData.append('leetcode_profile', leetcodeProfile);
    formData.append('github_link', githubLink);
    formData.append('linkedin_link', linkedinLink);
    formData.append('competitive_profiles', JSON.stringify(cpProfiles.filter(link => link.trim())));
    formData.append('ctf_profiles', JSON.stringify(ctfProfileLinks.filter(link => link.trim())));
    formData.append('kaggle_link', kaggleLink);
    formData.append('devfolio_link', devfolioLink);
    formData.append('portfolio_link', portfolioLink);
    formData.append('bio', shortBio);
    formData.append('age', age);
    formData.append('college_name', collegeName);
    formData.append('referral_code', referralCode);
    formData.append('is_custom_college', isCustomCollege.toString());
  
    try {
      // Replace direct fetch with register function from useAuth hook
      const userId = await register(formData);
      
      toast.success(`Account created successfully for ${email}!`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        style: {
          background: "#1a1a2e",
          borderLeft: "4px solid #2ad8db",
          color: "#fff",
        },
      });

      // User is already logged in via useAuth, redirect to dashboard
      setTimeout(() => {
        router.push('/participants'); // Redirect to dashboard instead of home
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
    <div className="min-h-screen flex items-center justify-center relative p-4">
        {/* Navigation */}
        <div className="fixed top-4 w-full  justify-end z-50">
          <NavButtons disableFixedPositioning={true} />
        </div>

        {/* <Link href="/" className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2 py-2 px-4 rounded-md hover:bg-gray-800/50 z-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </Link> */}
        
        <StarsBackground starDensity={0.0002} allStarsTwinkle={true} />
        {/* Add ToastContainer for notifications */}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastStyle={{
            background: "#1a1a2e",
            color: "#fff",
            borderLeft: "4px solid #2ad8db",
          }}
        />
      <div className="relative w-full max-w-xl p-8 space-y-6 rounded-lg shadow-lg border mt-16">
        <div className="absolute -inset-4 bg-gradient-to-r from-[#2ad8db33] to-[#113341ad] blur-3xl rounded-lg"></div>
      <motion.div
        initial={{ opacity: 0, scale: .95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: .3 }}
        className="relative"
      >
        <div className="relative space-y-2 text-center">
          <h1 className="text-3xl font-bold mb-1">Welcome Programmer</h1>
          <p className="text-muted-foreground">
            Enter your credentials
          </p>
          <br />
          <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
          <div className="bg-green-600 h-1 rounded-full" style={{ width: `${(step + 1) / 5 * 100}%` }}></div>
        </div>
          <br/>
        </div>

        {error && (
          <div className="text-red-500 text-center">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>

          {/* Step 1: Basic Information */}
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className='relative'
                  animate={nameError ? shakeAnimation : undefined}
                >
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Enter Full Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(false);
                    }}
                    className={`bg-transparent border ${nameError ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                </motion.div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className='relative'
                  animate={emailError ? shakeAnimation : undefined}
                >
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(false);
                    }}
                    className={`bg-transparent border ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                </motion.div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className='relative'
                  animate={passwordError ? shakeAnimation : undefined}
                >
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) {
                        setPasswordError(false);
                        setError("");
                      }
                    }}
                    className={`bg-transparent border ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  <motion.button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    onClick={() => setShowPassword(!showPassword)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </motion.button>
                </motion.div>
                
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className='relative'
                  animate={confirmPasswordError ? shakeAnimation : undefined}
                >
                  <Input 
                    id="confirmPassword" 
                    type={showConfPassword ? "text" : "password"} 
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) {
                        setConfirmPasswordError(false);
                        setError("");
                      }
                    }}
                    className={`bg-transparent border ${confirmPasswordError ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  <motion.button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    onClick={() => setshowConfPassword(!showConfPassword)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showConfPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </motion.button>
                </motion.div>
              </div>
              
              <Button type="button" className="w-full my-1" size="lg" onClick={handleNext}>
                Next
              </Button>
            </>
          )}

          {/* Step 2: Contact and Resume */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} className="relative w-1/5">
                    <select 
                      id="stdCode"
                      value={stdCode}
                      onChange={(e) => setStdCode(e.target.value)}
                      className="w-full p-2 bg-transparent border border-gray-300 rounded-md appearance-none"
                      required
                      style={{ 
                        WebkitAppearance: 'none',
                        MozAppearance: 'none' 
                      }}
                    >
                      {countryCodes.map((code) => (
                        <option 
                          key={code.value} 
                          value={code.value}
                          className="bg-zinc-800 text-white"
                        >
                          {code.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className='relative w-4/5'
                      animate={phoneError ? shakeAnimation : undefined}
                    >
                      <Input 
                        id="phone" 
                        type="tel"
                        placeholder="XXXXX XXXXX"
                        value={phone.replace(/(\d{5})(?=\d)/g, '$1 ')}
                        onChange={(e) => {
                          const input = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(input);
                          if (phoneError) setPhoneError(false);
                        }}
                        className={`bg-transparent border tracking-widest ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
                        required
                        maxLength={12}
                      />
                    </motion.div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your phone number will not be visible to the public</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resume">Resume <span className="text-red-500">*</span></Label>
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  className={`relative border-2 border-dashed rounded-lg p-6 ${
                    resumeError ? 'border-red-500 bg-red-50/10' : 'border-gray-300 bg-gray-50/10'
                  } hover:border-heading transition-colors cursor-pointer text-center`}
                  animate={resumeError ? shakeAnimation : undefined}
                  onClick={() => resumeInputRef.current?.click()}
                >
                  <input 
                    ref={resumeInputRef}
                    id="resume" 
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeChange}
                    className="hidden"
                    required
                  />
                  
                  {!resumeFileName ? (
                    <div className="flex flex-col items-center justify-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-10 w-10 text-gray-400 mb-2"
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                        />
                      </svg>
                      <p className="text-sm text-gray-400">Click to upload your resume (PDF only)</p>
                      <p className="text-xs text-gray-400 mt-1">Maximum size: 500KB</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-8 w-8 text-green-500 mr-2"
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                      <div className="text-left">
                        <p className="text-sm font-medium truncate max-w-[200px]">{resumeFileName}</p>
                        <p className="text-xs text-gray-400">Click to change file</p>
                      </div>
                    </div>
                  )}
                </motion.div>
                {resumeError && !error && <p className="text-xs text-red-500 mt-1">Please upload your resume in PDF format (max 500KB)</p>}
              </div>
              
              <div className="flex justify-between">
                <Button type="button" className="w-1/2 mr-2" onClick={handleBack}>
                  Back
                </Button>
                <Button type="button" className="w-1/2 ml-2" onClick={handleNext}>
                  Next
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Professional Profiles */}
          {step === 2 && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">Professional Profiles</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="githubLink">GitHub Link <span className="text-red-500">*</span></Label>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    className='relative'
                    animate={githubError ? shakeAnimation : undefined}
                  >
                    <Input 
                      id="githubLink" 
                      type="text"
                      placeholder="GitHub Profile URL (e.g., https://github.com/username)"
                      value={githubLink}
                      onChange={(e) => {
                        setGithubLink(e.target.value);
                        if (githubError) {
                          setGithubError(false);
                          setError("");
                        }
                      }}
                      className={`bg-transparent border ${githubError ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                  </motion.div>
                  {githubError && !error && (
                    <p className="text-xs text-red-500 mt-1">Valid GitHub profile link is required (https://github.com/username)</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="linkedinLink">LinkedIn Link <span className="text-red-500">*</span></Label>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    className='relative'
                    animate={linkedinError ? shakeAnimation : undefined}
                  >
                    <Input 
                      id="linkedinLink" 
                      type="text"
                      placeholder="LinkedIn Profile URL (e.g., https://linkedin.com/in/username)"
                      value={linkedinLink}
                      onChange={(e) => {
                        setLinkedinLink(e.target.value);
                        if (linkedinError) {
                          setLinkedinError(false);
                          setError("");
                        }
                      }}
                      className={`bg-transparent border ${linkedinError ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                  </motion.div>
                  {linkedinError && !error && (
                    <p className="text-xs text-red-500 mt-1">Valid LinkedIn profile link is required (https://linkedin.com/in/username)</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="leetcodeProfile">LeetCode Profile</Label>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    className='relative'
                    animate={leetcodeError ? shakeAnimation : undefined}
                  >
                    <Input 
                      id="leetcodeProfile" 
                      type="text"
                      placeholder="LeetCode Profile URL (e.g., https://leetcode.com/username)"
                      value={leetcodeProfile}
                      onChange={(e) => {
                        setLeetcodeProfile(e.target.value);
                        if (leetcodeError) {
                          setLeetcodeError(false);
                          setError("");
                        }
                      }}
                      className={`bg-transparent border ${leetcodeError ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </motion.div>
                  {leetcodeError && !error && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid LeetCode profile URL</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="portfolioLink">Portfolio Link</Label>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    className='relative'
                    animate={portfolioError ? shakeAnimation : undefined}
                  >
                    <Input 
                      id="portfolioLink" 
                      type="text"
                      placeholder="Personal Portfolio URL"
                      value={portfolioLink}
                      onChange={(e) => {
                        setPortfolioLink(e.target.value);
                        if (portfolioError) {
                          setPortfolioError(false);
                          setError("");
                        }
                      }}
                      className={`bg-transparent border ${portfolioError ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </motion.div>
                  {portfolioError && !error && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid URL</p>
                  )}
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button type="button" className="w-1/2 mr-2" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="button" className="w-1/2 ml-2" onClick={handleNext}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Step 4: Competition & Dev Profiles */}
          {step === 3 && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">Competition & Dev Profiles</h3>
                
                <div className="space-y-2">
                  <Label>Competitive Programming Profile Links</Label>
                  <MultiLinkInput
                    links={cpProfiles}
                    setLinks={setCpProfiles}
                    placeholder="CP Profile URL"
                    hasError={cpProfilesErrors}
                    setHasError={setCpProfilesErrors}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>CTF Profile Links</Label>
                  <MultiLinkInput
                    links={ctfProfileLinks}
                    setLinks={setCtfProfileLinks}
                    placeholder="CTF Profile URL"
                    hasError={ctfProfilesErrors}
                    setHasError={setCtfProfilesErrors}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="kaggleLink">Kaggle Link</Label>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    className='relative'
                    animate={kaggleError ? shakeAnimation : undefined}
                  >
                    <Input 
                      id="kaggleLink" 
                      type="text"
                      placeholder="Kaggle Profile URL (e.g., https://kaggle.com/username)"
                      value={kaggleLink}
                      onChange={(e) => {
                        setKaggleLink(e.target.value);
                        if (kaggleError) {
                          setKaggleError(false);
                          setError("");
                        }
                      }}
                      className={`bg-transparent border ${kaggleError ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </motion.div>
                  {kaggleError && !error && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid Kaggle profile URL</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="devfolioLink">Devfolio Link</Label>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    className='relative'
                    animate={devfolioError ? shakeAnimation : undefined}
                  >
                    <Input 
                      id="devfolioLink" 
                      type="text"
                      placeholder="Devfolio Profile URL (e.g., https://devfolio.co/@username)"
                      value={devfolioLink}
                      onChange={(e) => {
                        setDevfolioLink(e.target.value);
                        if (devfolioError) {
                          setDevfolioError(false);
                          setError("");
                        }
                      }}
                      className={`bg-transparent border ${devfolioError ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </motion.div>
                  {devfolioError && !error && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid Devfolio profile URL</p>
                  )}
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button type="button" className="w-1/2 mr-2" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="button" className="w-1/2 ml-2" onClick={handleNext}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Step 5: Personal Information */}
          {step === 4 && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="age">Age <span className="text-red-500">*</span></Label>
                    <motion.div 
                      whileHover={{ scale: 1.05 }} 
                      className='relative'
                      animate={ageError ? shakeAnimation : undefined}
                    >
                      <Input 
                        id="age" 
                        type="number"
                        placeholder="Your Age"
                        value={age}
                        onChange={(e) => {
                          const input = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setAge(input);
                          if (ageError) {
                            setAgeError(false);
                            setError("");
                          }
                        }}
                        min="1"
                        max="120"
                        className={`bg-transparent border ${ageError ? 'border-red-500' : 'border-gray-300'}`}
                        required
                      />
                    </motion.div>
                    {ageError && !error && (
                      <p className="text-xs text-red-500 mt-1">Please enter a valid age</p>
                    )}
                    </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="collegeName">College Name</Label>
                    <motion.div 
                      whileHover={{ scale: 1.05 }} 
                      className='relative'
                      ref={collegeDropdownRef}
                    >
                      <Input 
                        id="collegeName" 
                        type="text"
                        placeholder="Search or enter your college name"
                        value={collegeSearchInput}
                        onChange={handleCollegeInputChange}
                        onKeyDown={handleCollegeKeyDown}
                        onFocus={() => collegeSearchInput && setDropdownVisible(true)}
                        className="bg-transparent border border-gray-300"
                        required
                      />
                      
                      {dropdownVisible && (
                        <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredColleges.length > 0 ? (
                            filteredColleges.map((college) => (
                              <div 
                                key={college.id} 
                                className="px-4 py-2 hover:bg-gray-800 cursor-pointer"
                                onClick={() => handleCollegeSelect(college.name)}
                              >
                                {college.name}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-400">
                              {collegeSearchInput ? (
                                <>
                                  <p>&quot;{collegeSearchInput}&quot; not found</p>
                                  <p className="text-xs mt-1 text-gray-500">Press Enter to add this college</p>
                                </>
                              ) : (
                                "No colleges found"
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {isCustomCollege && collegeSearchInput && (
                        <div className="mt-1 text-xs text-amber-400">
                          Custom college name will be added to our database
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shortBio">Short Bio (max 100 words)</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <textarea 
                      id="shortBio" 
                      placeholder="Write a short bio about yourself"
                      value={shortBio}
                      onChange={(e) => setShortBio(e.target.value)}
                      className="w-full p-2 bg-transparent border border-gray-300 rounded-md"
                      maxLength={500}
                      rows={3}
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profilePic">Profile Picture (GIF allowed)</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <Input 
                      id="profilePic" 
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif"
                      onChange={(e) => setProfilePic(e.target.files ? e.target.files[0] : null)}
                      className="bg-transparent border border-gray-300"
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2"></div>
                  <Label htmlFor="referralCode">Referral Code</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <Input 
                      id="referralCode" 
                      type="text"
                      placeholder="Enter Referral Code (if any)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="bg-transparent border border-gray-300"
                    />
                  </motion.div>
              </div>
                
                <div className="flex justify-between mt-6">
                  <Button type="button" className="w-1/2 mr-2" onClick={handleBack}>
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-1/2 ml-2" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
            </>
          )}
        </form>
      </motion.div>
      </div>
    </div>
    </motion.div>
  );
}
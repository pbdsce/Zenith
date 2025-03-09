"use client";

// import { auth, db } from '@/lib/firebase/config';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { doc, setDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { StarsBackground } from "@/components/ui/stars-background";

// Add CSS for shake animation
const shakeAnimation = {
  x: [-10, 10, -10, 10, -5, 5, -2, 2, 0],
  transition: { duration: 0.5 }
};

export default function Signup() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [stdCode, setStdCode] = useState("+91"); 
  const [phone, setPhone] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  
  // Optional fields
  const [leetcodeProfile, setLeetcodeProfile] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [linkedinLink, setLinkedinLink] = useState("");
  const [cpProfiles, setCpProfiles] = useState("");
  const [ctfProfileLinks, setCtfProfileLinks] = useState("");
  const [kaggleLink, setKaggleLink] = useState("");
  const [devfolioLink, setDevfolioLink] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [age, setAge] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
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
  const [phoneError, setPhoneError] = useState(false);
  const [resumeError, setResumeError] = useState(false);

  // Add reference to file input element
  const resumeInputRef = useRef<HTMLInputElement>(null);
  
  // Add state for resume file name
  const [resumeFileName, setResumeFileName] = useState<string>("");

  const validateStep1 = () => {
    let isValid = true;
    
    // Reset error states
    setNameError(false);
    setEmailError(false);
    
    if (!name.trim()) {
      setNameError(true);
      isValid = false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
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
      
      // Check file size (limit to 2MB)
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > 2) {
        setResumeError(true);
        setError("Resume file size must be less than 2MB");
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
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const step1Valid = validateStep1();
    const step2Valid = validateStep2();
    
    if (!step1Valid || !step2Valid) {
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      alert(`Account created successfully!\nEmail: ${email}`);
      setIsSubmitting(false);
      router.push('/login');
    }, 1500);
  };

  return (
    <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative w-full max-w-xl p-8 space-y-6 rounded-lg shadow-lg border">
        <StarsBackground/>
        <div className="absolute -inset-4 bg-gradient-to-r from-[#2ad8db33] to-[#143B4B] blur-3xl rounded-lg"></div>
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
          <div className="bg-yellow-200 h-1 rounded-full" style={{ width: `${(step + 1) / 5 * 100}%` }}></div>
        </div>
          <br/>
        </div>

        {error && (
          <div className="text-red-500 text-center">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>

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
                  <motion.div whileHover={{ scale: 1.05 }} className="relative w-1/3">
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
                    className='relative w-2/3'
                    animate={phoneError ? shakeAnimation : undefined}
                  >
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="Enter Phone Number"
                      value={phone}
                      onChange={(e) => {
                        // Limit to 10 digits
                        const input = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(input);
                        if (phoneError) setPhoneError(false);
                      }}
                      className={`bg-transparent border ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
                      required
                      maxLength={10}
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
                      <p className="text-xs text-gray-400 mt-1">Maximum size: 2MB</p>
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
                {resumeError && !error && <p className="text-xs text-red-500 mt-1">Please upload your resume in PDF format (max 2MB)</p>}
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
                  <Label htmlFor="githubLink">GitHub Link</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <Input 
                      id="githubLink" 
                      type="text"
                      placeholder="GitHub Profile URL"
                      value={githubLink}
                      onChange={(e) => setGithubLink(e.target.value)}
                      className="bg-transparent border border-gray-300"
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="linkedinLink">LinkedIn Link</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <Input 
                      id="linkedinLink" 
                      type="text"
                      placeholder="LinkedIn Profile URL"
                      value={linkedinLink}
                      onChange={(e) => setLinkedinLink(e.target.value)}
                      className="bg-transparent border border-gray-300"
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="leetcodeProfile">LeetCode Profile</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <Input 
                      id="leetcodeProfile" 
                      type="text"
                      placeholder="LeetCode Profile URL"
                      value={leetcodeProfile}
                      onChange={(e) => setLeetcodeProfile(e.target.value)}
                      className="bg-transparent border border-gray-300"
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="portfolioLink">Portfolio Link</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <Input 
                      id="portfolioLink" 
                      type="text"
                      placeholder="Personal Portfolio URL"
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      className="bg-transparent border border-gray-300"
                    />
                  </motion.div>
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
                  <Label htmlFor="cpProfiles">CP Profiles</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <Input 
                      id="cpProfiles" 
                      type="text"
                      placeholder="Competitive Programming Profiles"
                      value={cpProfiles}
                      onChange={(e) => setCpProfiles(e.target.value)}
                      className="bg-transparent border border-gray-300"
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ctfProfileLinks">CTF Profile Links</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <Input 
                      id="ctfProfileLinks" 
                      type="text"
                      placeholder="CTF Profile Links"
                      value={ctfProfileLinks}
                      onChange={(e) => setCtfProfileLinks(e.target.value)}
                      className="bg-transparent border border-gray-300"
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="kaggleLink">Kaggle Link</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <Input 
                      id="kaggleLink" 
                      type="text"
                      placeholder="Kaggle Profile URL"
                      value={kaggleLink}
                      onChange={(e) => setKaggleLink(e.target.value)}
                      className="bg-transparent border border-gray-300"
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="devfolioLink">Devfolio Link</Label>
                  <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                    <Input 
                      id="devfolioLink" 
                      type="text"
                      placeholder="Devfolio Profile URL"
                      value={devfolioLink}
                      onChange={(e) => setDevfolioLink(e.target.value)}
                      className="bg-transparent border border-gray-300"
                    />
                  </motion.div>
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
                    <Label htmlFor="age">Age</Label>
                    <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                      <Input 
                        id="age" 
                        type="number"
                        placeholder="Your Age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="bg-transparent border border-gray-300"
                      />
                    </motion.div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="collegeName">College Name</Label>
                    <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                      <Input 
                        id="collegeName" 
                        type="text"
                        placeholder="Your College Name"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        className="bg-transparent border border-gray-300"
                      />
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
                
                <div className="space-y-2">
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
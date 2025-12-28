"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { Home } from "lucide-react";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { FormTextarea } from "./form-textarea";
import { FormFileUpload } from "./form-file-upload";
import { Button } from "./button";
import { AlertBanner } from "./alert-banner";

interface ProfileContainerProps {
  onNavigate: (view: "dashboard" | "profile" | "team" | "submission") => void;
}

export function ProfileContainer({ onNavigate }: ProfileContainerProps) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    organisation: "",
    bio: "",
    github: "",
    linkedin: "",
    portfolio: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [profilePhotoFileName, setProfilePhotoFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Load data from API
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`/api/users/${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === "success" && data.user) {
            setProfileData({
              name: data.user.name || "",
              email: data.user.email || "",
              phone: data.user.phone || "",
              age: data.user.age?.toString() || "",
              organisation: data.user.organisation || "",
              bio: data.user.bio || "",
              github: data.user.github_link || "",
              linkedin: data.user.linkedin_link || "",
              portfolio: data.user.portfolio_link || "",
            });
            
            if (data.user.resume_link) setResumeFileName("resume.pdf");
            if (data.user.profile_picture) setProfilePhotoFileName("profile.jpg");
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    fetchProfile();
  }, [user, isAuthenticated, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      formData.append('phone', profileData.phone);
      formData.append('age', profileData.age);
      formData.append('organisation', profileData.organisation);
      formData.append('bio', profileData.bio);
      formData.append('github_link', profileData.github);
      formData.append('linkedin_link', profileData.linkedin);
      formData.append('portfolio_link', profileData.portfolio);
      
      if (resumeFile) formData.append('resume', resumeFile);
      if (profilePhoto) formData.append('profile_picture', profilePhoto);

      const token = localStorage.getItem('authToken');

      // Call Next.js API route
      const response = await fetch(`/api/users/${user?.uid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update local storage
      localStorage.setItem('authUser', JSON.stringify(data.user));

      setAlert({
        type: "success",
        message: "Profile updated successfully!",
      });

      // Refresh user data in context
      await refreshUser();

      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-[24px] max-w-[700px] w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-[42px] text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Edit Profile
        </h1>
        <Button onClick={() => onNavigate("dashboard")} variant="secondary">
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      {alert && <AlertBanner type={alert.type} message={alert.message} />}

      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-[24px]">
        <FormSection title="Personal Information">
          <FormInput
            label="Full Name"
            placeholder="John Doe"
            required
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
          />
          <FormInput
            label="Email Address"
            type="email"
            placeholder="your.email@example.com"
            required
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-[16px]">
            <FormInput
              label="Phone"
              type="tel"
              placeholder="+1 555 0100"
              required
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            />
            <FormInput
              label="Age"
              placeholder="22"
              required
              value={profileData.age}
              onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
            />
          </div>
          <FormInput
            label="Organisation"
            placeholder="Your University"
            required
            value={profileData.organisation}
            onChange={(e) => setProfileData({ ...profileData, organisation: e.target.value })}
          />
          <FormTextarea
            label="Bio"
            placeholder="Tell us about yourself..."
            required
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            rows={3}
          />
        </FormSection>

        <FormSection title="Files">
          <FormFileUpload
            label="Resume (PDF)"
            accept=".pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setResumeFile(e.target.files[0]);
                setResumeFileName(e.target.files[0].name);
              }
            }}
            currentFile={resumeFileName}
          />
          <FormFileUpload
            label="Profile Photo"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setProfilePhoto(e.target.files[0]);
                setProfilePhotoFileName(e.target.files[0].name);
              }
            }}
            currentFile={profilePhotoFileName}
          />
        </FormSection>

        <FormSection title="Social Links">
          <FormInput
            label="GitHub"
            placeholder="https://github.com/username"
            value={profileData.github}
            onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
          />
          <FormInput
            label="LinkedIn"
            placeholder="https://linkedin.com/in/username"
            value={profileData.linkedin}
            onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
          />
          <FormInput
            label="Portfolio"
            placeholder="https://yourportfolio.com"
            value={profileData.portfolio}
            onChange={(e) => setProfileData({ ...profileData, portfolio: e.target.value })}
          />
        </FormSection>

        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}


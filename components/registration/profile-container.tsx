"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { Home, Check } from "lucide-react";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { FormTextarea } from "./form-textarea";
import { FormFileUpload } from "./form-file-upload";
import { Button } from "./button";
import { AlertBanner } from "./alert-banner";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api-config";

export function ProfileContainer() {
  const { user, isAuthenticated, refreshUser, getToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    discord_username: "",
    age: "",
    organisation: "",
    bio: "",
    github: "",
    linkedin: "",
    portfolio: "",
    profile_picture: "",
    isLooking: false,
    teamCode: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [profilePhotoFileName, setProfilePhotoFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileLocked, setIsProfileLocked] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Load data from API
    const fetchProfile = async () => {
      try {
        const token = await getToken();

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const userData = data.success ? data.data : data;

          if (userData && userData.email) {
            setProfileData({
              name: userData.name || "",
              email: userData.email || "",
              phone: userData.phone || "",
              age: userData.age?.toString() || "",
              discord_username: userData.discord_username || "",
              organisation: userData.organisation || "",
              bio: userData.bio || "",
              github: userData.github_link || "",
              linkedin: userData.linkedin_link || "",
              portfolio: userData.portfolio_link || "",
              isLooking: userData.isLooking || false,
              teamCode: userData.teamCode || "",
              profile_picture: userData.profile_picture || "",
            });

            if (userData.resume_link) setResumeFileName("resume.pdf");
            if (userData.profile_picture) setProfilePhotoFileName("profile.jpg");

            if (userData.isProfileLocked || data.isProfileLocked) {
              setIsProfileLocked(true);
              setAlert({
                type: "warning",
                message: "Your profile is locked because your team has been evaluated. You can no longer make changes."
              });
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    fetchProfile();
  }, [user, isAuthenticated, router]);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleToggleLooking = async () => {
    try {
      const token = await getToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in again to update your status",
        });
        return;
      }

      const newValue = !profileData.isLooking;

      const response = await fetch(API_ENDPOINTS.lookingForTeam, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isLooking: newValue
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      setProfileData(prev => ({ ...prev, isLooking: newValue }));

      toast({
        title: newValue ? "You are now visible" : "You are now hidden",
        description: newValue
          ? "Other participants can now find and invite you to their team"
          : "You are hidden from the Discover section"
      });

      // Update global user context silently
      refreshUser();

    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "Could not update status"
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      let resumeBase64: string | undefined;
      let photoBase64: string | undefined;

      if (resumeFile) {
        resumeBase64 = await toBase64(resumeFile);
      }

      if (profilePhoto) {
        photoBase64 = await toBase64(profilePhoto);
      }

      const payload = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        age: profileData.age,
        organisation: profileData.organisation,
        bio: profileData.bio,
        discord_username: profileData.discord_username,
        github_link: profileData.github,
        linkedin_link: profileData.linkedin,
        portfolio_link: profileData.portfolio,
        isLooking: profileData.isLooking,
        resume: resumeBase64,
        profile_picture: photoBase64,
      };

      // Call Next.js API route
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success && data.status !== 'success') {
        throw new Error(data.message || 'Failed to update profile');
      }

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
        <Button onClick={() => router.push("/dashboard")} variant="secondary">
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      {alert && <AlertBanner type={alert.type} message={alert.message} />}

      {!profileData.teamCode && (
        <div className="flex flex-col gap-[8px] p-[16px] rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(138,138,138,0.05)]">
          <div
            onClick={handleToggleLooking}
            className="flex items-center gap-[12px] cursor-pointer"
          >
            <div className="relative">
              <input
                type="checkbox"
                id="profileLookingForTeam"
                checked={profileData.isLooking}
                onChange={handleToggleLooking}
                className="sr-only"
              />
              <div className={`
                w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300
                ${profileData.isLooking
                  ? 'border-[#ff4d00] bg-[rgba(255,77,0,0.15)]'
                  : 'border-[rgba(255,255,255,0.38)] bg-[rgba(138,138,138,0.2)]'
                }
                hover:border-[rgba(255,255,255,0.5)]
              `}>
                {profileData.isLooking && (
                  <Check className="w-3 h-3 text-[#ff4d00]" />
                )}
              </div>
            </div>
            <label htmlFor="profileLookingForTeam" className="text-[14px] font-semibold text-white cursor-pointer" style={{ fontFamily: 'var(--font-body)' }}>
              Looking for a Team?
            </label>
          </div>
          <p className="text-[13px] text-[rgba(255,255,255,0.6)] ml-[32px]" style={{ fontFamily: 'var(--font-body)' }}>
            Enable this to let other participants find and invite you.
          </p>
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-[24px]">
        <fieldset disabled={isProfileLocked} className="flex flex-col gap-[24px] disabled:opacity-70 disabled:pointer-events-none">
          <FormSection title="Personal Information">
            <FormInput
              label="Full Name"
              placeholder="John Doe"
              required
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              disabled
            />
            <FormInput
              label="Email Address"
              type="email"
              placeholder="your.email@example.com"
              required
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              disabled
            />
            <div className="grid grid-cols-2 gap-[16px]">
              <FormInput
                label="Phone"
                type="tel"
                placeholder="+1 555 0100"
                required
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                disabled
              />
              <FormInput
                label="Age"
                placeholder="22"
                required
                value={profileData.age}
                onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                disabled
              />
            </div>
            <FormInput
              label="Discord Username"
              placeholder="username#1234"
              required
              value={profileData.discord_username}
              onChange={(e) => setProfileData({ ...profileData, discord_username: e.target.value })}
            />
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

          <Button type="submit" variant="primary" disabled={isSubmitting || isProfileLocked}>
            {isSubmitting ? "Saving..." : isProfileLocked ? "Profile Locked" : "Save Changes"}
          </Button>
        </fieldset>
      </form>
    </div>
  );
}


"use client";

import { useEffect } from "react";
import { User, Mail, MessageSquare, Building, FileText, Github, Linkedin, ExternalLink, UserPlus, Check } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "./button";
import { AlertBanner } from "./alert-banner";

interface UserDetails {
  uid: string;
  name: string;
  email: string;
  discord_username?: string;
  organisation?: string;
  bio?: string;
  profile_picture?: string;
  resume_link?: string;
  github_link?: string;
  linkedin_link?: string;
  leetcode_profile?: string;
  codeforces_link?: string;
  kaggle_link?: string;
  devfolio_link?: string;
  portfolio_link?: string;
  ctf_profile?: string;
  age?: number;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDetails: UserDetails | null;
  isLoading: boolean;
  onInvite?: (email: string, uid: string) => void;
  isInviting?: boolean;
  isInvited?: boolean;
  canInvite?: boolean;
  showCreateTeamHint?: boolean;
  error?: string | null;
}

export function UserProfileModal({ 
  isOpen, 
  onClose, 
  userDetails, 
  isLoading,
  onInvite,
  isInviting = false,
  isInvited = false,
  canInvite = false,
  showCreateTeamHint = false,
  error
}: UserProfileModalProps) {
  const handleResumeDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // For stacked modals, user modal uses z-110 to appear above team modal
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      <div className="relative z-[111] w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.15)] rounded-[20px] p-[32px] border border-[rgba(255,255,255,0.2)] pointer-events-auto no-scrollbar">
        <div className="flex items-center justify-between mb-[24px]">
          <h2 className="text-[28px] text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            User Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {isLoading ? (
        <div className="flex justify-center py-[40px]">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-white text-center py-[40px]">
          <p className="text-[#ff4d00] mb-[8px]">Error loading user details</p>
          <p className="text-white opacity-70 text-[14px]">{error}</p>
        </div>
      ) : userDetails ? (
        <div className="flex flex-col gap-[24px]">
          <div className="flex items-start gap-[16px]">
            {userDetails.profile_picture ? (
              <img 
                src={userDetails.profile_picture} 
                alt={userDetails.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-[rgba(255,255,255,0.2)]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[rgba(138,138,138,0.2)] border-2 border-[rgba(255,255,255,0.2)] flex items-center justify-center">
                <User className="w-10 h-10 text-white opacity-50" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-['Inter',sans-serif] text-[20px] text-white mb-[4px]">{userDetails.name}</h3>
              {userDetails.email && (
                <div className="flex items-center gap-[8px] mb-[4px]">
                  <Mail className="w-4 h-4 text-white opacity-60" />
                  <span className="font-['Inter',sans-serif] text-[14px] text-white opacity-70">{userDetails.email}</span>
                </div>
              )}
              {userDetails.discord_username && (
                <div className="flex items-center gap-[8px] mb-[4px]">
                  <MessageSquare className="w-4 h-4 text-white opacity-60" />
                  <span className="font-['Inter',sans-serif] text-[14px] text-white opacity-70">{userDetails.discord_username}</span>
                </div>
              )}
              {userDetails.organisation && (
                <div className="flex items-center gap-[8px]">
                  <Building className="w-4 h-4 text-white opacity-60" />
                  <span className="font-['Inter',sans-serif] text-[14px] text-white opacity-70">{userDetails.organisation}</span>
                </div>
              )}
            </div>
          </div>

          {userDetails.bio && (
            <div>
              <h4 className="font-['Inter',sans-serif] text-[16px] text-white mb-[8px]">Bio</h4>
              <p className="font-['Inter',sans-serif] text-[14px] text-white opacity-70">{userDetails.bio}</p>
            </div>
          )}

          {(userDetails.github_link || userDetails.linkedin_link || userDetails.resume_link || 
            userDetails.leetcode_profile || userDetails.codeforces_link || userDetails.kaggle_link ||
            userDetails.devfolio_link || userDetails.portfolio_link || userDetails.ctf_profile) && (
            <div>
              <h4 className="font-['Inter',sans-serif] text-[16px] text-white mb-[12px]">Links & Profiles</h4>
              <div className="flex flex-col gap-[8px]">
                {userDetails.github_link && (
                  <a 
                    href={userDetails.github_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-[8px] p-[8px] bg-[rgba(138,138,138,0.1)] rounded-[8px] hover:bg-[rgba(138,138,138,0.2)] transition-colors"
                  >
                    <Github className="w-4 h-4 text-white opacity-70" />
                    <span className="font-['Inter',sans-serif] text-[14px] text-white">GitHub</span>
                    <ExternalLink className="w-3 h-3 text-white opacity-50 ml-auto" />
                  </a>
                )}
                {userDetails.linkedin_link && (
                  <a 
                    href={userDetails.linkedin_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-[8px] p-[8px] bg-[rgba(138,138,138,0.1)] rounded-[8px] hover:bg-[rgba(138,138,138,0.2)] transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-white opacity-70" />
                    <span className="font-['Inter',sans-serif] text-[14px] text-white">LinkedIn</span>
                    <ExternalLink className="w-3 h-3 text-white opacity-50 ml-auto" />
                  </a>
                )}
                {userDetails.resume_link && (
                  <button
                    onClick={() => handleResumeDownload(userDetails.resume_link!)}
                    className="flex items-center gap-[8px] p-[8px] bg-[rgba(138,138,138,0.1)] rounded-[8px] hover:bg-[rgba(138,138,138,0.2)] transition-colors cursor-pointer w-full"
                  >
                    <FileText className="w-4 h-4 text-white opacity-70" />
                    <span className="font-['Inter',sans-serif] text-[14px] text-white">Resume</span>
                    <ExternalLink className="w-3 h-3 text-white opacity-50 ml-auto" />
                  </button>
                )}
                {userDetails.leetcode_profile && (
                  <a 
                    href={userDetails.leetcode_profile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-[8px] p-[8px] bg-[rgba(138,138,138,0.1)] rounded-[8px] hover:bg-[rgba(138,138,138,0.2)] transition-colors"
                  >
                    <span className="font-['Inter',sans-serif] text-[14px] text-white">LeetCode</span>
                    <ExternalLink className="w-3 h-3 text-white opacity-50 ml-auto" />
                  </a>
                )}
                {userDetails.codeforces_link && (
                  <a 
                    href={userDetails.codeforces_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-[8px] p-[8px] bg-[rgba(138,138,138,0.1)] rounded-[8px] hover:bg-[rgba(138,138,138,0.2)] transition-colors"
                  >
                    <span className="font-['Inter',sans-serif] text-[14px] text-white">Codeforces</span>
                    <ExternalLink className="w-3 h-3 text-white opacity-50 ml-auto" />
                  </a>
                )}
                {userDetails.kaggle_link && (
                  <a 
                    href={userDetails.kaggle_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-[8px] p-[8px] bg-[rgba(138,138,138,0.1)] rounded-[8px] hover:bg-[rgba(138,138,138,0.2)] transition-colors"
                  >
                    <span className="font-['Inter',sans-serif] text-[14px] text-white">Kaggle</span>
                    <ExternalLink className="w-3 h-3 text-white opacity-50 ml-auto" />
                  </a>
                )}
                {userDetails.devfolio_link && (
                  <a 
                    href={userDetails.devfolio_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-[8px] p-[8px] bg-[rgba(138,138,138,0.1)] rounded-[8px] hover:bg-[rgba(138,138,138,0.2)] transition-colors"
                  >
                    <span className="font-['Inter',sans-serif] text-[14px] text-white">Devfolio</span>
                    <ExternalLink className="w-3 h-3 text-white opacity-50 ml-auto" />
                  </a>
                )}
                {userDetails.portfolio_link && (
                  <a 
                    href={userDetails.portfolio_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-[8px] p-[8px] bg-[rgba(138,138,138,0.1)] rounded-[8px] hover:bg-[rgba(138,138,138,0.2)] transition-colors"
                  >
                    <span className="font-['Inter',sans-serif] text-[14px] text-white">Portfolio</span>
                    <ExternalLink className="w-3 h-3 text-white opacity-50 ml-auto" />
                  </a>
                )}
                {userDetails.ctf_profile && (
                  <a 
                    href={userDetails.ctf_profile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-[8px] p-[8px] bg-[rgba(138,138,138,0.1)] rounded-[8px] hover:bg-[rgba(138,138,138,0.2)] transition-colors"
                  >
                    <span className="font-['Inter',sans-serif] text-[14px] text-white">CTF Profile</span>
                    <ExternalLink className="w-3 h-3 text-white opacity-50 ml-auto" />
                  </a>
                )}
              </div>
                </div>
              )}

            {showCreateTeamHint && (
              <div className="mt-[12px] pt-[24px] border-t border-[rgba(255,255,255,0.1)]">
                <AlertBanner
                  type="info"
                  message="Want to invite members? You need to create a team first to send invitations."
                />
              </div>
            )}

          {canInvite && userDetails.email && onInvite && (
            <div className="mt-[12px] pt-[24px] border-t border-[rgba(255,255,255,0.1)] flex justify-end">
              <Button
                variant="primary"
                onClick={() => onInvite(userDetails.email!, userDetails.uid)}
                disabled={isInviting || isInvited}
                className="w-full sm:w-auto"
              >
                {isInviting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Sending Invite...
                  </>
                ) : isInvited ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Invited
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite to Team
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-white text-center py-[40px]">Failed to load user details        </div>
      )}
      </div>
    </div>
  );
}

export type { UserDetails };


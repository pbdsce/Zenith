"use client";

import { User, Users } from "lucide-react";
import { useEffect } from "react";
import { Button } from "./button";

export interface TeamDetails {
  teamCode: string;
  teamName: string;
  teamLead: {
    id?: string;
    uid?: string;
    name: string;
    email?: string;
    discord_username?: string;
    organisation?: string;
  };
  teamMembers: Array<{
    uid: string;
    name: string;
    email?: string;
    role: string;
  }>;
  appliedFor?: {
    id: string;
    title: string;
  };
  memberCount: number;
  maxMembers: number;
  teamStatus: string;
}

interface TeamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamDetails: TeamDetails | null;
  isLoading: boolean;
  error: string | null;
  onMemberClick: (userId: string) => void;
  requestStatus?: string; // 'pending', 'accepted', 'declined', or undefined
  onSendRequest?: () => void;
  isSendingRequest?: boolean;
}

export function TeamDetailsModal({ 
  isOpen, 
  onClose, 
  teamDetails, 
  isLoading, 
  error,
  onMemberClick,
  requestStatus,
  onSendRequest,
  isSendingRequest = false
}: TeamDetailsModalProps) {
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

  // For stacked modals, team modal uses z-100
  return (
    <div className={isOpen ? "fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none" : "hidden"}>
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      <div className="relative z-[101] w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.15)] rounded-[20px] p-[32px] border border-[rgba(255,255,255,0.2)] pointer-events-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx global>{`
          [style*="scrollbarWidth: 'none'"] {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          [style*="scrollbarWidth: 'none'"]::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex items-center justify-between mb-[24px]">
          <h2 className="text-[28px] text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Team Details
          </h2>
          <button
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {isLoading ? (
          <div className="text-white text-center py-[40px]">Loading team details...</div>
        ) : error ? (
          <div className="text-white text-center py-[40px]">
            <p className="text-red-400 mb-[8px]">Error loading team details</p>
            <p className="text-white opacity-70 text-[14px]">{error}</p>
          </div>
        ) : teamDetails && teamDetails.teamName ? (
          <div className="flex flex-col gap-[24px]">
            <div>
              <h3 className="font-['Inter',sans-serif] text-[20px] text-white mb-[8px]">{teamDetails.teamName}</h3>
              {teamDetails.appliedFor && (
                <p className="font-['Inter',sans-serif] text-[14px] text-white opacity-70 mt-[4px]">
                  Problem Statement: {teamDetails.appliedFor.title}
                </p>
              )}
              <p className="font-['Inter',sans-serif] text-[14px] text-white opacity-70 mt-[4px]">
                Members: {teamDetails.memberCount || (teamDetails.teamMembers?.length || 0)}/{teamDetails.maxMembers || 4}
              </p>
            </div>

            {/* Send Request Button */}
            {onSendRequest && (
              <div className="pt-[8px] border-t border-[rgba(255,255,255,0.1)]">
                {requestStatus === 'pending' ? (
                  <Button 
                    variant="secondary"
                    disabled
                    onClick={() => {}}
                  >
                    <Users className="w-4 h-4" />
                    Request Sent
                  </Button>
                ) : requestStatus === 'accepted' ? (
                  <Button 
                    variant="secondary"
                    disabled
                    onClick={() => {}}
                  >
                    <Users className="w-4 h-4" />
                    Accepted
                  </Button>
                ) : (
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      onSendRequest();
                    }}
                    disabled={isSendingRequest}
                  >
                    <Users className="w-4 h-4" />
                    {isSendingRequest ? 'Sending...' : 'Send Request'}
                  </Button>
                )}
              </div>
            )}

            <div>
              <h4 className="font-['Inter',sans-serif] text-[16px] text-white mb-[12px]">Team Lead</h4>
              <div 
                className="p-[12px] bg-[rgba(138,138,138,0.1)] rounded-[8px] border border-[rgba(255,255,255,0.1)] cursor-pointer hover:bg-[rgba(138,138,138,0.2)] transition-colors"
                onClick={(e) => {
                  const leadId = teamDetails.teamLead.uid || teamDetails.teamLead.id;
                  if (leadId) {
                    e.stopPropagation();
                    onMemberClick(leadId);
                  }
                }}
              >
                <div className="flex items-center gap-[8px]">
                  <User className="w-4 h-4 text-white opacity-70" />
                  <span className="font-['Inter',sans-serif] text-[14px] text-white">{teamDetails.teamLead.name}</span>
                  {teamDetails.teamLead.email && (
                    <span className="font-['Inter',sans-serif] text-[12px] text-white opacity-60 ml-auto">
                      {teamDetails.teamLead.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {teamDetails.teamMembers && teamDetails.teamMembers.length > 0 && (
              <div>
                <h4 className="font-['Inter',sans-serif] text-[16px] text-white mb-[12px]">Team Members</h4>
                <div className="flex flex-col gap-[8px]">
                  {teamDetails.teamMembers.map((member) => (
                    <div
                      key={member.uid}
                      className="p-[12px] bg-[rgba(138,138,138,0.1)] rounded-[8px] border border-[rgba(255,255,255,0.1)] cursor-pointer hover:bg-[rgba(138,138,138,0.2)] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMemberClick(member.uid);
                      }}
                    >
                      <div className="flex items-center gap-[8px]">
                        <User className="w-4 h-4 text-white opacity-70" />
                        <span className="font-['Inter',sans-serif] text-[14px] text-white">{member.name}</span>
                        <span className="font-['Inter',sans-serif] text-[12px] text-white opacity-60">
                          ({member.role})
                        </span>
                        {member.email && (
                          <span className="font-['Inter',sans-serif] text-[12px] text-white opacity-60 ml-auto">
                            {member.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-white text-center py-[40px]">Failed to load team details</div>
        )}
      </div>
    </div>
  );
}
"use client";

import { Trash2 } from "lucide-react";
import { FormSection } from "./form-section";
import { Button } from "./button";

interface TeamMember {
  uid: string;
  name: string;
  email?: string;
  role: string;
}

interface TeamMembersCardProps {
  members: TeamMember[];
  isLead: boolean;
  teamStatus: string;
  currentUserId: string;
  onRemoveMember: (memberId: string, memberName: string) => void;
}

export function TeamMembersCard({
  members,
  isLead,
  teamStatus,
  currentUserId,
  onRemoveMember,
  onTransferOwnership,
}: TeamMembersCardProps & { onTransferOwnership?: (memberId: string) => void }) {
  // Can remove members only if lead and team is in active state
  // Can transfer ownership only if lead and team is in active state
  const isActionable = isLead &&
    teamStatus !== "submitted" &&
    teamStatus !== "shortlisted" &&
    teamStatus !== "confirmed";

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate consistent color from name
  const getAvatarColor = (name: string) => {
    const colors = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600",
      "from-orange-500 to-red-600",
      "from-pink-500 to-rose-600",
      "from-indigo-500 to-blue-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!members || members.length === 0) {
    return null;
  }

  return (
    <FormSection title="Team Members">
      <div className="flex flex-col gap-[12px]">
        {members.map((member) => (
          <div
            key={member.uid}
            className="flex items-center justify-between p-[12px] bg-[rgba(138,138,138,0.1)] rounded-[12px] border border-[rgba(255,255,255,0.1)]"
          >
            <div className="flex items-center gap-[12px]">
              {/* Avatar */}
              <div
                className={`w-[40px] h-[40px] rounded-full bg-gradient-to-br ${getAvatarColor(member.name)} flex items-center justify-center`}
              >
                <span className="text-[14px] text-white font-semibold">
                  {getInitials(member.name)}
                </span>
              </div>
              
              {/* Name and Email */}
              <div className="flex flex-col gap-[2px]">
                <div className="flex items-center gap-[8px]">
                  <span className="text-[14px] text-white font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                    {member.name}
                  </span>
                  {member.role === "Team Lead" && (
                    <span className="text-[11px] text-[#ff4d00] bg-[rgba(255,77,0,0.15)] px-[8px] py-[2px] rounded-full font-medium">
                      Lead
                    </span>
                  )}
                </div>
                {member.email && (
                  <span className="text-[12px] text-white opacity-50" style={{ fontFamily: 'var(--font-body)' }}>
                    {member.email}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {isActionable && member.uid !== currentUserId && (
              <div className="flex gap-2">
                {onTransferOwnership && (
                  <Button
                    onClick={() => onTransferOwnership(member.uid)}
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                  >
                    Transfer Lead
                  </Button>
                )}
                <Button
                  onClick={() => onRemoveMember(member.uid, member.name)}
                  variant="danger"
                  className="h-8 px-3"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </FormSection>
  );
}

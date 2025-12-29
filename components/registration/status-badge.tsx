import React from "react";
import { LucideIcon } from "lucide-react";

interface StatusBadgeProps {
  status: string | undefined | null;
  icon: LucideIcon;
}

export function StatusBadge({
  status,
  icon: Icon,
}: StatusBadgeProps) {
  const getStatusColor = () => {
    if (!status || typeof status !== 'string') {
      return "bg-[rgba(138,138,138,0.2)] border-[rgba(255,255,255,0.38)]";
    }
    switch (status.toLowerCase()) {
      case "rsvped":
      case "confirmed":
      case "shortlisted":
      case "accepted":
        return "bg-[rgba(0,200,0,0.2)] border-green-500";
      case "pending":
      case "in-team":
      case "under-review":
        return "bg-[rgba(255,204,0,0.2)] border-yellow-500";
      case "submitted":
        return "bg-[rgba(59,130,246,0.2)] border-blue-500";
      case "declined":
      case "rejected":
      case "rsvp_declined":
        return "bg-[rgba(200,0,0,0.2)] border-red-500";
      case "withdrawn":
        return "bg-[rgba(100,100,100,0.2)] border-gray-500";
      default:
        return "bg-[rgba(138,138,138,0.2)] border-[rgba(255,255,255,0.38)]";
    }
  };

  return (
    <div
      className={`flex items-center gap-[8px] px-[12px] py-[6px] rounded-[12px] border ${getStatusColor()}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[13px] text-white capitalize" style={{ fontFamily: 'var(--font-body)' }}>
        {status || 'Unknown'}
      </span>
    </div>
  );
}


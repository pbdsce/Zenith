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
      case "completed":
      case "submitted":
      case "confirmed":
      case "shortlisted":
        return "bg-[rgba(0,200,0,0.2)] border-green-500";
      case "pending":
      case "under-review":
        return "bg-[rgba(255,165,0,0.2)] border-orange-500";
      case "declined":
      case "rejected":
        return "bg-[rgba(200,0,0,0.2)] border-red-500";
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


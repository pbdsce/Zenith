import React from "react";
import { AlertCircle } from "lucide-react";

interface AlertBannerProps {
  type?: "success" | "error" | "warning" | "yellow" | "info";
  message: string;
  className?: string;
}

export function AlertBanner({
  type = "info",
  message,
  className,
}: AlertBannerProps) {
  const getTypeClass = () => {
    switch (type) {
      case "success":
        return "bg-[rgba(0,200,0,0.2)] border-green-500";
      case "error":
        return "bg-[rgba(200,0,0,0.2)] border-red-500";
      case "warning":
        return "bg-[rgba(255,165,0,0.2)] border-orange-500";
      case "yellow":
        return "bg-[rgba(255,235,59,0.2)] border-[#ffeb3b]";
      case "info":
        return "bg-[rgba(138,138,138,0.2)] border-[rgba(255,255,255,0.38)]";
      default:
        return "bg-[rgba(138,138,138,0.2)] border-[rgba(255,255,255,0.38)]";
    }
  };

  return (
    <div
      className={`backdrop-blur-[2.5px] backdrop-filter rounded-[15px] p-[16px] border ${getTypeClass()} flex items-center gap-[12px] ${className || ""}`}
    >
      <AlertCircle className="w-5 h-5 text-white" />
      <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
        {message}
      </span>
    </div>
  );
}


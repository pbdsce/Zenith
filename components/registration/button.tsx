import React from "react";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}

export function Button({
  onClick,
  children,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "",
}: ButtonProps) {
  const getVariantClass = () => {
    if (disabled)
      return "bg-[rgba(138,138,138,0.2)] text-[rgba(255,255,255,0.3)] cursor-not-allowed";

    switch (variant) {
      case "primary":
        return "bg-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.95)] text-black";
      case "secondary":
        return "backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.3)] hover:bg-[rgba(138,138,138,0.4)] text-white border border-[rgba(255,255,255,0.38)]";
      case "danger":
        return "bg-[rgba(200,0,0,0.5)] hover:bg-[rgba(200,0,0,0.6)] text-white border border-red-500";
      default:
        return "";
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-[8px] px-[24px] py-[12px] rounded-[15px] transition-all text-[14px] ${getVariantClass()} ${className}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {children}
    </button>
  );
}


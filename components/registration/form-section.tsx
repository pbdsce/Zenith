import React from "react";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  status?: React.ReactNode;
}

export function FormSection({
  title,
  children,
  status,
  className,
}: FormSectionProps & { className?: string }) {
  return (
    <div className={`backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.15)] rounded-[16px] sm:rounded-[20px] p-[20px] sm:p-[24px] md:p-[32px] relative w-full ${className || ''}`}>
      <div className="absolute inset-0 rounded-[16px] sm:rounded-[20px]">
        <div className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[16px] sm:rounded-[20px]" />
      </div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_0px_8px_2px_rgba(138,138,138,0.2)] rounded-[16px] sm:rounded-[20px]" />

      <div className={`flex flex-col gap-[16px] sm:gap-[20px] relative z-10 h-full`}>
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-[24px] sm:text-[28px] text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h2>
          {status}
        </div>
        {children}
      </div>
    </div>
  );
}


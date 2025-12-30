import React from "react";

interface FormInputProps {
  label: string;
  type?: string;
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
}

export function FormInput({
  label,
  type = "text",
  placeholder,
  required = false,
  value,
  onChange,
  error,
  disabled = false,
}: FormInputProps) {
  return (
    <div className={`flex flex-col gap-[8px] w-full ${disabled ? "opacity-50" : ""}`}>
      <label className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
        {label}{" "}
        {required && <span className="text-[#ff4d00]">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.2)] border ${error
            ? "border-red-500"
            : "border-[rgba(255,255,255,0.38)]"
          } border-solid rounded-[15px] px-[18px] py-[12px] text-white text-[14px] placeholder:text-[rgba(255,255,255,0.5)] focus:outline-none focus:border-[#ff4d00] focus:shadow-[0px_0px_10px_0px_rgba(255,77,0,0.3)] transition-all disabled:cursor-not-allowed`}
        style={{ fontFamily: 'var(--font-body)' }}
      />
      {error && (
        <span className="text-[12px] text-red-400" style={{ fontFamily: 'var(--font-body)' }}>
          {error}
        </span>
      )}
    </div>
  );
}


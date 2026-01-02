"use client";

import PhoneInput from "react-phone-number-input";
import { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface FormPhoneInputProps {
  label: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string | undefined) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}

export function FormPhoneInput({
  label,
  placeholder = "Enter phone number",
  required = false,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
}: FormPhoneInputProps) {
  return (
    <div className={`flex flex-col gap-[8px] w-full ${disabled ? "opacity-50" : ""}`}>
      <label className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
        {label}{" "}
        {required && <span className="text-[#ff4d00]">*</span>}
      </label>
      <div className={`backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.2)] border ${error ? "border-[#ff4d00]" : "border-[rgba(255,255,255,0.38)]"} border-solid rounded-[15px] overflow-hidden focus-within:border-[#ff4d00] focus-within:shadow-[0px_0px_10px_0px_rgba(255,77,0,0.3)] transition-all`}>
        <PhoneInput
          international
          defaultCountry="IN"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
      {error && (
        <span className="text-[12px] text-[#ff4d00]" style={{ fontFamily: 'var(--font-body)' }}>
          {error}
        </span>
      )}
      <style jsx global>{`
        .PhoneInput {
          display: flex;
          align-items: center;
        }
        
        .PhoneInputInput {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          color: white !important;
          font-size: 14px !important;
          padding: 12px 18px !important;
          font-family: var(--font-body) !important;
          flex: 1;
          width: 100%;
        }
        
        .PhoneInputInput::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        
        .PhoneInputCountry {
          padding: 0 12px;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          margin-right: 0;
        }
        
        .PhoneInputCountryIcon {
          width: 1.5em;
          height: 1.2em;
          box-shadow: none;
          border: none;
        }
        
        .PhoneInputCountrySelect {
          background: transparent !important;
          color: white !important;
          border: none !important;
          outline: none !important;
          padding: 12px 8px !important;
          font-size: 14px !important;
          font-family: var(--font-body) !important;
          cursor: pointer !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
        }
        
        .PhoneInputCountrySelect:hover {
          background: rgba(138, 138, 138, 0.1) !important;
        }
        
        .PhoneInputCountrySelectArrow {
          opacity: 0.7;
          margin-left: 4px;
          color: white !important;
        }
        
        .PhoneInputCountrySelect option {
          background: #171717 !important;
          color: white !important;
          padding: 8px;
        }
      `}</style>
    </div>
  );
}

export { isValidPhoneNumber };

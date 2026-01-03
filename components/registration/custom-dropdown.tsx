"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDropdownProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    required?: boolean;
}

export function CustomDropdown({ label, value, options, onChange, required }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-[8px]" ref={dropdownRef}>
            <label className="font-['Inter'] text-[14px] font-medium text-white flex items-center gap-1">
                {label}
                {required && <span className="text-[#FF4D00]">*</span>}
            </label>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full flex items-center justify-between px-[16px] py-[12px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] text-left transition-all",
                        "hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]",
                        isOpen && "border-[#FF4D00] ring-1 ring-[#FF4D00]/20"
                    )}
                >
                    <span className={cn("text-[14px]", value ? "text-white" : "text-white/40")}>
                        {value || "Select score..."}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-[8px] shadow-xl max-h-[200px] overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className={cn(
                                    "w-full flex items-center justify-between px-[16px] py-[10px] text-[14px] text-white/80 hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors",
                                    value === option && "bg-[rgba(255,77,0,0.1)] text-[#FF4D00]"
                                )}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                            >
                                {option}
                                {value === option && <Check className="w-4 h-4 text-[#FF4D00]" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

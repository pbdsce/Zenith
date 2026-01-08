import React from "react";
import { LogOut, LogIn, FileText } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "./button";

interface User {
  uid: string;
  name: string;
  email: string;
  role?: string;
}

interface NavBarProps {
  user?: User;
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

export function NavBar({
  user,
  onLogout,
  onNavigate,
}: NavBarProps) {
  return (
    <div className="bg-gradient-to-t from-[rgba(23,23,23,0)] to-[#171717] h-[78px] w-full sticky top-0 z-50">
      <div className="flex items-center justify-center size-full pt-[16px]">
        <div className="flex items-center justify-between px-4 md:px-[40px] max-w-[1200px] w-full">
          <div 
            className="cursor-pointer" 
            onClick={() => onNavigate && onNavigate('landing')}
          >
            <Logo />
          </div>
          {user ? (
            <div className="flex items-center gap-[12px]">
              <div className="text-[13px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                {user.name} {user.role === "admin" && <span className="text-[#ff4d00] capitalize">({user.role})</span>}
              </div>
              <button
                onClick={() => onNavigate && onNavigate('problem-statements')}
                className="backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.3)] flex items-center gap-[8px] justify-center overflow-clip px-[18px] py-[8px] rounded-[20px] relative cursor-pointer hover:bg-[rgba(138,138,138,0.4)] transition-all"
              >
                <FileText className="w-4 h-4" />
                <p className="hidden sm:block text-[13.6px] text-white leading-[16.8px]" style={{ fontFamily: 'var(--font-body)' }}>
                  Problem Statements
                </p>
                <div className="absolute inset-0 rounded-[20px]">
                  <div className="absolute border border-[rgba(255,255,255,0.38)] border-solid inset-0 pointer-events-none rounded-[20px]" />
                </div>
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_0px_6px_3px_rgba(138,138,138,0.3)] rounded-[20px]" />
              </button>
              <button
                onClick={onLogout}
                className="backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.3)] flex items-center gap-[8px] justify-center overflow-clip px-[18px] py-[8px] rounded-[20px] relative cursor-pointer hover:bg-[rgba(138,138,138,0.4)] transition-all"
              >
                <LogOut className="w-4 h-4" />
                <p className="hidden sm:block text-[13.6px] text-white leading-[16.8px]" style={{ fontFamily: 'var(--font-body)' }}>
                  Logout
                </p>
                <div className="absolute inset-0 rounded-[20px]">
                  <div className="absolute border border-[rgba(255,255,255,0.38)] border-solid inset-0 pointer-events-none rounded-[20px]" />
                </div>
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_0px_6px_3px_rgba(138,138,138,0.3)] rounded-[20px]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-[12px]">
              <button
                onClick={() => onNavigate && onNavigate('login')}
                className="backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.3)] flex items-center gap-[8px] justify-center overflow-clip px-[18px] py-[8px] rounded-[20px] relative cursor-pointer hover:bg-[rgba(138,138,138,0.4)] transition-all"
              >
                <LogIn className="w-4 h-4" />
                <p className="hidden sm:block text-[13.6px] text-white leading-[16.8px]" style={{ fontFamily: 'var(--font-body)' }}>
                  Login
                </p>
                <div className="absolute inset-0 rounded-[20px]">
                  <div className="absolute border border-[rgba(255,255,255,0.38)] border-solid inset-0 pointer-events-none rounded-[20px]" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


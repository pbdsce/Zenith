"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-[101] w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.15)] rounded-[20px] p-[32px] border border-[rgba(255,255,255,0.2)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx global>{`
          .scrollbar-hide,
          [style*="scrollbarWidth: 'none'"] {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar,
          [style*="scrollbarWidth: 'none'"]::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex items-center justify-between mb-[24px]">
          <h2 className="text-[28px] text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface DeadlineTimerProps {
  teamStatus?: string;
  hasSubmitted?: boolean;
}

export function DeadlineTimer({ teamStatus, hasSubmitted = false }: DeadlineTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverOffset, setServerOffset] = useState(0);
  const [error, setError] = useState(false);

  // Fetch deadline and server time from API
  useEffect(() => {
    const fetchDeadline = async () => {
      try {
        const response = await fetch('/api/config/deadline');
        const data = await response.json();
        
        if (data.success && data.data) {
          const serverTime = new Date(data.data.serverTime).getTime();
          const clientTime = Date.now();
          // Calculate offset between server and client time
          setServerOffset(serverTime - clientTime);
          setDeadline(new Date(data.data.deadline));
          setIsExpired(data.data.isExpired);
        }
      } catch (error) {
        console.error("Failed to fetch deadline:", error);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeadline();
  }, []);

  // Update countdown every second
  useEffect(() => {
    if (!deadline || isExpired) return;

    const calculateTimeRemaining = (): TimeRemaining => {
      // Use server-adjusted time
      const now = Date.now() + serverOffset;
      const total = deadline.getTime() - now;

      if (total <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      const seconds = Math.floor((total / 1000) % 60);
      const minutes = Math.floor((total / 1000 / 60) % 60);
      const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
      const days = Math.floor(total / (1000 * 60 * 60 * 24));

      return { days, hours, minutes, seconds, total };
    };

    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    return () => clearInterval(timer);
  }, [deadline, serverOffset, isExpired]);

  if (isLoading) {
    return (
      <div className="w-full p-[16px] rounded-[16px] bg-[rgba(138,138,138,0.1)] border border-[rgba(255,255,255,0.1)] animate-pulse">
        <div className="h-[60px] bg-[rgba(255,255,255,0.05)] rounded-[8px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-[16px] rounded-[16px] bg-black/50 border border-[#ff4d00]">
        <p className="text-[14px] text-white text-center" style={{ fontFamily: 'var(--font-body)' }}>
          Failed to load deadline timer
        </p>
      </div>
    );
  }

  const submitted = hasSubmitted || teamStatus === 'submitted' || teamStatus === 'shortlisted' || teamStatus === 'rsvped';

  return (
    <div className={`w-full p-[20px] rounded-[16px] border flex flex-col items-center justify-center text-center ${
      isExpired 
        ? 'bg-black/50 border-[#ff4d00]' 
        : submitted
          ? 'bg-[rgba(255,77,0,0.2)] border-[#ff4d00]'
          : 'bg-[rgba(255,77,0,0.15)] border-[#ff8800]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-center gap-[12px] mb-[16px] w-full">
        {isExpired ? (
          <AlertTriangle className="w-5 h-5 text-[#ff4d00]" />
        ) : submitted ? (
          <CheckCircle2 className="w-5 h-5 text-white" />
        ) : (
          <Clock className="w-5 h-5 text-white" />
        )}
        <h3 
          className={`text-[16px] font-semibold ${
            isExpired ? 'text-[#ff4d00]' : submitted ? 'text-white' : 'text-white'
          }`}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {isExpired 
            ? "Submission Deadline Passed" 
            : submitted 
              ? "Submission Complete!"
              : "Submission Deadline"}
        </h3>
      </div>

      {/* Countdown or Status Message */}
      {isExpired ? (
        <p className="text-[14px] text-white/80 text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
          The submission deadline has passed. No new submissions are being accepted.
        </p>
      ) : (
        <div className="flex flex-col items-center w-full">
          {/* Countdown Display */}
          {timeRemaining && (
            <div className="flex justify-center gap-[12px] mb-[12px] w-full">
              {[
                { value: timeRemaining.days, label: 'Days' },
                { value: timeRemaining.hours, label: 'Hours' },
                { value: timeRemaining.minutes, label: 'Mins' },
                { value: timeRemaining.seconds, label: 'Secs' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center justify-center min-w-[60px] p-[12px] rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)]"
                >
                  <span 
                    className="text-[24px] font-bold text-white tabular-nums"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span 
                    className="text-[10px] text-white/60 uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Status Message */}
          <p 
            className={`text-[13px] text-center w-full text-white/80`}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {submitted 
              ? "Your team has successfully submitted. Good luck!" 
              : "⚠️ Your team has not submitted yet. Make sure to submit before the deadline!"}
          </p>

          {/* Deadline Date */}
          <p 
            className="text-[12px] text-white/50 mt-[8px] text-center w-full"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Deadline: January 15, 2026 at 11:59 PM IST
          </p>
        </div>
      )}
    </div>
  );
}

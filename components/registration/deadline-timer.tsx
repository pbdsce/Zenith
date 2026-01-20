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
  const [showRickroll, setShowRickroll] = useState(false);
  const [showButton, setShowButton] = useState(false);

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

  // Show button after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 3000);

    return () => clearTimeout(timer);
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
      <div className="w-full backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.15)] rounded-[16px] p-[20px] border border-[rgba(255,255,255,0.2)] animate-pulse">
        <div className="h-[60px] bg-[rgba(255,255,255,0.05)] rounded-[8px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.15)] rounded-[16px] p-[20px] border border-[rgba(255,255,255,0.2)]">
        <p className="text-[14px] text-white text-center" style={{ fontFamily: 'var(--font-body)' }}>
          Failed to load deadline timer
        </p>
      </div>
    );
  }

  const submitted = hasSubmitted || teamStatus === 'submitted' || teamStatus === 'shortlisted' || teamStatus === 'rsvped';

  return (
    <div className="w-full backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.15)] rounded-[16px] p-[20px] border border-[rgba(255,255,255,0.2)] flex flex-col items-center justify-center text-center relative">
      <div className="absolute inset-0 rounded-[16px]">
        <div className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      </div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_0px_8px_2px_rgba(138,138,138,0.2)] rounded-[16px]" />
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
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
            ? "Submissions Closed" 
            : submitted 
              ? "Submission Complete!"
              : "Submission Deadline"}
        </h3>
      </div>

      {/* Countdown or Status Message */}
      {isExpired ? (
        <div className="flex flex-col items-center gap-[12px] w-full">
          <p className="text-[14px] text-white/80 text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
            The submission deadline has passed. No new submissions are being accepted.
          </p>
          <p className="text-[15px] text-white font-medium text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
            Results will be out soon :)
          </p>
          
          {showRickroll ? (
            <div className="flex flex-col items-center gap-[12px] w-full mt-[8px]">
              <div className="w-full max-w-[560px] aspect-video rounded-[12px] overflow-hidden border-2 border-[rgba(255,255,255,0.2)]">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="Results"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-[12px]"
                />
              </div>
              <p className="text-[14px] text-white/90 font-medium text-center w-full mt-[8px]" style={{ fontFamily: 'var(--font-body)' }}>
                🎉 Congratulations! You've been selected for the exclusive "Never Gonna Give You Up" award! 🎉
              </p>
              <p className="text-[12px] text-white/70 text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                Just kidding! Results are still being evaluated. <span className="text-[#ff4d00] font-bold">Check back later</span> for real updates! 😄
              </p>
            </div>
          ) : showButton ? (
            <button
              onClick={() => setShowRickroll(true)}
              className="mt-[8px] px-[24px] py-[12px] bg-gradient-to-r from-[#ff4d00] to-[#ff8800] hover:from-[#ff6600] hover:to-[#ff9900] text-white font-semibold rounded-[12px] transition-all duration-200 shadow-[0_0_15px_rgba(255,77,0,0.4)] hover:shadow-[0_0_20px_rgba(255,77,0,0.6)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Check Result
            </button>
          ) : null}
        </div>
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
            Deadline: January 21, 2026 at 10:00 AM IST
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

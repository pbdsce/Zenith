"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle2, Trophy, XCircle, Check, X } from "lucide-react";
import { Button } from "./button";

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
  isEvaluated?: boolean;
  evaluations?: Array<{
    evaluatorId: string;
    name: string;
    tier: "strongly_accepted" | "accepted" | "borderline" | "rejected";
    comment: string;
    createdAt: Date | string;
  }>;
  hasTeam?: boolean;
  rsvpStatus?: "pending" | "confirmed" | "declined";
  onRSVP?: (status: "confirmed" | "declined") => void;
}

export function DeadlineTimer({ teamStatus, hasSubmitted = false, isEvaluated = false, evaluations = [], hasTeam = true, rsvpStatus = "pending", onRSVP }: DeadlineTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverOffset, setServerOffset] = useState(0);
  const [error, setError] = useState(false);
  const [rsvpDeadline, setRsvpDeadline] = useState<Date | null>(null);
  const [rsvpTimeRemaining, setRsvpTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isRsvpExpired, setIsRsvpExpired] = useState(false);

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
          if (data.data.rsvpDeadline) {
            setRsvpDeadline(new Date(data.data.rsvpDeadline));
            setIsRsvpExpired(data.data.isRsvpExpired);
          }
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
  useEffect(() => {
    if (!rsvpDeadline || isRsvpExpired) return;

    const calculateRsvpTimeRemaining = (): TimeRemaining => {
      // Use server-adjusted time
      const now = Date.now() + serverOffset;
      const total = rsvpDeadline.getTime() - now;

      if (total <= 0) {
        setIsRsvpExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      const seconds = Math.floor((total / 1000) % 60);
      const minutes = Math.floor((total / 1000 / 60) % 60);
      const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
      const days = Math.floor(total / (1000 * 60 * 60 * 24));

      return { days, hours, minutes, seconds, total };
    };

    const timer = setInterval(() => {
      setRsvpTimeRemaining(calculateRsvpTimeRemaining());
    }, 1000);
    setRsvpTimeRemaining(calculateRsvpTimeRemaining());
    return () => clearInterval(timer);
  }, [rsvpDeadline, serverOffset, isRsvpExpired]);

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
  const hasRejectedEvaluation = evaluations.some(evaluation => evaluation.tier === 'rejected');
  const hasAcceptedEvaluation = evaluations.some(evaluation => evaluation.tier === 'accepted' || evaluation.tier === 'strongly_accepted');

  return (
    <div className="w-full backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.15)] rounded-[16px] p-[20px] border border-[rgba(255,255,255,0.2)] flex flex-col items-center justify-center text-center relative">
      <div className="absolute inset-0 rounded-[16px]">
        <div className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      </div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_0px_8px_2px_rgba(138,138,138,0.2)] rounded-[16px]" />
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
      {/* Header */}
      <div className="flex items-center justify-center gap-[12px] mb-[16px] w-full">
        {isExpired && hasTeam && isEvaluated ? (
          hasRejectedEvaluation ? (
            <XCircle className="w-5 h-5 text-red-400" />
          ) : hasAcceptedEvaluation ? (
            <Trophy className="w-5 h-5 text-[#ffd700]" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-[#ff4d00]" />
          )
        ) : isExpired ? (
          <AlertTriangle className="w-5 h-5 text-[#ff4d00]" />
        ) : submitted ? (
          <CheckCircle2 className="w-5 h-5 text-white" />
        ) : (
          <Clock className="w-5 h-5 text-white" />
        )}
        <h3 
          className={`text-[16px] font-semibold ${
            isExpired && hasTeam && isEvaluated
              ? hasRejectedEvaluation
                ? 'text-red-400'
                : hasAcceptedEvaluation
                  ? 'text-green-400'
                  : 'text-[#ff4d00]'
              : isExpired
                ? 'text-[#ff4d00]'
                : submitted
                  ? 'text-white'
                  : 'text-white'
          }`}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {isExpired && hasTeam && isEvaluated
            ? hasRejectedEvaluation
              ? "Team Not Selected"
              : hasAcceptedEvaluation
                ? "🎉 Your Team Has Been Selected!"
                : "Submissions Closed"
            : isExpired
              ? "Submissions Closed"
              : submitted
                ? "Submission Complete!"
                : "Submission Deadline"}
        </h3>
      </div>

      {/* Countdown or Status Message */}
      {isExpired ? (
        <div className="flex flex-col items-center gap-[12px] w-full">
          {hasTeam ? (
            isEvaluated ? (
              hasRejectedEvaluation ? (
                <>
                  <p className="text-[16px] text-red-400 font-semibold text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                    Unfortunately, your team was not selected for the next round.
                  </p>
                  <p className="text-[14px] text-white/80 text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                    Thank you for participating! We appreciate your effort and dedication.
                  </p>
                </>
              ) : hasAcceptedEvaluation ? (
                <>
                  <p className="text-[16px] text-green-400 font-semibold text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                    🎉 Congratulations! Your team has been selected for the next round!
                  </p>
                  <p className="text-[14px] text-white/80 text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                    Please confirm your participation:
                  </p>
                  
                  {/* RSVP Deadline Timer */}
                  {rsvpTimeRemaining && !isRsvpExpired && (
                    <div className="w-full mb-[12px]">
                      <p className="text-[12px] text-white/60 text-center mb-[8px]" style={{ fontFamily: 'var(--font-body)' }}>
                        RSVP Deadline:
                      </p>
                      <div className="flex justify-center gap-[8px] w-full">
                        {[
                          { value: rsvpTimeRemaining.days, label: 'Days' },
                          { value: rsvpTimeRemaining.hours, label: 'Hours' },
                          { value: rsvpTimeRemaining.minutes, label: 'Mins' },
                          { value: rsvpTimeRemaining.seconds, label: 'Secs' },
                        ].map((item, index) => (
                          <div 
                            key={index}
                            className="flex flex-col items-center justify-center min-w-[50px] p-[8px] rounded-[8px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)]"
                          >
                            <span 
                              className="text-[18px] font-bold text-white tabular-nums"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {String(item.value).padStart(2, '0')}
                            </span>
                            <span 
                              className="text-[9px] text-white/60 uppercase tracking-wider"
                              style={{ fontFamily: 'var(--font-body)' }}
                            >
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {isRsvpExpired && (
                    <p className="text-[13px] text-red-400 font-medium text-center w-full mb-[8px]" style={{ fontFamily: 'var(--font-body)' }}>
                      ⚠️ RSVP deadline has passed (January 24, 2026, 11:59 PM IST)
                    </p>
                  )}
                  
                  {/* RSVP Status Display */}
                  {(() => {
                    const StatusBadge = ({ status, message }: { status: "confirmed" | "declined"; message: string }) => (
                      <div className={`flex items-center justify-center gap-[8px] p-[12px] rounded-[12px] mt-[8px] ${
                        status === "confirmed" 
                          ? "bg-green-500/10 border border-green-500/20" 
                          : "bg-red-500/10 border border-red-500/20"
                      }`}>
                        {status === "confirmed" ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-red-400" />
                        )}
                        <p className={`text-[14px] font-medium ${status === "confirmed" ? "text-green-400" : "text-red-400"}`} style={{ fontFamily: 'var(--font-body)' }}>
                          {message}
                        </p>
                      </div>
                    );

                    if (isRsvpExpired) {
                      return (
                        <>
                          <p className="text-[13px] text-white/70 text-center w-full mt-[8px]" style={{ fontFamily: 'var(--font-body)' }}>
                            RSVP deadline has passed. Please contact the organizers if you need assistance.
                          </p>
                          {rsvpStatus === "confirmed" && <StatusBadge status="confirmed" message="✅ RSVP Confirmed! See you at the event!" />}
                          {rsvpStatus === "declined" && <StatusBadge status="declined" message="You have declined participation." />}
                        </>
                      );
                    }

                    if (!onRSVP) return null;
                    if (rsvpStatus === "confirmed" || rsvpStatus === "declined") {
                      return (
                        <div className="flex flex-col gap-[12px] w-full mt-[8px]">
                          {rsvpStatus === "confirmed" && <StatusBadge status="confirmed" message="✅ RSVP Confirmed! See you at the event!" />}
                          {rsvpStatus === "declined" && <StatusBadge status="declined" message="You have declined participation." />}
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-[12px] w-full mt-[8px]">
                        <p className="text-[14px] text-white/80 text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                          Please confirm your participation:
                        </p>
                        <div className="flex gap-[12px] w-full justify-center">
                          <Button onClick={() => onRSVP("confirmed")} variant="primary">
                            <Check className="w-4 h-4" />
                            Confirm Participation
                          </Button>
                          <Button onClick={() => onRSVP("declined")} variant="danger">
                            <X className="w-4 h-4" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  <p className="text-[14px] text-white/80 text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                    The submission deadline has passed. No new submissions are being accepted.
                  </p>
                  <p className="text-[15px] text-white font-medium text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                    Results will be out soon :)
                  </p>
                </>
              )
            ) : (
              <>
                <p className="text-[14px] text-white/80 text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                  The submission deadline has passed. No new submissions are being accepted.
                </p>
                <p className="text-[15px] text-white font-medium text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                  Results will be out soon :)
                </p>
              </>
            )
          ) : (
            <>
              <p className="text-[14px] text-white/80 text-center w-full" style={{ fontFamily: 'var(--font-body)' }}>
                The submission deadline has passed. No new submissions are being accepted.
              </p>
            </>
          )}
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

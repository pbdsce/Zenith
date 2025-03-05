'use client';

import { useEffect, useState } from "react";
import { Oxanium } from "next/font/google";

const oxan = Oxanium ({
    weight: "400",
    subsets: ['latin']
})

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface EventTimerProps {
  targetDate: string;  // Changed to string type
}

const EventTimer: React.FC<EventTimerProps> = ({ targetDate }) => {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  const calculateTimeLeft = (): TimeLeft => {
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted || !timeLeft) {
    return <div className="h-24 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center mt-20 justify-center text-white font-mono">
      <h2 className="text-2xl md:text-5xl font-bold tracking-wider mb-4 text-glow font-dystopian">
        EVENT STARTS IN
      </h2>
      <div className="flex gap-3 md:gap-5 text-center">
        {Object.entries(timeLeft).map(([unit, value], index, array) => (
          <div key={unit} className="flex items-center">
            <div className="flex flex-col gap-2 items-center">
              <div className={`${oxan.className} bg-heading bg-opacity-20 px-3 sm:px-5 py-2 sm:py-3 text-2xl md:text-2xl font-bold relative overflow-hidden`} 
                style={{
                  clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 19%)',
                  boxShadow: '0 0 10px #00f6ff, inset 0 0 10px #00f6ff',
                  border: '1px solid #00f6ff',
                  textShadow: '0 0 10px #00f6ff',
                }} 
                suppressHydrationWarning
              >
                {value}
                <div className="absolute top-0 left-0 w-full h-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,246,255,0.2) 0%, rgba(0,246,255,0) 100%)',
                    clipPath: 'polygon(0 0, 100% 0, 90% 15%, 0 15%)'
                  }}
                />
              </div>
              <div className={oxan.className}>
                <span className="text-sm md:text-base mt-1 uppercase">
                  {unit === "minutes" ? "Mins" : unit}
                </span>
              </div>
            </div>
            {index !== array.length - 1 && (
              <span className="text-2xl md:text-3xl font-bold ml-3 md:ml-5">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventTimer;

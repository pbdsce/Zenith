"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Import components for the landing page
import { Hero } from "@/components/hero";
import { Brief } from "@/components/brief";
import { Timeline } from "@/components/timeline";
import { SpaceFooter } from "@/components/footer";
import Events from "@/components/events";
import { StarsBackground } from "@/components/ui/stars-background";
import { Achievements } from "@/components/achievements";
import NavButtons from "@/components/navbar";
import CountdownTimer from "@/components/ui/countdown-timer";

export default function ZenithPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to ensure proper hydration
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state initially
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0ff]" />
          <p className="text-lg text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show Zenith landing page
  return (
    <main className="relative overflow-hidden">
      {/* Navigation
      <div className="fixed top-4 w-full px-4 flex justify-between z-50">
        <div className="ml-4 sm:ml-6">
          <CountdownTimer />
        </div>
        <NavButtons disableFixedPositioning={true} />
      </div> */}
      
      <div className="relative z-10">
        <section className="relative">
          <Hero />
        </section>
        <div className="inset-0 z-0">
          <StarsBackground />
        </div>
        <section className="relative">
          <Timeline />
        </section>
        <section className="relative">
          <Events />
        </section>
        <section className="relative">
          <Brief />
        </section>
        <section className="relative">
          <Achievements />
        </section>
        <section className="relative">
          <SpaceFooter />
        </section>
      </div>
    </main>
  );
}

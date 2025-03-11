"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-storage";

// Import components for the landing page
import { Hero } from "@/components/hero";
import { Brief } from "@/components/brief";
import { Timeline } from "@/components/timeline";
import { Achievements } from "@/components/achievements";
import { SpaceFooter } from "@/components/footer";
import Events from "@/components/events";
import { StarsBackground } from "@/components/ui/stars-background";
import NavButtons from "@/components/navbar";
import CountdownTimer from "@/components/ui/countdown-timer";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  // Check authentication status and handle redirect
  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const authenticated = isAuthenticated();

      if (authenticated) {
        // User is logged in, redirect to participants page
        setIsAuth(true);
        router.replace("/participants");
      } else {
        // User is not logged in, show landing page
        setIsAuth(false);
        setIsLoading(false);
      }
    };

    // Small delay to ensure proper hydration
    const timer = setTimeout(checkAuthAndRedirect, 100);
    return () => clearTimeout(timer);
  }, [router]);

  // During initial loading or authenticated redirect, return null to show loading.tsx
  if (isLoading || isAuth) {
    return null;
  }

  // Show landing page if not authenticated
  return (
    <main className="relative overflow-hidden">
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
          <SpaceFooter/>
        </section>
      </div>
    </main>
  );
}
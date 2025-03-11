"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-storage";
import { Loader2 } from "lucide-react";

// Import components for the landing page
import { Hero } from "@/components/hero";
import { Brief } from "@/components/brief";
import { Timeline } from "@/components/timeline";
import { SpaceFooter } from "@/components/footer";
import Events from "@/components/events";
import { StarsBackground } from "@/components/ui/stars-background";

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
        router.replace("/participants");
        setIsAuth(true);
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

  // Show loading state while checking auth
  if (isLoading && !isAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0ff]" />
          <p className="text-lg text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show a loading state until redirect completes
  if (isAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0ff]" />
          <p className="text-lg text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    );
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
          <SpaceFooter />
        </section>
      </div>
    </main>
  );
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
  // Show landing page for everyone
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Code, Flag, Trophy, Users, Timer, Award, Target, Space } from "lucide-react";
import { Hero } from "@/components/hero";
import { Brief } from "@/components/brief";
import { Timeline } from "@/components/timeline"
import { SpaceFooter } from "@/components/footer";
import Events from "@/components/events";
import { Gallery } from "@/components/gallery"
import { TwinkleBackground } from "@/components/ui/twinkle-background";

export default function Home() {
  return (
    <main>
      <section className="relative">
        <Hero />
      </section>
      <section className="relative">
        <Timeline />
      </section>
      <section className="relative">
        <Events/>
      </section>
      <section className="relative">
        <Brief />
      </section>
      <section className="relative">
        <SpaceFooter/>
      </section>
    </main>
  );
}
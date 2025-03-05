import { Hero } from "@/components/hero";
import { Brief } from "@/components/brief";
import { Timeline } from "@/components/timeline"
import { SpaceFooter } from "@/components/footer";
import Events from "@/components/events";
import { StarsBackground } from "@/components/ui/stars-background";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="inset-0 z-0">
        <StarsBackground />
      </div>
      <div className="relative z-10">
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
      </div>
    </main>
  );
}
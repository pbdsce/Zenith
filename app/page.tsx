import { Hero } from "@/components/hero";
import { Brief } from "@/components/brief";
import { Timeline } from "@/components/timeline";
import { Achievements } from "@/components/achievements";
import { SpaceFooter } from "@/components/footer";
import Events from "@/components/events";
import { StarsBackground } from "@/components/ui/stars-background";
import LoadingWrapper from "@/components/loading-wrapper";

export default function Home() {
  const content = (
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
          <Events/>
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

  return (
    <LoadingWrapper loadingTime={3000}>
      {content}
    </LoadingWrapper>
  );
}
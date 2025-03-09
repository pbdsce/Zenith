'use client'
import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect, memo } from "react";
import { achievementList } from "./achievementList";

// Title component with glitch effect
const GlitchTitle = memo(({ glitchEffect }: { glitchEffect: boolean }) => {
  const shouldReduceMotion = useReducedMotion();
  
  const baseAnimation = shouldReduceMotion ? {} : {
    initial: { opacity: 0, transform: 'translateY(20px)' },
    whileInView: { opacity: 1, transform: 'translateY(0)' },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 }
  };
  
  return (
    <div className="relative mb-7 md:mb-20">
      <motion.h2
        {...baseAnimation}
        className={`text-5xl md:text-7xl font-dystopian font-bold text-center gradient-text
          ${glitchEffect ? 'glitch' : ''}`}
        style={{
          textShadow: "0 0 20px rgba(0, 246, 255, 0.3), 0 0 40px rgba(0, 246, 255, 0.2), 0 0 60px rgba(0, 246, 255, 0.1)"
        }}
        data-text="Achievements"
      >
        Achievements
      </motion.h2>
      
      {glitchEffect && (
        <>
          <h2 
            className="glitch-copy absolute top-0 left-0 w-full text-5xl md:text-7xl font-dystopian font-bold text-center text-[#ff00ff] opacity-70"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)', transform: 'translate(-5px, -5px)' }}
            aria-hidden="true"
          >
            Achievements
          </h2>
          <h2 
            className="glitch-copy absolute top-0 left-0 w-full text-5xl md:text-7xl font-dystopian font-bold text-center text-[#00ffff] opacity-70"
            style={{ clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)', transform: 'translate(5px, 5px)' }}
            aria-hidden="true"
          >
            Achievements
          </h2>
        </>
      )}
    </div>
  );
});

GlitchTitle.displayName = "GlitchTitle";

// Memoized MobileTimeline component
const MobileTimeline = memo(() => {
  const shouldReduceMotion = useReducedMotion();
  
  const fadeIn = shouldReduceMotion ? {} : {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="flex flex-row items-center">
      <div className="flex flex-wrap max-w-xs gap-12">
        {Object.entries(achievementList).map(([category, people]) => (
          <div key={category} className="flex flex-6 flex-col justify-items-center items-start">
            <h3 className="text-2xl font-bold text-cyber-blue mb-2 text-heading font-dystopian">{category}</h3>
            <div className="relative">
              <div className="absolute left-0 h-full w-1 timeline-line" />
              {people.map((person, idx) => (
                <motion.div key={person.name} {...fadeIn} className="pl-4 mb-6 relative">
                  <div className="ml-12 max-w-xs break-words whitespace-normal">
                    <p className="text-lg font-bold text-gray-300">{person.name}</p>
                    <div className="absolute -left-1  bottom-1/2 transform -translate-y-1/2 h-2 w-4 timeline-line-horizontal" />
                    <div className="absolute left-8 bottom-1/2 transform translate-y-1/2 h-2 w-2 bg-cyan-400 rounded-full glow-dot mx-2" />
                    {person.achievements.map((ach, i) => (
                      <p key={i} className="text-sm text-gray-400">{ach}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

MobileTimeline.displayName = "MobileTimeline";

//Memoized DesktopTimeline component
const DesktopTimeline = memo(() => {
  const shouldReduceMotion = useReducedMotion();

  const fadeIn = shouldReduceMotion ? {} : {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="">
      <div className="flex flex-col mx-8 items-center w-full gap-12">
        {Object.entries(achievementList).map(([category, people], index) => (
          <div key={category} className="flex flex-col ml-14">
            <h3 className="text-2xl font-bold text-cyber-blue mb-2 text-heading break-all font-dystopian">{category}</h3>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.ceil(people.length / 5)}, 300px)` }}>
              {people.map((person, idx) => (
                <motion.div key={person.name} {...fadeIn} className="pl-4 relative">
                  <div className="absolute left-0 h-full w-1 timeline-line mr-5" />
                  
                  <div className="relative ml-12 mr-4 max-w-sm">
                    <p className="text-lg font-bold mt-6 text-gray-300">{person.name}</p>
                    <div className="absolute -left-16 bottom-1/2 transform -translate-y-1/2 h-2 w-6 timeline-line-horizontal" />
                    <div className="absolute -left-6 bottom-1/2 transform translate-y-1/2 h-2 w-2 bg-cyan-400 rounded-full glow-dot mx-2" />
                    {person.achievements.map((ach, i) => (
                      <p key={i} className="text-sm text-gray-400 break-words mr-5">{ach}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
            
          </div>
        ))}
      </div>
    </div>
   
  );
});

DesktopTimeline.displayName = "DesktopTimeline";

export function Achievements() {

  const [isMobile, setIsMobile] = useState(false);
  const [glitchEffect, setGlitchEffect] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Trigger glitch effect at intervals
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 200);
    }, 1000);
    
    return () => clearInterval(glitchInterval);
  }, []);

  return (
    // <TwinkleBackground backgroundColor="black" fadeTop={true}>
      <section className=" sm:pt-80" id="about">
        <div className="max-w-6xl justify-items-center mx-auto mb-10">
          <GlitchTitle glitchEffect={glitchEffect} />
          {isMobile ? <MobileTimeline /> : <DesktopTimeline />}
        </div>
      </section>
    // </TwinkleBackground>
  );
}

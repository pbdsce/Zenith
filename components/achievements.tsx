'use client'
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState, useEffect, memo } from "react";
import { achievementList } from "./achievementList";
import { Code, Award, Terminal, BookOpen, Briefcase } from 'lucide-react';

// Title component with glitch effect
const GlitchTitle = memo(({ glitchEffect }: { glitchEffect: boolean }) => {
  const shouldReduceMotion = useReducedMotion();
  
  const baseAnimation = shouldReduceMotion ? {} : {
    initial: { opacity: 0, transform: 'translateY(0px)' },
    whileInView: { opacity: 1, transform: 'translateY(0)' },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 }
  };
  
  return (
    <div className="relative mb-4 md:mb-15">
      <motion.h2
        {...baseAnimation}
        className={`text-5xl text-left md:text-7xl font-dystopian font-bold gradient-text
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
            className="glitch-copy absolute top-0 left-0 w-full text-5xl md:text-7xl font-dystopian font-bold text-[#ff00ff] opacity-70"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)', transform: 'translate(-5px, -5px)' }}
            aria-hidden="true"
          >
            Achievements
          </h2>
          <h2 
            className="glitch-copy absolute top-0 left-0 w-full text-5xl md:text-7xl font-dystopian font-bold text-[#00ffff] opacity-70"
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
const MobileTimeline = memo(({ selectedCategory }: { selectedCategory: string }) => {
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
          category === selectedCategory && (
            <div key={category} className="flex flex-6 flex-col justify-items-center items-start">
              <h3 className="text-2xl font-bold text-cyber-blue mb-2 text-heading font-dystopian">{category}</h3>
              <div className="relative mb-16">
                <div className="absolute left-0 h-full w-1 timeline-line" />
                {people.map((person, idx) => (
                  <motion.div key={person.name} {...fadeIn} className="pl-4 mb-6 relative">
                    <div className="ml-12 max-w-xs break-words whitespace-normal">
                      <p className="text-lg font-bold text-gray-300">{person.name}</p>
                      <div className="absolute -left-1 bottom-1/2 transform -translate-y-1/2 h-2 w-4 timeline-line-horizontal" />
                      <div className="absolute left-8 bottom-1/2 transform translate-y-1/2 h-2 w-2 bg-cyan-400 rounded-full glow-dot mx-2" />
                      {person.achievements.map((ach, i) => (
                        <p key={i} className="text-sm text-gray-400">{ach}</p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
});

MobileTimeline.displayName = "MobileTimeline";

// Memoized DesktopTimeline component
const DesktopTimeline = memo(({ selectedCategory }: { selectedCategory: string }) => {
  const shouldReduceMotion = useReducedMotion();

  const fadeIn = shouldReduceMotion ? {} : {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="h-[calc(100vh-200px)] overflow-y-auto desk-container">
      <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
      <div className="flex flex-col w-full gap-12">
        {Object.entries(achievementList).map(([category, people], index) => (
          category === selectedCategory && (
            <div key={category} className="flex flex-col ml-14 mb-16">
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
          )
        ))}
      </div>
    </div>
  );
});

DesktopTimeline.displayName = "DesktopTimeline";

export function Achievements() {
  const [isMobile, setIsMobile] = useState(false);
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(achievementList)[0]);

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

  useEffect(() => {
    const container = document.querySelector('.desk-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory]);
  

  const menuItems = [
    { id: 'GSoC', label: 'GSoC', icon: Code },
    { id: 'SmartIndiaHackathon', label: 'SIH', icon: Award },
    { id: 'Hackathons', label: 'Hackathons', icon: Terminal },
    { id: 'CP', label: 'CP', icon: BookOpen },
    { id: 'LFX', label: 'LFX', icon: Briefcase },
  ];

  return (
    <section className="min-h-screen w-full text-white pb-20 md:pb-40 lg:pb-60">
      <div className="max-w-6xl mx-8 mb-10">
        <GlitchTitle glitchEffect={glitchEffect} />

        {/* Horizontal Scrollable Buttons Mobile*/}
        <div className="lg:hidden mx-6 relative mb-8">
          <div 
            className="flex overflow-x-auto sm:px-6 space-x-4 pb-4"
            style={{
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {menuItems.map((item, index) => {
              const achieversCount = achievementList[item.id]?.length || 0;
              return (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={item.id}
                  onClick={() => setSelectedCategory(item.id)}
                  className={`flex items-center gap-2 whitespace-nowrap py-2 rounded-lg transition-all duration-300
                    ${selectedCategory === item.id 
                      ? 'bg-[#2AD7DB]/10 text-[#2AD7DB] border-[#2AD7DB]' 
                      : 'text-gray-400 hover:text-white border-gray-700'}`}
                >
                  <item.icon className={`w-5 h-5 ${selectedCategory === item.id ? 'text-[#2AD7DB]' : 'text-gray-400'}`} />
                  <span className="text-base font-medium">{item.label} ({achieversCount})</span>
                </motion.button>
              );
            })}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none" />

          <MobileTimeline selectedCategory={selectedCategory} />
        </div>

        {/* Vertical Scrollable buttons Desktop */}
        <div className="hidden w-full lg:grid lg:grid-cols-12 gap-4 lg:gap-6 lg:mt-3 lg:pr-8">
          <div className="lg:col-span-2 h-[calc(100vh-200px)] overflow-y-auto lg:sticky lg:top-32 lg:self-start">
              <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
              `}</style>
              <div className="space-y-2">
                {menuItems.map((item, index) => {
                  const achieversCount = achievementList[item.id]?.length || 0;
                  return (
                    <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={item.id}
                            onClick={() => setSelectedCategory(item.id)}
                            className={`w-full text-left py-5 border-b-2 transition-all duration-300 
                              flex items-center gap-4 hover:pl-2
                              ${selectedCategory === item.id 
                                ? 'border-[#2AD7DB] text-[#2AD7DB]' 
                                : 'border-gray-700 text-gray-400 hover:text-white'}`}
                          >
                            <item.icon className={`w-6 h-6 ${selectedCategory === item.id ? 'text-[#2AD7DB]' : 'text-gray-400'}`} />
                            <span className="whitespace-nowrap tracking-wider font-medium">{item.label} ({achieversCount})</span>
                          </motion.button>
                  )})}
              </div>
          </div>
          <div className="lg:col-span-10">
            <DesktopTimeline selectedCategory={selectedCategory} />
          </div>
        </div>

      </div>
    </section>
  );
}
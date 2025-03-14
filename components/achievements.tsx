'use client'
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState, useEffect, memo, useRef } from "react";
import { achievementList } from "./achievementList";
import { Code2, Award, Trophy, Target, Globe } from 'lucide-react';

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
    <div className="relative mb-8 md:mb-20 text-center w-full">
      <motion.h2
        {...baseAnimation}
        className={`text-5xl md:text-7xl font-dystopian font-bold mx-auto
          ${glitchEffect ? 'glitch' : ''}`}
        style={{
          textShadow: "0 0 20px rgba(0, 246, 255, 0.3), 0 0 40px rgba(0, 246, 255, 0.2), 0 0 60px rgba(0, 246, 255, 0.1)"
        }}
        data-text="Point Blank's Achievements"
      >
        <span className="text-[#00FF7F] gradient-text-green">Point Blank's </span><span className="text-[#00f6ff] gradient-text">Achievements</span>
      </motion.h2>
      
      {glitchEffect && (
        <>
          <h2 
            className="glitch-copy absolute top-0 left-0 w-full text-5xl md:text-7xl font-dystopian font-bold text-[#ff00ff] opacity-70 text-center"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)', transform: 'translate(-5px, -5px)' }}
            aria-hidden="true"
          >
            <span className="text-[#00FF7F]">Point Blank's </span><span className="text-[#ff00ff]">Achievements</span>
          </h2>
          <h2 
            className="glitch-copy absolute top-0 left-0 w-full text-5xl md:text-7xl font-dystopian font-bold text-[#00ffff] opacity-70 text-center"
            style={{ clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)', transform: 'translate(5px, 5px)' }}
            aria-hidden="true"
          >
            <span className="text-[#00FF7F]">Point Blank's </span><span className="text-[#00ffff]">Achievements</span>
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

  const lineAnimation = shouldReduceMotion ? {} : {
    initial: { height: 0 },
    whileInView: { height: '100%' }, 
    transition: { duration: 0.7 }
  };

  const horizontalLineAnimation = shouldReduceMotion ? {} : {
    initial: { width: 0 },
    whileInView: { width: '3rem' }, // Fixed width instead of 100%
    transition: { duration: 0.3, delay: 0.2 }
  };

  return (
    <div className="flex flex-row items-center justify-center w-full">
      <div className="flex flex-wrap max-w-md mx-auto gap-12">
        {Object.entries(achievementList).map(([category, people]) => (
          category === selectedCategory && (
            <div key={category} className="flex flex-6 flex-col justify-items-center items-start w-full">
              <h3 className="text-2xl font-bold text-cyber-blue mb-2 text-heading font-dystopian text-center w-full">{category}</h3>
              <div className="relative mb-16 w-full">
                <motion.div 
                  className="absolute left-0 h-full w-1 timeline-line" 
                  {...lineAnimation}
                />
                {people.map((person, idx) => (
                  <motion.div key={person.name} {...fadeIn} className="pl-4 mb-8 relative">
                    <div className="ml-12 max-w-xs break-words whitespace-normal">
                      <p className="text-xl font-bold text-gray-300">{person.name}</p>
                      <motion.div 
                        className="absolute -left-1 top-[1.5rem] transform -translate-y-1/2 h-2 w-4 timeline-line-horizontal" 
                        {...horizontalLineAnimation}
                      />
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

  const lineAnimation = shouldReduceMotion ? {} : {
    initial: { height: 0 },
    whileInView: { height: '100%' },
    transition: { duration: 0.7 }
  };

  const horizontalLineAnimation = shouldReduceMotion ? {} : {
    initial: { width: 0 },
    whileInView: { width: '3rem' }, // Fixed width instead of 100%
    transition: { duration: 0.3, delay: 0.2 }
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
            <div key={category} className="flex flex-col mb-16">
              <h3 className="text-3xl font-bold text-cyber-blue mb-4 text-heading break-all font-dystopian">{category}</h3>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.ceil(people.length / 5)}, 300px)` }}>
                {people.map((person, idx) => (
                  <motion.div key={person.name} {...fadeIn} className="pl-4 relative">
                    <motion.div 
                      className="absolute left-0 h-full w-1 timeline-line mr-5" 
                      {...lineAnimation}
                    />
                    
                    <div className="relative ml-12 mr-4 max-w-sm">
                      <p className="text-xl font-bold mt-6 text-gray-300">{person.name}</p>
                      <motion.div 
                        className="absolute -left-16 top-[1.8rem] transform -translate-y-1/2 h-2 w-6 timeline-line-horizontal"
                        {...horizontalLineAnimation}
                      />
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
  const [progressValue, setProgressValue] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSwitchIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Auto-switch categories with progress bar
  useEffect(() => {
    const switchDuration = 8000; // 8 seconds per category
    const progressUpdateInterval = 100; // Update progress every 100ms
    const progressStep = (100 * progressUpdateInterval) / switchDuration;
    
    const startAutoSwitch = () => {
      if (autoSwitchIntervalRef.current) clearInterval(autoSwitchIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      
      setProgressValue(0);
      
      // Progress bar update
      progressIntervalRef.current = setInterval(() => {
        setProgressValue(prev => {
          const newValue = prev + progressStep;
          return newValue > 100 ? 100 : newValue;
        });
      }, progressUpdateInterval);
      
      // Category switch
      autoSwitchIntervalRef.current = setInterval(() => {
        const categories = Object.keys(achievementList);
        const currentIndex = categories.indexOf(selectedCategory);
        const nextIndex = (currentIndex + 1) % categories.length;
        setSelectedCategory(categories[nextIndex]);
        setProgressValue(0);
      }, switchDuration);
    };
    
    startAutoSwitch();
    
    return () => {
      if (autoSwitchIntervalRef.current) clearInterval(autoSwitchIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [selectedCategory]);

  // Reset progress when manually switching category
  const handleCategorySelect = (categoryId: string) => {
    if (autoSwitchIntervalRef.current) clearInterval(autoSwitchIntervalRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgressValue(0);
    setSelectedCategory(categoryId);
  };

  useEffect(() => {
    const container = document.querySelector('.desk-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory]);
  

  const menuItems = [
    { id: 'GSoC', label: 'GSoC', icon: Code2 },
    { id: 'Smart India Hackathon', label: 'SIH', icon: Trophy },
    { id: 'Hackathons', label: 'Hackathons', icon: Award },
    { id: 'CP', label: 'CP', icon: Target },
    { id: 'LFX', label: 'LFX', icon: Globe },
  ];

  return (
    <section className="flex justify-center items-center min-h-screen w-full text-white py-16">
      <div className="container max-w-6xl mx-auto px-4 flex flex-col items-center">
        <GlitchTitle glitchEffect={glitchEffect} />

        {/* Horizontal Scrollable Buttons Mobile*/}
        <div className="lg:hidden relative mb-8 w-full">
          <div 
            className="flex overflow-x-auto space-x-4 pb-4 justify-center"
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
                  onClick={() => handleCategorySelect(item.id)}
                  className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 rounded-lg transition-all duration-300
                    ${selectedCategory === item.id 
                      ? 'bg-[#2AD7DB]/10 text-[#2AD7DB] border-[#2AD7DB]' 
                      : 'text-gray-400 hover:text-white border-gray-700'}`}
                >
                  <item.icon className={`w-4 h-4 ${selectedCategory === item.id ? 'text-[#2AD7DB]' : 'text-gray-400'}`} />
                  <span className="text-base font-medium">{item.label} ({achieversCount})</span>
                </motion.button>
              );
            })}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none" />

          <MobileTimeline selectedCategory={selectedCategory} />
        </div>

        {/* Vertical Scrollable buttons Desktop - Redesigned */}
        <div className="hidden w-full lg:grid lg:grid-cols-12 gap-8 lg:gap-10 lg:mt-3 mx-auto">
          <div className="lg:col-span-3 lg:sticky lg:top-32 lg:self-start">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-5">
                {menuItems.map((item, index) => {
                  const achieversCount = achievementList[item.id]?.length || 0;
                  const isActive = selectedCategory === item.id;
                  
                  return (
                    <div key={item.id} className="mb-3 relative">
                      <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleCategorySelect(item.id)}
                        className={`w-full px-4 py-4 rounded-lg transition-all duration-300 flex items-center
                          ${isActive 
                            ? 'bg-gradient-to-r from-[#00f6ff]/10 to-[#2AD7DB]/5 text-white' 
                            : 'hover:bg-white/5 text-gray-400'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 
                          ${isActive ? 'bg-gradient-to-r from-[#00f6ff] to-[#2AD7DB]' : 'bg-gray-800'}`}>
                          <item.icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <span className="block font-medium">{item.label}</span>
                          <span className="text-xs opacity-70">{achieversCount} achievers</span>
                        </div>
                      </motion.button>
                      
                      {/* Progress bar */}
                      {isActive && (
                        <div className="h-1 bg-gray-800 mt-1 rounded overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressValue}%` }}
                            transition={{ ease: "linear" }}
                            className="h-full bg-gradient-to-r from-[#00f6ff] to-[#2AD7DB]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <div className="mt-6 pt-4 border-t border-gray-800/50 text-xs text-gray-500 text-center">
                  Auto-switching every 8 seconds. Double click the tab to pause.
                </div>
              </div>
          </div>
          <div className="lg:col-span-9 flex justify-center">
            <DesktopTimeline selectedCategory={selectedCategory} />
          </div>
        </div>
      </div>
    </section>
  );
}
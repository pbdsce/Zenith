'use client'
import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import EventBox from './ui/EventBox';
import { Event } from './types';
import ctf from '@/public/images/ctf.webp'
import dsa from '@/public/images/dsa.webp'
import kaggle from '@/public/images/kaggle.webp'
import hackathon from '@/public/images/hackathon.webp'

const events: Event[] = [
    {
      id: 1,
      title: "DSA",
      category: "Programming",
      description: "Test your problem-solving skills in a high-speed Data Structures & Algorithms contest.",
      fullDescription: "The DSA CODE CHALLENGE is designed for programmers who thrive on solving complex algorithmic problems. Compete against top coders, tackle time-bound problems, and optimize your solutions to climb the leaderboard. With categories ranging from beginner to advanced, this event is the perfect place to showcase your mastery of data structures and algorithms.",
      time: "10:00 - 13:00",
      image: dsa.src,
    },
    {
      id: 2,
      title: "CTF",
      category: "Cybersecurity",
      description: "Compete in an intense Capture the Flag competition against top ethical hackers.",
      fullDescription: "CTF SHOWDOWN brings together security enthusiasts, ethical hackers, and students to battle in a high-stakes cybersecurity challenge. Solve cryptography, reverse engineering, forensics, and web exploitation puzzles to claim victory. Whether you're a seasoned professional or a beginner looking to test your skills, this event offers an exciting opportunity to push your limits and learn from the best.",
      time: "14:00 - 20:00",
      image: ctf.src,
    },
    {
      id: 3,
      title: "KAGGLE",
      category: "Data Science",
      description: "A Kaggle-style competition where teams analyze real-world datasets and build AI models.",
      fullDescription: "The KAGGLE DATA CHALLENGE is a premier data science competition where participants work on real-world datasets to develop predictive models. Compete solo or in teams, leverage cutting-edge machine learning techniques, and optimize your model's accuracy to top the leaderboard. Expert mentors and industry leaders will be present to guide participants in unlocking valuable insights from data.",
      time: "14:00 - 20:00",
      image: kaggle.src,
    },
    {
      id: 4,
      title: "HACKATHON",
      category: "Tech",
      description: "A 18-hour coding marathon where innovators build groundbreaking applications.",
      fullDescription: "HACKATHON is the ultimate test of creativity and endurance for developers, engineers, and designers. Over 18 hours, participants collaborate in teams to develop innovative applications, tackle real-world problems, and present their solutions to a panel of judges. With categories spanning web development, AI, blockchain, and IoT, this event is a breeding ground for the next big tech breakthrough.",
      time: "Starts at 11PM",
      image: hackathon.src,
    }
];

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
        data-text="About the Events"
      >
        About the Events
      </motion.h2>
      
      {glitchEffect && (
        <>
          <h2 
            className="glitch-copy absolute top-0 left-0 w-full text-5xl md:text-7xl font-dystopian font-bold text-center text-[#ff00ff] opacity-70"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)', transform: 'translate(-5px, -5px)' }}
            aria-hidden="true"
          >
            About the Events
          </h2>
          <h2 
            className="glitch-copy absolute top-0 left-0 w-full text-5xl md:text-7xl font-dystopian font-bold text-center text-[#00ffff] opacity-70"
            style={{ clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)', transform: 'translate(5px, 5px)' }}
            aria-hidden="true"
          >
            About the Events
          </h2>
        </>
      )}
    </div>
  );
});

GlitchTitle.displayName = "GlitchTitle";


function Events() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [glitchEffect, setGlitchEffect] = useState(false);

  // Save scroll position when expanding a box
  const handleExpand = (id: number) => {
    setScrollPosition(window.scrollY);
    setExpandedId(id);
  };

  const handleClose = () => {
    setExpandedId(null);
    // Restore scroll position after animation completes
    setTimeout(() => {
      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto'
      });
    }, 50);
  };

  // Prevent body scrolling when a box is expanded
  useEffect(() => {
    if (expandedId !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [expandedId]);

  // Trigger glitch effect at intervals
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 200);
    }, 1000);
    
    return () => clearInterval(glitchInterval);
  }, []);

  return (
    // <TwinkleBackground>
      <div className="min-h-screen text-white p-4 sm:p-8 flex flex-col items-center justify-center">
        <GlitchTitle glitchEffect={glitchEffect} />
        
        {/* Main grid of event boxes */}
        <motion.div 
          className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.3,
            staggerChildren: 0.1
          }}
        >
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.5 }}
            >
              <EventBox 
                key={event.id}
                event={event}
                isExpanded={false}
                isFaded={expandedId !== null}
                onExpand={() => handleExpand(event.id)}
                onClose={handleClose}
              />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Modal overlay for expanded event */}
        <AnimatePresence>
          {expandedId !== null && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
            >
              <EventBox 
                event={events.find(e => e.id === expandedId)!}
                isExpanded={true}
                isFaded={false}
                onExpand={() => {}}
                onClose={handleClose}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    // </TwinkleBackground>
  );
}

export default Events;
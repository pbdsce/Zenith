'use client';

import { useState, useEffect, useRef } from 'react';
import { Monoton } from "next/font/google";
import EventTimer from "@/components/ui/eventtimer";
import { Oxanium } from "next/font/google";
import { motion } from "framer-motion";
import Loading from "@/app/loading";

const oxan = Oxanium ({
    weight: "400",
    subsets: ['latin']
})


export function Hero(){
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    
    // If video is already loaded
    if (video && video.readyState >= 3) {
      setIsLoading(false);
    }

    // Fallback timeout after 5 seconds
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="relative h-[63rem] bg-black before:absolute before:bottom-0 before:left-0 before:w-full before:h-1/3 before:bg-gradient-to-b before:from-transparent before:to-black">
    {/* Video Background */}
      <video 
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover" 
        autoPlay 
        loop 
        muted 
        playsInline
        onLoadedData={handleVideoLoad}
      >
        <source src="/videos/bg2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-b from-transparent to-black"></div>
  
    <div className="container mx-auto h-full pt-60 flex flex-col justify-center items-center relative z-10">
      <div className="text-center">
        <div className="glow-wrapper">
            <motion.h1 
            className={`font-dystopian text-[6rem] md:text-[16rem] text-white relative z-10 select-none`}
            animate={{
              textShadow: [
              "0 0 25px rgba(255, 255, 255, 0.5), 0 0 50px rgba(255, 255, 255, 0.4), 0 0 75px rgba(255, 255, 255, 0.3)",
              "0 0 40px rgba(255, 255, 255, 0.7), 0 0 70px rgba(255, 255, 255, 0.5), 0 0 90px rgba(255, 255, 255, 0.4)",
              "0 0 25px rgba(255, 255, 255, 0.5), 0 0 50px rgba(255, 255, 255, 0.4), 0 0 75px rgba(255, 255, 255, 0.3)",
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            >
            ZENITH
            </motion.h1>
        </div>
        <p className={`${oxan.className} text-xs md:text-xl text-muted-foreground -mt-7 md:-mt-24 max-w-xs sm:max-w-3xl mx-auto`}>
              A 36-hour Point Blank contest featuring CTF, a Kaggle competition,
              Hackathon, and DSA —where teams compete in a relentless test of skill, strategy, and endurance!
            </p>
        <div className="pt-96">
          <EventTimer targetDate={new Date("2025-04-27T00:00:00").toISOString()} />
        </div>
      </div>
    </div>
  </div>
    );
}

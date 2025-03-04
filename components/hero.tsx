'use client';

import { useState, useEffect } from 'react';
import { Monoton } from "next/font/google";
import EventTimer from "@/components/ui/eventtimer";
import { Oxanium } from "next/font/google";
import { motion } from "framer-motion";
import { TwinkleBackground } from "@/components/ui/twinkle-background";
import Loading from "@/app/loading";

const oxan = Oxanium ({
    weight: "400",
    subsets: ['latin']
})

const mon = Monoton({
  weight:'400',
  subsets:['latin']

})

export function Hero(){
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Adjust the timeout duration as needed

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="relative h-[63rem] bg-black before:absolute before:bottom-0 before:left-0 before:w-full before:h-1/3 before:bg-gradient-to-b before:from-transparent before:to-black">
    {/* Video Background */}
      <video 
        className="absolute top-0 left-0 w-full h-full object-cover" 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/videos/bg1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-b from-transparent to-black"></div>
  
    <div className="container mx-auto h-full pt-60 flex flex-col justify-center items-center relative z-10">
      <div className="text-center">
        <div className="glow-wrapper">
          <motion.h1 
            className={`${mon.className} text-5xl md:text-[12rem] text-heading relative z-10`}
            animate={{
              textShadow: [
                "0 0 25px rgba(0, 246, 255, 0.5), 0 0 50px rgba(0, 246, 255, 0.4), 0 0 75px rgba(0, 246, 255, 0.3)",
                "0 0 40px rgba(0, 246, 255, 0.7), 0 0 70px rgba(0, 246, 255, 0.5), 0 0 90px rgba(0, 246, 255, 0.4)",
                "0 0 25px rgba(0, 246, 255, 0.5), 0 0 50px rgba(0, 246, 255, 0.4), 0 0 75px rgba(0, 246, 255, 0.3)",
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
        <p className={`${oxan.className} text-sm md:text-xl text-muted-foreground mt-6 max-w-xl sm:max-w-3xl mx-auto`}>
              A 36-hour Point Blank contest featuring CTF, a Kaggle competition, 
              Hackathon, and CP, where the top scorer will be crowned 
              Programmer of the Year!
            </p>
        <div className="pt-96">
          <EventTimer targetDate={new Date("2025-04-27T00:00:00").toISOString()} />
        </div>
      </div>
    </div>
  </div>
    );
}

'use client';

import { useEffect, useState, useRef, ReactNode, useMemo } from 'react';

interface TwinkleBackgroundProps {
  children: ReactNode;
  from?: string;
  to?: string;
  via?: string;
  direction?: 'to-t' | 'to-tr' | 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'to-l' | 'to-tl';
  backgroundColor?: string;
  fadeTop?: boolean;
  gradient?: string; // New prop for linear gradient
}

export function TwinkleBackground({ 
  children, 
  backgroundColor = '#000000',
  fadeTop = false,
  gradient, // Destructure the new prop
  ...props 
}: TwinkleBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1920, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1080 
  });
  interface Dot {
    x: number;
    y: number;
    size: number;
    starClass: string;
    opacity: number;
  }
  const [dots, setDots] = useState<Dot[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions(prevDimensions => {
        if (prevDimensions.width !== rect.width || prevDimensions.height !== rect.height) {
          return { width: rect.width, height: rect.height };
        }
        return prevDimensions;
      });
      setIsLoaded(true);
    };

    let timeout: NodeJS.Timeout;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(updateDimensions, 250);
    });
    
    observer.observe(containerRef.current);
    updateDimensions();

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const spacing = 100;
    const maxDots = 500;
    const dotsArray = [];
    
    const columns = Math.floor(dimensions.width / spacing);
    const rows = Math.floor(dimensions.height / spacing);
    const totalDots = Math.min(columns * rows, maxDots);
    
    for (let i = 0; i < totalDots; i++) {
      dotsArray.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 2 + 1, // Random size between 1-3px
        starClass: `star-${Math.floor(Math.random() * 3) + 1}`, // Randomly assign star-1, star-2, or star-3
        opacity: Math.random() * 0.5 + 0.1
      });
    }
    
    setDots(dotsArray);
  }, [dimensions]);

  return (
    <div 
      ref={containerRef} 
      className="relative bg-black w-full overflow-hidden"
      style={{ backgroundColor, background: gradient || backgroundColor }} // Apply gradient if provided
    >
      <div 
        className={`absolute inset-0 transition-opacity duration-500 overflow-hidden ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {dots.map((dot, index) => (
          <div
            key={index}
            className={`absolute rounded-full bg-[#2AD7DB] ${dot.starClass}`}
            style={{
              left: `${Math.min(dot.x, dimensions.width - 4)}px`,
              top: `${Math.min(dot.y, dimensions.height - 4)}px`,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              opacity: dot.opacity,
              transform: 'translate3d(0,0,0)',
              willChange: 'opacity',
              boxShadow: '0 0 4px rgba(42,215,219,0.5)'
            }}
          />
        ))}
      </div>
      {fadeTop && (
        <div className={`absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent z-[1]`} />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

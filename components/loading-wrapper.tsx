'use client'

import { useState, useEffect, ReactNode } from "react";
import LoadingScreen from "./loading-screen";

interface LoadingWrapperProps {
  children: ReactNode;
  loadingTime?: number;
}

export default function LoadingWrapper({ 
  children, 
  loadingTime = 5000 
}: LoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingTime);

    return () => clearTimeout(timer);
  }, [loadingTime]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

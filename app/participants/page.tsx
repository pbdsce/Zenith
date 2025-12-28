"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function ParticipantsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#171717]">
      <div className="text-white" style={{ fontFamily: 'var(--font-body)' }}>Redirecting...</div>
    </div>
  );
}

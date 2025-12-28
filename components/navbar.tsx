'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export function NavButtons({ disableFixedPositioning = false }) {
  const { user } = useAuth();
  const isLoggedIn = !!user;


  return (
    <div className={`${!disableFixedPositioning ? "fixed top-4 w-full px-4" : ""} flex justify-center sm:justify-end sm:px-6 z-50`}>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-8">
        <Link href="/zenith">
          <button className="cybr-btn cybr-btn--primary">
            Zenith
          </button>
        </Link>
        
        <Link href="/participants">
          <button className="cybr-btn">
            Participants
          </button>
        </Link>
        
        {isLoggedIn ? (
          <Link href="/profile">
            <button className="cybr-btn">
              Profile
            </button>
          </Link>
        ) : (
          <div className="flex gap-3 sm:gap-8">
            <Link href="/register">
              <button className="cybr-btn">
                Register
              </button>
            </Link>
            <Link href="/login">
              <button className="cybr-btn">
                Login
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default NavButtons;

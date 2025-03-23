'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import '@/styles/cybr-btn.css';

export function NavButtons({ disableFixedPositioning = false }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check for authentication data in local storage
    const checkAuthStatus = () => {
      try {
        const authData = localStorage.getItem('zenith_auth_data');
        if (authData) {
          const parsedData = JSON.parse(authData);
          if (parsedData?.user?.uid && parsedData?.token) {
            setIsLoggedIn(true);
            setUsername(parsedData.user.name || parsedData.user.email || 'User');
          } else {
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
    
    // Listen for storage changes in case user logs in/out in another tab
    window.addEventListener('storage', checkAuthStatus);
    return () => window.removeEventListener('storage', checkAuthStatus);
  }, []);

  return (
    <div className={`${!disableFixedPositioning ? "fixed top-4 w-full px-4" : ""} flex justify-center sm:justify-end sm:px-6 z-50`}>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-8">
        <Link href="/">
          <button className="cybr-btn cybr-btn--primary">
            Home
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

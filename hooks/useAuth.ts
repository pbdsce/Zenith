'use client';

import { useState, useEffect } from 'react';
import { 
  AuthUser, 
  AuthData,
  storeAuthData, 
  getAuthData, 
  clearAuthData, 
  isAuthenticated as checkIsAuthenticated,
  getCurrentUser as getUser,
  isAdmin as checkIsAdmin
} from '@/lib/auth-storage';

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from storage when component mounts
  useEffect(() => {
    const initAuth = () => {
      const currentUser = getUser();
      setUser(currentUser);
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      const authData: AuthData = {
        user: data.user,
        token: data.token
      };
      
      storeAuthData(authData);
      setUser(data.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    clearAuthData();
    setUser(null);
  };
  
  // Function to refresh user data
  const refreshUser = async () => {
    setIsLoading(true);
    const authData = getAuthData();
    
    if (!authData) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    
    try {
      // Fetch latest user data
      const response = await fetch(`/api/users/${authData.user.uid}`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update stored user data
        const updatedAuthData = {
          ...authData,
          user: data.user
        };
        
        storeAuthData(updatedAuthData);
        setUser(data.user);
      } else {
        // If error, logout user
        clearAuthData();
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    user,
    isAuthenticated: user !== null,
    isAdmin: user?.isAdmin || false,
    isLoading,
    login,
    logout,
    refreshUser
  };
}

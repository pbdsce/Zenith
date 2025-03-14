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

// Define the expected response type from the registration API
interface RegisterResponse {
  message: string;
  id: string;
  authUid: string;
  profile_picture: string;
  status: "pending_verification" | "success" | "error";
  user: AuthUser;
  token?: string; // Optional, if your API returns a token
  error?: string; // Optional, for error messages
}

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (formData: FormData) => Promise<RegisterResponse>;
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

  // Register function
  const register = async (formData: FormData): Promise<RegisterResponse> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/registration', {
        method: 'POST',
        body: formData
      });
      
      const data: RegisterResponse = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Create user object from registration data
      const newUser: AuthUser = {
        uid: data.id,
        // Remove authUid or update the AuthUser type in auth-storage.ts
        email: formData.get('email') as string,
        name: formData.get('name') as string,
        isAdmin: false,
        profile_picture: data.profile_picture || '',  // Add default value
        status: data.status || 'active',  // Add default value
        // Include other user properties as needed
      };

      // Create auth data object
      const authData: AuthData = {
        user: newUser,
        token: data.token || '' // If your API returns a token
      };
      
      // Store auth data in local storage
      storeAuthData(authData);
      
      // Update user state
      setUser(newUser);
      
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
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
    register,
    logout,
    refreshUser
  };
}

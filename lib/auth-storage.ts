/**
 * Authentication storage utility for Zenith
 * Handles storing and retrieving user authentication data from browser storage
 */

// Type definitions for auth data
export interface AuthUser {
  uid: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  profile_picture: string | null;
  status: string;
}

export interface AuthData {
  user: AuthUser;
  token: string;
  expiresAt?: number; // Timestamp when the token expires
}

const AUTH_STORAGE_KEY = 'zenith_auth_data';

/**
 * Store authentication data in browser storage
 */
export const storeAuthData = (authData: AuthData): void => {
  // If running in a browser environment
  if (typeof window !== 'undefined') {
    // Add expiration time (30 days from now) if not present
    if (!authData.expiresAt) {
      authData.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    // Always use localStorage
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  }
};

/**
 * Retrieve authentication data from browser storage
 */
export const getAuthData = (): AuthData | null => {
  // If running in a browser environment
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (data) {
      try {
        const authData = JSON.parse(data) as AuthData;
        
        // Check if token is expired
        if (authData.expiresAt && authData.expiresAt < Date.now()) {
          // Token expired, clear storage and return null
          clearAuthData();
          return null;
        }
        
        return authData;
      } catch (e) {
        console.error('Error parsing auth data:', e);
        return null;
      }
    }
  }
  
  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getAuthData() !== null;
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = (): AuthUser | null => {
  const authData = getAuthData();
  return authData ? authData.user : null;
};

/**
 * Get the authentication token
 */
export const getAuthToken = (): string | null => {
  const authData = getAuthData();
  return authData ? authData.token : null;
};

/**
 * Clear authentication data (logout)
 */
export const clearAuthData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

/**
 * Check if current user is an admin
 */
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user ? user.isAdmin : false;
};

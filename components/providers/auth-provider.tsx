"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "@/Firebase";
import { useRouter } from "next/navigation";
import { VerifyEmail } from "@/components/auth/verify-email";

const API_ENDPOINTS = {
    login: '/api/user/login',
    register: '/api/user/register',
    userProfile: '/api/user/profile',
};

interface UserProfile {
    uid: string;
    name: string;
    email: string;
    role: "user" | "admin" | "evaluator";
    teamCode?: string;
    isLooking: boolean;
    profile_picture?: string;
    emailVerified?: boolean;
    [key: string]: any;
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (formData: FormData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    getToken: () => Promise<string | null>;
    sendVerificationEmail: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
    refreshUser: async () => { },
    getToken: async () => null,
    sendVerificationEmail: async () => { },
    resetPassword: async () => { },
});

import { useToast } from "@/hooks/use-toast";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    const fetchUserProfile = async (currentUser: FirebaseUser) => {
        try {
            // Force reload user to get latest emailVerified status
            await currentUser.reload();
            const token = await currentUser.getIdToken(true);
            const response = await fetch(API_ENDPOINTS.userProfile, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Handle both direct object return and { success: true, data: ... } format
                const userData = data.success ? data.data : data;
                
                if (userData) {
                    setUser({
                        ...userData,
                        emailVerified: currentUser.emailVerified
                    });
                } else {
                    console.error("User data is empty");
                    setUser(null);
                }
            } else {
                console.error("Failed to fetch user profile:", response.status, response.statusText);
                // If 404, maybe they are registered in Firebase but not MongoDB yet (registration flow)
                setUser(null);
                if (response.status !== 404) {
                    toast({
                        variant: "destructive",
                        title: "Error fetching profile",
                        description: "Failed to load user profile. Please try refreshing the page."
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUser(null);
            toast({
                variant: "destructive",
                title: "Connection Error",
                description: "Could not connect to the server. Please check your internet connection."
            });
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                await fetchUserProfile(firebaseUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setLoading(true); // Start loading immediately
            const response = await fetch(API_ENDPOINTS.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setLoading(false); // Stop loading on error
                if (response.status === 401) {
                    throw new Error(data.message || 'Invalid email or password.');
                } else if (response.status === 404) {
                    throw new Error(data.message || 'Account not found. Please register first.');
                } else if (response.status === 500) {
                    throw new Error(data.message || 'Server error. Please try again later.');
                } else {
                    throw new Error(data.message || 'Login failed. Please try again.');
                }
            }

            if (data.status !== 'success' && !data.token) {
                setLoading(false); // Stop loading on error
                if (!data.token) {
                    throw new Error(data.message || 'Login failed. Please try again.');
                }
            }

            await signInWithEmailAndPassword(auth, email, password);
            // Don't set loading to false here; let onAuthStateChanged handle it
        } catch (error) {
            console.error('Login error:', error);
            setLoading(false); // Ensure loading is stopped on error
            throw error;
        }
    };

    const register = async (formData: FormData) => {
        try {
            setLoading(true); // Start loading immediately
            const response = await fetch(API_ENDPOINTS.register, {
                method: 'POST',
                body: formData,
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                // If response is not JSON, create a basic error
                setLoading(false);
                throw new Error(`Registration failed with status ${response.status}. Please try again.`);
            }

            if (!response.ok) {
                setLoading(false); // Stop loading on error
                // Extract error message from response - handle both message and error fields
                const errorMessage = data?.message || data?.error || `Registration failed with status ${response.status}. Please try again.`;
                
                const error = new Error(errorMessage);
                
                if (data?.errors && typeof data.errors === 'object') {
                    (error as any).fieldErrors = data.errors;
                }
                
                throw error;
            }

            if (data.message && data.message.toLowerCase().includes('success')) {
                // Now log the user in to Firebase with the credentials from formData
                const email = formData.get('email') as string;
                const password = formData.get('password') as string;

                if (email && password) {
                    await signInWithEmailAndPassword(auth, email, password);
                    // Don't set loading to false here; let onAuthStateChanged handle it
                } else {
                    if (data.user) {
                        // Handle case where we might not have password (e.g. if we change flow)
                        setLoading(false);
                    }
                }
                return;
            }

            setLoading(false);
            throw new Error(data.message || 'Registration failed. Please try again.');
        } catch (error) {
            console.error('Auth provider register error:', error);
            console.error('Auth provider register error type:', typeof error);
            console.error('Auth provider register error instanceof Error:', error instanceof Error);
            setLoading(false); // Ensure loading is stopped on error
            // Ensure we always throw an Error object
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error(String(error) || 'Registration failed. Please try again.');
            }
        }
    };

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const refreshUser = async () => {
        if (auth.currentUser) {
            // Force token refresh to update emailVerified claim in the token if needed
            await auth.currentUser.reload();
            setLoading(true);
            await fetchUserProfile(auth.currentUser);
            setLoading(false);
        }
    };

    const getToken = async () => {
        if (auth.currentUser) {
            return await auth.currentUser.getIdToken();
        }
        return null;
    };

    const sendVerificationEmail = async () => {
        if (auth.currentUser) {
            // Include continueUrl to redirect to dashboard after verification
            const actionCodeSettings = {
                url: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/action?continueUrl=/dashboard`,
                handleCodeInApp: false,
            };
            await sendEmailVerification(auth.currentUser, actionCodeSettings);
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const actionCodeSettings = {
                url: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
                handleCodeInApp: false,
            };
            await sendPasswordResetEmail(auth, email, actionCodeSettings);
        } catch (error: any) {
            console.error("Error sending password reset email:", error);
            throw new Error(error.message || "Failed to send password reset email.");
        }
    };

    // Show VerifyEmail component if logged in but email not verified
    const showVerificationScreen = !loading && user && !user.emailVerified;

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, getToken, sendVerificationEmail, resetPassword }}>
            {showVerificationScreen ? (
                <VerifyEmail
                    email={user.email}
                    onResend={sendVerificationEmail}
                    onLogout={logout}
                />
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from "@/Firebase";
import { useRouter } from "next/navigation";

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
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
    refreshUser: async () => { },
    getToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUserProfile = async (currentUser: FirebaseUser) => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.userProfile, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Handle both direct object return and { success: true, data: ... } format
                const userData = data.success ? data.data : data;
                setUser(userData);
            } else {
                console.error("Failed to fetch user profile");
                // If 404, maybe they are registered in Firebase but not MongoDB yet (registration flow)
                setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUser(null);
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
            const response = await fetch(API_ENDPOINTS.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
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
                if (!data.token) {
                    throw new Error(data.message || 'Login failed. Please try again.');
                }
            }

            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (formData: FormData) => {
        try {
            const response = await fetch(API_ENDPOINTS.register, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error(data.message || 'Invalid registration data. Please check all fields.');
                } else if (response.status === 409) {
                    throw new Error(data.message || 'Email already registered. Please login instead.');
                } else if (response.status === 500) {
                    throw new Error(data.message || 'Server error. Please try again later.');
                } else {
                    throw new Error(data.message || 'Registration failed. Please try again.');
                }
            }

            if (data.message && data.message.toLowerCase().includes('success')) {
                // Now log the user in to Firebase with the credentials from formData
                const email = formData.get('email') as string;
                const password = formData.get('password') as string;

                if (email && password) {
                    await signInWithEmailAndPassword(auth, email, password);
                } else {
                    if (data.user) {
                    }
                }
                return;
            }

            throw new Error(data.message || 'Registration failed. Please try again.');
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
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

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, getToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarsBackground } from "@/components/ui/stars-background";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '@/hooks/useAuth'; // Import your existing auth hook
import Link from "next/link";

// Add CSS for shake animation
const shakeAnimation = {
  x: [-10, 10, -10, 10, -5, 5, -2, 2, 0],
  transition: { duration: 0.5 }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  // Get the login function from your auth hook
  const { login } = useAuth();
  
  // Add validation states
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const validateForm = () => {
    let isValid = true;
    
    // Reset error states
    setEmailError(false);
    setPasswordError(false);
    
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      isValid = false;
    }
    
    if (!password) {
      setPasswordError(true);
      isValid = false;
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Use the login function from your auth hook
      await login(email, password);
      
      // Display success toast
      toast.success(`Successfully logged in as ${email}!`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        style: {
          background: "#1a1a2e",
          borderLeft: "4px solid #2ad8db",
          color: "#fff",
        },
      });
      
      // Give time for the user to see the toast before redirecting
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
        style: {
          background: "#1a1a2e",
          borderLeft: "4px solid #ff4757",
          color: "#fff",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="min-h-screen flex flex-col items-center justify-center relative p-4">
        <Link href="/" className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2 py-2 px-4 rounded-md hover:bg-gray-800/50 z-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </Link>
        
        <StarsBackground starDensity={0.0002} allStarsTwinkle={true} />
        {/* Add ToastContainer for notifications */}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastStyle={{
            background: "#1a1a2e",
            color: "#fff",
            borderLeft: "4px solid #2ad8db",
          }}
        />
        <div className="relative w-full max-w-md p-8 space-y-6 rounded-lg shadow-lg border">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#2ad8db33] to-[#113341ad] blur-3xl rounded-lg"></div>
          <motion.div
            initial={{ opacity: 0, scale: .95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: .3 }}
            className="relative"
          >
            <div className="relative space-y-2 text-center">
              <h1 className="text-3xl font-bold mb-1">Welcome Back</h1>
              <p className="text-muted-foreground">
                Login to your account
              </p>
              <br />
            </div>

            {error && (
              <div className="text-red-500 text-center">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className='relative'
                  animate={emailError ? shakeAnimation : undefined}
                >
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(false);
                    }}
                    className={`bg-transparent border ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                </motion.div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className='relative'
                  animate={passwordError ? shakeAnimation : undefined}
                >
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) {
                        setPasswordError(false);
                        setError("");
                      }
                    }}
                    className={`bg-transparent border ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                </motion.div>
              </div>
              <br />
              <Button 
                type="submit" 
                className="w-full my-1" 
                size="lg" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
              
            </form>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
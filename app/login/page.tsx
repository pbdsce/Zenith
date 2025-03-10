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

    // Simulate API call for login
    setTimeout(() => {
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
      setIsSubmitting(false);
      
      // Give time for the user to see the toast before redirecting
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="min-h-screen flex items-center justify-center">
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
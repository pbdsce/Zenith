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
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import NavButtons from "@/components/navbar";

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
  const [showPassword, setshowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resetEmailError, setResetEmailError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordResetStep, setPasswordResetStep] = useState(1); // 1: email, 2: OTP, 3: new password
  
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

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setError("");
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setOtp("");
    setOtpSent(false);
    setPasswordResetStep(1);
    setResetEmailError(false);
    setOtpError(false);
    setError("");
  };

  const validateResetEmail = () => {
    if (!resetEmail.trim() || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetEmailError(true);
      return false;
    }
    return true;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateResetEmail()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call to send OTP
      // In a real implementation, you would call your API to send an OTP to the email
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      setOtpSent(true);
      setPasswordResetStep(2);
      toast.success(`OTP sent to ${resetEmail}`, {
        position: "top-center",
        theme: "dark",
        style: {
          background: "#1a1a2e",
          borderLeft: "4px solid #2ad8db",
          color: "#fff",
        },
      });
    } catch (err) {
      toast.error("Failed to send OTP. Please try again.", {
        position: "top-center",
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setOtpError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call to verify OTP
      // In a real implementation, you would call your API to verify the OTP
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      // Move to new password step
      setPasswordResetStep(3);
      toast.success("OTP verified successfully", {
        position: "top-center",
        theme: "dark",
        style: {
          background: "#1a1a2e",
          borderLeft: "4px solid #2ad8db",
          color: "#fff",
        },
      });
    } catch (err) {
      toast.error("Invalid OTP. Please try again.", {
        position: "top-center",
        theme: "dark",
        style: {
          background: "#1a1a2e",
          borderLeft: "4px solid #ff4757",
          color: "#fff",
        },
      });
      setOtpError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      toast.error("Please enter a new password", {
        position: "top-center",
        theme: "dark",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords don't match", {
        position: "top-center",
        theme: "dark",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call to reset password
      // In a real implementation, you would call your API to reset the password
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      toast.success("Password has been reset successfully", {
        position: "top-center",
        theme: "dark",
        style: {
          background: "#1a1a2e",
          borderLeft: "4px solid #2ad8db",
          color: "#fff",
        },
      });
      
      // Redirect back to login
      setTimeout(() => {
        handleBackToLogin();
      }, 2000);
    } catch (err) {
      toast.error("Failed to reset password. Please try again.", {
        position: "top-center",
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
        <div className="fixed top-4 w-full justify-end z-50">
          <NavButtons disableFixedPositioning={true} />
        </div>
        
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
            {!showForgotPassword ? (
              // Login Form
              <>
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
                        type={showPassword ? "text" : "password"}
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
                      <motion.button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                        onClick={() => setshowPassword(!showPassword)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </motion.button>
                    </motion.div>
                  </div>
                  <div className="text-right">
                    <button 
                      type="button" 
                      className="text-sm text-cyan-500 hover:text-cyan-400 hover:underline"
                      onClick={handleForgotPassword}
                    >
                      Forgot your password?
                    </button>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full my-1" 
                    size="lg" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </>
            ) : (
              // Forgot Password Flow
              <div>
                <div className="relative space-y-2">
                  <button 
                    onClick={handleBackToLogin}
                    className="flex items-center gap-1 text-gray-400 hover:text-white mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </button>
                  <h1 className="text-2xl font-bold mb-1 text-center">Reset Password</h1>
                  <p className="text-muted-foreground text-center mb-6">
                    {passwordResetStep === 1 && "Enter your email to receive a reset code"}
                    {passwordResetStep === 2 && "Enter the verification code sent to your email"}
                    {passwordResetStep === 3 && "Create a new password"}
                  </p>
                </div>
                
                {passwordResetStep === 1 && (
                  <form className="space-y-6" onSubmit={handleSendOTP}>
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">Email</Label>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className='relative'
                        animate={resetEmailError ? shakeAnimation : undefined}
                      >
                        <Input 
                          id="resetEmail" 
                          type="email" 
                          placeholder="Enter your email address"
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            if (resetEmailError) setResetEmailError(false);
                          }}
                          className={`bg-transparent border ${resetEmailError ? 'border-red-500' : 'border-gray-300'}`}
                          required
                        />
                      </motion.div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending code...' : 'Send Reset Code'}
                    </Button>
                  </form>
                )}
                
                {passwordResetStep === 2 && (
                  <form className="space-y-6" onSubmit={handleVerifyOTP}>
                    <div className="space-y-2">
                      <Label htmlFor="otpCode">Verification Code</Label>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className='relative'
                        animate={otpError ? shakeAnimation : undefined}
                      >
                        <Input 
                          id="otpCode" 
                          type="text" 
                          placeholder="Enter verification code"
                          value={otp}
                          onChange={(e) => {
                            setOtp(e.target.value);
                            if (otpError) setOtpError(false);
                          }}
                          className={`bg-transparent border ${otpError ? 'border-red-500' : 'border-gray-300'}`}
                          required
                        />
                      </motion.div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify Code'}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        className="text-sm text-cyan-500 hover:text-cyan-400 hover:underline"
                        disabled={isSubmitting}
                      >
                        Didn't receive a code? Send again
                      </button>
                    </div>
                  </form>
                )}
                
                {passwordResetStep === 3 && (
                  <form className="space-y-6" onSubmit={handleResetPassword}>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className='relative'
                      >
                        <Input 
                          id="newPassword" 
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-transparent border border-gray-300"
                          required
                        />
                        <motion.button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </motion.button>
                      </motion.div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className='relative'
                      >
                        <Input 
                          id="confirmPassword" 
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="bg-transparent border border-gray-300"
                          required
                        />
                        <motion.button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </motion.button>
                      </motion.div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
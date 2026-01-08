"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { FormInput } from "@/components/registration/form-input";
import { Button } from "@/components/registration/button";
import { Card } from "@/components/registration/card";
import { StickyAlert } from "@/components/registration/sticky-alert";
import { DotPattern } from "@/components/registration/dot-pattern";
import { Spinner } from "@/components/ui/spinner";
import { UserPlus, LogIn } from "lucide-react";
import Link from "next/link";

export default function AdminRegisterPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminCode: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[^A-Za-z0-9]/.test(password)) return false;
    return true;
  };

  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case "name":
        if (!value.trim() || value.trim().length < 2 || value.trim().length > 100) {
          return "Name is required (2-100 characters)";
        }
        return "";
      case "email":
        if (!value.trim()) {
          return "Email is required";
        }
        if (!validateEmail(value)) {
          return "Invalid email format";
        }
        return "";
      case "password":
        if (!value) {
          return "Password is required";
        }
        if (!validatePassword(value)) {
          return "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character";
        }
        return "";
      case "confirmPassword":
        if (!value) {
          return "Please confirm your password";
        }
        if (value !== formData.password) {
          return "Passwords do not match";
        }
        return "";
      case "adminCode":
        if (!value.trim()) {
          return "Admin code is required";
        }
        return "";
      default:
        return "";
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    const value = formData[fieldName as keyof typeof formData];
    const error = validateField(fieldName, value);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const validateAllFields = (setStateErrors: boolean = false): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    Object.keys(formData).forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName as keyof typeof formData]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (setStateErrors) {
      setErrors(newErrors);
    }
    return newErrors;
  };

  const isFormValid = (): boolean => {
    const validationErrors = validateAllFields(false);
    return Object.keys(validationErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateAllFields(true);
    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          adminCode: formData.adminCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors);
          const errorMessages = Object.values(data.errors) as string[];
          if (errorMessages.length === 1) {
            toast({
              title: "Registration Failed",
              description: errorMessages[0],
              variant: "destructive",
            });
          } else {
            toast({
              title: "Registration Failed",
              description: `Multiple validation errors: ${errorMessages.map((msg) => ` • ${msg}`).join('')}`,
              variant: "destructive",
            });
          }
        } else {
          const errorMessage = data?.message || data?.error?.message || "Registration failed. Please try again.";
          toast({
            title: "Registration Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
        setIsSubmitting(false);
        return;
      }

      setAlert({
        type: "success",
        message: " Admin registration successful! Redirecting to login...",
      });

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        adminCode: "",
      });
      setErrors({});

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.message || "Registration failed. Please try again.";
      setAlert({
        type: "error",
        message: errorMessage,
      });
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#171717]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-start relative"
      style={{
        backgroundImage: "linear-gradient(90deg, rgb(23, 23, 23) 0%, rgb(23, 23, 23) 100%)",
      }}
    >
      <div className="bg-[#171717] w-full relative flex-1">
        <div
          className="flex flex-col items-center justify-center w-full min-h-screen pb-[80px] pt-[60px] px-[40px] relative"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1440 652\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(31.68 0 0 22.168 0 174.74)\\'><stop stop-color=\\'rgba(62,32,19,1)\\' offset=\\'0.10445\\'/><stop stop-color=\\'rgba(62,32,19,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
          }}
        >
          <div className="max-w-[500px] w-full z-10 flex flex-col gap-[32px] items-center">
            <Card className="p-[32px] w-full">
              {/* Header */}
              <div className="flex flex-col items-center gap-[16px] mb-[32px]">
                <div className="flex items-center justify-center w-[60px] h-[60px] rounded-full bg-[rgba(255,77,0,0.1)] border border-[rgba(255,77,0,0.3)]">
                  <UserPlus className="w-[30px] h-[30px] text-[#ff4d00]" />
                </div>
                <div className="text-center">
                  <h1 className="text-[28px] font-bold text-white mb-[8px]" style={{ fontFamily: 'var(--font-heading)' }}>
                    Admin Registration
                  </h1>
                  <p className="text-[14px] text-[rgba(255,255,255,0.7)]" style={{ fontFamily: 'var(--font-body)' }}>
                    Register as an administrator
                  </p>
                </div>
              </div>

              {/* Alert */}
              {alert && (
                <StickyAlert
                  type={alert.type}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                />
              )}

              {/* Form */}
              <form onSubmit={handleRegister} className="flex flex-col gap-[20px]">
                <FormInput
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                  error={errors.name}
                  disabled={isSubmitting}
                />

                <FormInput
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => handleFieldBlur("email")}
                  error={errors.email}
                  disabled={isSubmitting}
                />

                <div className="flex flex-col gap-[8px] w-full">
                  <label className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                    Password <span className="text-[#ff4d00]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      onBlur={() => handleFieldBlur("password")}
                      disabled={isSubmitting}
                      className={`backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.2)] border ${errors.password
                          ? "border-[#ff4d00]"
                          : "border-[rgba(255,255,255,0.38)]"
                        } border-solid rounded-[15px] px-[18px] py-[12px] pr-[50px] text-white text-[14px] placeholder:text-[rgba(255,255,255,0.5)] focus:outline-none focus:border-[#ff4d00] focus:shadow-[0px_0px_10px_0px_rgba(255,77,0,0.3)] transition-all disabled:cursor-not-allowed w-full`}
                      style={{ fontFamily: 'var(--font-body)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.5)] hover:text-white transition-colors text-[12px]"
                      disabled={isSubmitting}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-[12px] text-[#ff4d00]" style={{ fontFamily: 'var(--font-body)' }}>
                      {errors.password}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-[8px] w-full">
                  <label className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                    Confirm Password <span className="text-[#ff4d00]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      onBlur={() => handleFieldBlur("confirmPassword")}
                      disabled={isSubmitting}
                      className={`backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.2)] border ${errors.confirmPassword
                          ? "border-[#ff4d00]"
                          : "border-[rgba(255,255,255,0.38)]"
                        } border-solid rounded-[15px] px-[18px] py-[12px] pr-[50px] text-white text-[14px] placeholder:text-[rgba(255,255,255,0.5)] focus:outline-none focus:border-[#ff4d00] focus:shadow-[0px_0px_10px_0px_rgba(255,77,0,0.3)] transition-all disabled:cursor-not-allowed w-full`}
                      style={{ fontFamily: 'var(--font-body)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.5)] hover:text-white transition-colors text-[12px]"
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-[12px] text-[#ff4d00]" style={{ fontFamily: 'var(--font-body)' }}>
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-[8px] w-full">
                  <label className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                    Admin Code <span className="text-[#ff4d00]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminCode ? "text" : "password"}
                      placeholder="Enter admin code"
                      required
                      value={formData.adminCode}
                      onChange={(e) => handleInputChange("adminCode", e.target.value)}
                      onBlur={() => handleFieldBlur("adminCode")}
                      disabled={isSubmitting}
                      className={`backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.2)] border ${errors.adminCode
                          ? "border-[#ff4d00]"
                          : "border-[rgba(255,255,255,0.38)]"
                        } border-solid rounded-[15px] px-[18px] py-[12px] pr-[50px] text-white text-[14px] placeholder:text-[rgba(255,255,255,0.5)] focus:outline-none focus:border-[#ff4d00] focus:shadow-[0px_0px_10px_0px_rgba(255,77,0,0.3)] transition-all disabled:cursor-not-allowed w-full`}
                      style={{ fontFamily: 'var(--font-body)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminCode(!showAdminCode)}
                      className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.5)] hover:text-white transition-colors text-[12px]"
                      disabled={isSubmitting}
                    >
                      {showAdminCode ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.adminCode && (
                    <span className="text-[12px] text-[#ff4d00]" style={{ fontFamily: 'var(--font-body)' }}>
                      {errors.adminCode}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    Object.values(errors).some(error => error && error.trim() !== '') ||
                    !formData.name?.trim() ||
                    !formData.email?.trim() ||
                    !formData.password ||
                    !formData.confirmPassword ||
                    formData.password !== formData.confirmPassword ||
                    !formData.adminCode?.trim()
                  }
                  className="w-full mt-[8px]"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-[16px] h-[16px]" />
                      <span>Create Admin Account</span>
                    </>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-[24px] pt-[24px] border-t border-[rgba(255,255,255,0.15)] text-center">
                <p className="text-[14px] text-[rgba(255,255,255,0.7)] mb-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
                  Already have an account?
                </p>
                <Link href="/login" className="inline-flex items-center gap-[8px] text-[#ff4d00] hover:text-[#ff6d20] transition-colors text-[14px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                  <LogIn className="w-[16px] h-[16px]" />
                  <span>Login</span>
                </Link>
              </div>
            </Card>
          </div>
        </div>
        <DotPattern />
      </div>
    </div>
  );
}


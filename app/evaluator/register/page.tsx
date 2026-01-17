"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { FormSection } from "@/components/registration/form-section";
import { FormInput } from "@/components/registration/form-input";
import { Button } from "@/components/registration/button";
import { StickyAlert } from "@/components/registration/sticky-alert";
import { DotPattern } from "@/components/registration/dot-pattern";
import { Spinner } from "@/components/ui/spinner";
import { ShieldPlus } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api-config";

export default function EvaluatorRegisterPage() {
    const { register, isAuthenticated, isLoading, user, getToken } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            if (user?.role === 'evaluator') {
                router.push("/dashboard/evaluator");
            } else {
                router.push("/dashboard");
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsSubmitting(false);
            return;
        }

        try {
            const registrationData = new FormData();
            registrationData.append('name', formData.name);
            registrationData.append('email', formData.email);
            registrationData.append('password', formData.password);

            await register(registrationData);

            const token = await getToken();

            if (token) {
                const response = await fetch(API_ENDPOINTS.evaluatorRegister || '/api/evaluator/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name: formData.name })
                });

                if (!response.ok) {
                    console.error("Evaluator profile creation failed");
                }
            }

            router.push("/dashboard/evaluator");

        } catch (err: any) {
            setError(err?.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || (isAuthenticated && user?.role === 'evaluator')) {
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
                    className="flex flex-col items-center justify-center w-full min-h-screen pb-[40px] sm:pb-[80px] pt-[40px] sm:pt-[60px] px-[16px] relative"
                    style={{
                        backgroundImage:
                            "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1440 652\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(31.68 0 0 22.168 0 174.74)\\'><stop stop-color=\\'rgba(62,32,19,1)\\' offset=\\'0.10445\\'/><stop stop-color=\\'rgba(62,32,19,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
                    }}
                >
                    <div className="max-w-[500px] w-full z-10 flex flex-col gap-[24px] items-center">
                        {error && <StickyAlert type="error" message={error} onClose={() => setError("")} />}

                        <div className="flex flex-col gap-[12px] items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-[#ff4d00]/10 flex items-center justify-center mb-2 border border-[#ff4d00]/20">
                                <ShieldPlus className="w-8 h-8 text-[#ff4d00]" />
                            </div>
                            <h1 className="font-['Instrument_Serif',sans-serif] text-[32px] sm:text-[40px] text-white leading-[1.1] tracking-[-1px]">
                                Evaluator Registration
                            </h1>
                            <p className="font-['Inter',sans-serif] text-[14px] text-white opacity-70">
                                Join the panel of experts.
                            </p>
                        </div>

                        <FormSection title="Create Account">
                            <form onSubmit={handleRegister} className="flex flex-col gap-[20px] w-full">
                                <FormInput
                                    label="Full Name"
                                    placeholder="John Doe"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <FormInput
                                    label="Email Address"
                                    type="email"
                                    placeholder="evaluator@zenith.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                                <FormInput
                                    label="Password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <FormInput
                                    label="Confirm Password"
                                    type="password"
                                    placeholder="Confirm your password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />

                                <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <Spinner size="sm" /> : "Register as Evaluator"}
                                </Button>

                                <div className="flex flex-col items-center gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/evaluator/login")}
                                        className="text-[13px] text-white/50 hover:text-[#ff4d00] transition-colors"
                                    >
                                        Already have an account? Login
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push("/register")}
                                        className="text-[13px] text-white/30 hover:text-white transition-colors"
                                    >
                                        ← Back to Main Registration
                                    </button>
                                </div>
                            </form>
                        </FormSection>
                    </div>
                </div>

                <DotPattern />
            </div>
        </div>
    );
}

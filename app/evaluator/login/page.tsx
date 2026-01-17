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
import { ShieldCheck } from "lucide-react";

export default function EvaluatorLoginPage() {
    const { login, isAuthenticated, isLoading, user } = useAuth();
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            if (user.role === 'evaluator') {
                router.push("/dashboard/evaluator");
            } else {
                // If logged in but not evaluator, maybe warn or redirect to user dashboard?
                // For now, let's redirect to dashboard which might handle role routing, 
                // but specific evaluator login should preferably go to evaluator dashboard.
                router.push("/dashboard");
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            await login(loginData.email, loginData.password);
            // Redirect handled by useEffect
        } catch (err: any) {
            setError(err?.message || "Login failed. Please check your credentials.");
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
                                <ShieldCheck className="w-8 h-8 text-[#ff4d00]" />
                            </div>
                            <h1 className="font-['Instrument_Serif',sans-serif] text-[32px] sm:text-[40px] text-white leading-[1.1] tracking-[-1px]">
                                Evaluator Portal
                            </h1>
                            <p className="font-['Inter',sans-serif] text-[14px] text-white opacity-70">
                                Authorized personnel only. Login to access evaluation tools.
                            </p>
                        </div>

                        <FormSection title="Evaluator Login">
                            <form onSubmit={handleLogin} className="flex flex-col gap-[20px] w-full">
                                <FormInput
                                    label="Email Address"
                                    type="email"
                                    placeholder="evaluator@zenith.com"
                                    required
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                />
                                <FormInput
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                />
                                <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <Spinner size="sm" /> : "Access Portal"}
                                </Button>

                                <div className="flex flex-col items-center gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/evaluator/register")}
                                        className="text-[13px] text-white/50 hover:text-[#ff4d00] transition-colors"
                                    >
                                        Register as new Evaluator
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push("/login")}
                                        className="text-[13px] text-white/30 hover:text-white transition-colors"
                                    >
                                        ← Back to Main Login
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

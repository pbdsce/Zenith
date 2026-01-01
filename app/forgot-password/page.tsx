"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { FormSection } from "@/components/registration/form-section";
import { FormInput } from "@/components/registration/form-input";
import { Button } from "@/components/registration/button";
import { StickyAlert } from "@/components/registration/sticky-alert";
import { DotPattern } from "@/components/registration/dot-pattern";

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        setSuccess("");

        try {
            await resetPassword(email);
            setSuccess("Password reset link sent to your email.");
            setTimeout(() => {
                router.push("/login");
            }, 5000);
        } catch (err: any) {
            setError(err?.message || "Failed to send reset email. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex flex-col items-start relative"
            style={{
                backgroundImage: "linear-gradient(90deg, rgb(23, 23, 23) 0%, rgb(23, 23, 23) 100%)",
            }}
        >
            <div className="bg-[#171717] w-full relative flex-1">
                <div
                    className="flex flex-col items-center justify-center w-full min-h-screen pb-[40px] sm:pb-[80px] pt-[40px] sm:pt-[60px] px-[16px] sm:px-[24px] md:px-[40px] relative"
                    style={{
                        backgroundImage:
                            "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1440 652\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(31.68 0 0 22.168 0 174.74)\\'><stop stop-color=\\'rgba(62,32,19,1)\\' offset=\\'0.10445\\'/><stop stop-color=\\'rgba(62,32,19,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
                    }}
                >
                    <div className="max-w-[600px] w-full z-10 flex flex-col gap-[24px] sm:gap-[32px] items-center">
                        {error && <StickyAlert type="error" message={error} onClose={() => setError("")} />}
                        {success && <StickyAlert type="success" message={success} onClose={() => setSuccess("")} />}

                        <div className="flex flex-col gap-[12px] items-center text-center">
                            <h1 className="font-['Instrument_Serif',sans-serif] text-[32px] sm:text-[40px] md:text-[48px] text-white leading-[36px] sm:leading-[44px] md:leading-[52px] tracking-[-1px] px-4">
                                Forgot Password
                            </h1>
                            <p className="font-['Inter',sans-serif] text-[14px] sm:text-[15.9px] text-white opacity-90 leading-[20px] sm:leading-[23.8px] px-4">
                                Enter your email to receive a password reset link.
                            </p>
                        </div>

                        <FormSection title="Reset Password">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-[20px] w-full">
                                <FormInput
                                    label="Email Address"
                                    type="email"
                                    placeholder="your.email@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
                                    Send Reset Link
                                </Button>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-[8px] text-center">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/login")}
                                        className="font-['Inter',sans-serif] text-[13px] sm:text-[14px] text-[#ff4d00] hover:underline"
                                    >
                                        Back to Login
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

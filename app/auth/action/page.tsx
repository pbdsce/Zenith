"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode, onAuthStateChanged, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/Firebase";
import { FormSection } from "@/components/registration/form-section";
import { Button } from "@/components/registration/button";
import { FormInput } from "@/components/registration/form-input";
import { DotPattern } from "@/components/registration/dot-pattern";
import { CheckCircle2, XCircle, ArrowRight, Mail, KeyRound } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { StickyAlert } from "@/components/registration/sticky-alert";

export default function AuthActionPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error" | "reset_password">("loading");
    const [message, setMessage] = useState("Verifying your request...");
    const [mode, setMode] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Password reset state
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [resetError, setResetError] = useState("");

    const handleContinue = useCallback(() => {
        setIsRedirecting(true);
        onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push("/dashboard");
            } else {
                router.push("/login");
            }
        }, undefined, () => {
            // If no user, redirect to login
            router.push("/login");
        });
    }, [router]);

    useEffect(() => {
        const actionCode = searchParams.get("oobCode");
        const modeParam = searchParams.get("mode");
        const continueUrl = searchParams.get("continueUrl") || "/dashboard";

        setMode(modeParam);

        if (!actionCode) {
            setStatus("error");
            setMessage("Invalid or missing verification code.");
            return;
        }

        const handleVerification = async () => {
            try {
                if (modeParam === "verifyEmail") {
                    await applyActionCode(auth, actionCode);
                    setStatus("success");
                    setMessage("Your email has been successfully verified! You can now access all features.");

                    if (auth.currentUser) {
                        await auth.currentUser.reload();
                    }
                } else if (modeParam === "resetPassword") {
                    const email = await verifyPasswordResetCode(auth, actionCode);
                    setResetEmail(email);
                    setStatus("reset_password");
                    setMessage("Please enter your new password.");
                } else {
                    setStatus("error");
                    setMessage("Invalid operation mode.");
                }
            } catch (error: any) {
                console.error("Verification error:", error);

                if (modeParam === "verifyEmail") {
                    let isActuallyVerified = false;
                    if (auth.currentUser) {
                        try {
                            await auth.currentUser.reload();
                            if (auth.currentUser.emailVerified) {
                                isActuallyVerified = true;
                            }
                        } catch (e) {
                            console.error("Error checking user status:", e);
                        }
                    }

                    if (isActuallyVerified) {
                        setStatus("success");
                        setMessage("Your email has already been verified. You can now access all features.");
                        return;
                    }
                }

                setStatus("error");
                switch (error.code) {
                    case "auth/expired-action-code":
                        setMessage("The verification link has expired. Please request a new one.");
                        break;
                    case "auth/invalid-action-code":
                        setMessage("The verification link is invalid. It may have been used already.");
                        break;
                    case "auth/user-disabled":
                        setMessage("The user account has been disabled.");
                        break;
                    case "auth/user-not-found":
                        setMessage("User not found.");
                        break;
                    default:
                        setMessage(error.message || "An error occurred during verification.");
                }
            }
        };

        handleVerification();
    }, [searchParams]);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        const actionCode = searchParams.get("oobCode");

        if (!actionCode) return;
        if (newPassword !== confirmPassword) {
            setResetError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setResetError("Password must be at least 6 characters.");
            return;
        }

        setIsResetting(true);
        setResetError("");

        try {
            await confirmPasswordReset(auth, actionCode, newPassword);
            setStatus("success");
            setMessage("Your password has been reset successfully. You can now login with your new password.");
        } catch (error: any) {
            setResetError(error.message || "Failed to reset password. Please try again.");
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex flex-col items-start relative font-['Inter',sans-serif]"
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
                    <div className="max-w-[600px] w-full z-10 flex flex-col gap-[32px] items-center">
                        {status === "loading" && (
                            <FormSection title="Verifying">
                                <div className="flex flex-col gap-[20px] items-center text-center py-8">
                                    <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff4d00]/10">
                                        <Spinner size="lg" />
                                    </div>
                                    <p className="font-['Inter',sans-serif] text-[15.9px] text-white opacity-90 leading-[23.8px]">
                                        Processing your request...
                                    </p>
                                </div>
                            </FormSection>
                        )}

                        {status === "reset_password" && (
                            <FormSection title="Reset Password">
                                <div className="w-full flex flex-col gap-[24px]">
                                    <div className="flex flex-col gap-[12px] items-center text-center">
                                        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff4d00]/10">
                                            <KeyRound className="h-8 w-8 text-[#ff4d00]" />
                                        </div>
                                        <h1 className="font-['Instrument_Serif',sans-serif] text-[32px] text-white leading-[36px] tracking-[-1px]">
                                            Set New Password
                                        </h1>
                                        <p className="font-['Inter',sans-serif] text-[14px] text-white opacity-70">
                                            for {resetEmail}
                                        </p>
                                    </div>

                                    {resetError && <StickyAlert type="error" message={resetError} onClose={() => setResetError("")} />}

                                    <form onSubmit={handlePasswordReset} className="flex flex-col gap-[20px]">
                                        <FormInput
                                            label="New Password"
                                            type="password"
                                            placeholder="Enter new password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <FormInput
                                            label="Confirm Password"
                                            type="password"
                                            placeholder="Confirm new password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={isResetting}
                                            className="w-full"
                                        >
                                            {isResetting ? "Resetting..." : "Reset Password"}
                                        </Button>
                                    </form>
                                </div>
                            </FormSection>
                        )}

                        {status === "success" && (
                            <FormSection title={mode === "resetPassword" ? "Password Reset" : "Email Verified"}>
                                <div className="flex flex-col gap-[20px] items-center text-center">
                                    <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(255,77,0,0.2)] ring-2 ring-[#ff4d00]/30">
                                        <CheckCircle2 className="h-12 w-12 text-white" />
                                    </div>
                                    <div className="flex flex-col gap-[12px]">
                                        <h1 className="font-['Instrument_Serif',sans-serif] text-[36px] text-white leading-[40px] tracking-[-1px]">
                                            Success!
                                        </h1>
                                        <p className="font-['Inter',sans-serif] text-[15.9px] text-white opacity-90 leading-[23.8px]">
                                            {message}
                                        </p>
                                    </div>

                                    {isRedirecting ? (
                                        <div className="flex flex-col gap-3 items-center mt-4">
                                            <Spinner size="md" />
                                            <p className="font-['Inter',sans-serif] text-[14px] text-white opacity-70">
                                                Redirecting to dashboard...
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="w-full mt-2">
                                            <Button
                                                variant="primary"
                                                onClick={mode === "resetPassword" ? () => router.push("/login") : handleContinue}
                                                className="w-full"
                                            >
                                                {mode === "resetPassword" ? "Return to Login" : "Continue to Dashboard"}
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </FormSection>
                        )}

                        {status === "error" && (
                            <FormSection title="Action Failed">
                                <div className="flex flex-col gap-[20px] items-center text-center">
                                    <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-black/50 ring-2 ring-[#ff4d00]/30">
                                        <XCircle className="h-12 w-12 text-[#ff4d00]" />
                                    </div>
                                    <div className="flex flex-col gap-[12px]">
                                        <h1 className="font-['Instrument_Serif',sans-serif] text-[36px] text-white leading-[40px] tracking-[-1px]">
                                            Verification Failed
                                        </h1>
                                        <p className="font-['Inter',sans-serif] text-[15.9px] text-white opacity-90 leading-[23.8px]">
                                            {message}
                                        </p>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded-lg mt-4">
                                        <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-60">
                                            If you continue to experience issues, please contact support or request a new link.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full mt-2">
                                        <Button
                                            variant="primary"
                                            onClick={() => router.push("/login")}
                                            className="w-full"
                                        >
                                            Return to Login
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </FormSection>
                        )}
                    </div>
                </div>

                <DotPattern />
            </div>
        </div>
    );
}

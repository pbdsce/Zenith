"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/Firebase";
import { FormSection } from "@/components/registration/form-section";
import { Button } from "@/components/registration/button";
import { StickyAlert } from "@/components/registration/sticky-alert";
import { DotPattern } from "@/components/registration/dot-pattern";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

export default function AuthActionPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your request...");
    const [mode, setMode] = useState<string | null>(null);

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
                    // TODO: specific handling for password reset if needed, 
                    setStatus("error");
                    setMessage("Password reset is not configured on this page yet.");
                } else {
                    setStatus("error");
                    setMessage("Invalid operation mode.");
                }
            } catch (error: any) {
                console.error("Verification error:", error);

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
                    setMessage("Your email has already been verified. You can proceed to the dashboard.");
                    return;
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

    const handleContinue = () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push("/dashboard");
            } else {
                router.push("/login");
            }
        });
    };

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center justify-center relative font-sans text-white p-4"
            style={{
                backgroundImage: "linear-gradient(90deg, rgb(23, 23, 23) 0%, rgb(23, 23, 23) 100%)",
            }}
        >
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 z-0 opacity-40"
                    style={{
                        backgroundImage:
                            "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1440 652\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(31.68 0 0 22.168 0 174.74)\\'><stop stop-color=\\'rgba(62,32,19,1)\\' offset=\\'0.10445\\'/><stop stop-color=\\'rgba(62,32,19,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
                <DotPattern />
            </div>

            <div className="max-w-[480px] w-full z-10 relative">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[24px] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center gap-8">

                    {status === "loading" && (
                        <div className="flex flex-col items-center gap-6 py-8">
                            <Loader2 className="h-16 w-16 text-[#ff4d00] animate-spin" />
                            <h1 className="font-['Instrument_Serif',serif] text-4xl">Verifying...</h1>
                        </div>
                    )}

                    {status === "success" && (
                        <>
                            <div className="rounded-full bg-green-500/10 p-5 ring-1 ring-green-500/30 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>
                            <div className="space-y-3">
                                <h1 className="font-['Instrument_Serif',serif] text-4xl">Email Verified</h1>
                                <p className="text-white/70 text-base leading-relaxed">
                                    {message}
                                </p>
                            </div>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="rounded-full bg-red-500/10 p-5 ring-1 ring-red-500/30 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
                                <XCircle className="h-16 w-16 text-red-500" />
                            </div>
                            <div className="space-y-3">
                                <h1 className="font-['Instrument_Serif',serif] text-4xl">Verification Failed</h1>
                                <p className="text-white/70 text-base leading-relaxed">
                                    {message}
                                </p>
                            </div>
                        </>
                    )}

                    {status !== "loading" && (
                        <Button
                            variant="primary"
                            onClick={handleContinue}
                            className="w-full h-12 text-base mt-2"
                        >
                            {status === "success" ? "Continue to Dashboard" : "Return to Login"}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

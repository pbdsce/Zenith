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
                    <div className="max-w-[600px] w-full z-10 flex flex-col gap-[32px] items-center">

                        <div className="flex flex-col gap-[12px] items-center text-center">
                            <h1 className="font-['Instrument_Serif',sans-serif] text-[48px] text-white leading-[52px] tracking-[-1px]">
                                {status === "loading" && "Verifying..."}
                                {status === "success" && "Email Verified"}
                                {status === "error" && "Verification Failed"}
                            </h1>
                            <p className="font-['Inter',sans-serif] text-[15.9px] text-white opacity-90 leading-[23.8px]">
                                {status === "loading" && "Please wait while we verify your email address."}
                                {status === "success" && "Thank you for verifying your email."}
                                {status === "error" && "We couldn't verify your email address."}
                            </p>
                        </div>

                        <FormSection title={status === "success" ? "Success" : status === "error" ? "Error" : "Processing"}>
                            <div className="flex flex-col gap-[20px] items-center text-center py-4">

                                {status === "loading" && (
                                    <Loader2 className="h-16 w-16 text-[#ff4d00] animate-spin" />
                                )}

                                {status === "success" && (
                                    <div className="rounded-full bg-green-500/10 p-4">
                                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                                    </div>
                                )}

                                {status === "error" && (
                                    <div className="rounded-full bg-red-500/10 p-4">
                                        <XCircle className="h-16 w-16 text-red-500" />
                                    </div>
                                )}

                                <p className="font-['Inter',sans-serif] text-[14px] text-white opacity-80 max-w-[400px]">
                                    {message}
                                </p>

                                {status !== "loading" && (
                                    <Button
                                        variant="primary"
                                        onClick={handleContinue}
                                        className="w-full mt-4"
                                    >
                                        {status === "success" ? "Continue to Dashboard" : "Return to Login"}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </FormSection>
                    </div>
                </div>

                <DotPattern />
            </div>
        </div>
    );
}

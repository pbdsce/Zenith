import { useState } from "react";
import { FormSection } from "@/components/registration/form-section";
import { Button } from "@/components/registration/button";
import { DotPattern } from "@/components/registration/dot-pattern";
import { LogOut, RefreshCw, Mail } from "lucide-react";
import { StickyAlert } from "@/components/registration/sticky-alert";

interface VerifyEmailProps {
    email: string;
    onResend: () => Promise<void>;
    onLogout: () => Promise<void>;
}

export function VerifyEmail({ email, onResend, onLogout }: VerifyEmailProps) {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleResend = async () => {
        setLoading(true);
        setError("");
        try {
            await onResend();
            setSent(true);
            // Reset sent state after 30 seconds to allow resending again
            setTimeout(() => setSent(false), 30000);
        } catch (error) {
            console.error("Failed to resend verification email", error);
            setError("Failed to resend verification email. Please try again.");
        } finally {
            setLoading(false);
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
                        {error && <StickyAlert type="error" message={error} onClose={() => setError("")} />}

                        <div className="flex flex-col gap-[12px] items-center text-center">
                            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff4d00]/10">
                                <Mail className="h-8 w-8 text-[#ff4d00]" />
                            </div>
                            <h1 className="font-['Instrument_Serif',sans-serif] text-[48px] text-white leading-[52px] tracking-[-1px]">
                                Verify your email
                            </h1>
                            <p className="font-['Inter',sans-serif] text-[15.9px] text-white opacity-90 leading-[23.8px]">
                                We've sent a verification link to <span className="font-medium text-white">{email}</span>
                            </p>
                        </div>

                        <FormSection title="Verification Required">
                            <div className="flex flex-col gap-[20px] text-center">
                                <p className="font-['Inter',sans-serif] text-[14px] text-white opacity-70">
                                    Please check your inbox and click the link to verify your account.
                                    You must verify your email to access the dashboard.
                                </p>

                                <div className="bg-white/5 p-3 rounded-lg text-xs text-white opacity-60">
                                    <p>Don't see it? Check your spam folder.</p>
                                </div>

                                {sent && (
                                    <div className="p-3 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                        Verification email sent! Please check your inbox.
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 mt-2">
                                    <Button
                                        variant="primary"
                                        onClick={handleResend}
                                        disabled={loading || sent}
                                        type="button"
                                    >
                                        {loading ? "Sending..." : sent ? "Email Sent" : "Resend Verification Email"}
                                    </Button>

                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] border border-white/10 bg-transparent text-white hover:bg-white/5 transition-all text-[14px] font-medium"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            I've Verified
                                        </button>
                                        <button
                                            onClick={onLogout}
                                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] border border-transparent bg-transparent text-white/60 hover:text-white hover:bg-white/5 transition-all text-[14px] font-medium"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </FormSection>
                    </div>
                </div>

                <DotPattern />
            </div>
        </div>
    );
}

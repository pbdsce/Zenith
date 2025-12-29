import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Mail, RefreshCw } from "lucide-react";
import { useState } from "react";

interface VerifyEmailProps {
    email: string;
    onResend: () => Promise<void>;
    onLogout: () => Promise<void>;
}

export function VerifyEmail({ email, onResend, onLogout }: VerifyEmailProps) {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleResend = async () => {
        setLoading(true);
        try {
            await onResend();
            setSent(true);
            // Reset sent state after 30 seconds to allow resending again
            setTimeout(() => setSent(false), 30000);
        } catch (error) {
            console.error("Failed to resend verification email", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md border-border/50 shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
                    <CardDescription className="text-base">
                        We've sent a verification link to <br />
                        <span className="font-medium text-foreground select-all">{email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Please check your inbox and click the link to verify your account.
                        You won't be able to access the platform until your email is verified.
                    </p>
                    <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                        <p>Don't see it? Check your spam folder.</p>
                    </div>
                    {sent && (
                        <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            Verification email sent! Please check your inbox.
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button
                        className="w-full"
                        onClick={handleResend}
                        disabled={loading || sent}
                    >
                        {loading ? "Sending..." : sent ? "Email Sent" : "Resend Verification Email"}
                    </Button>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="w-full"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            I've Verified
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onLogout}
                            className="w-full text-muted-foreground hover:text-destructive"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

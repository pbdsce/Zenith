'use client';

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { NavBar } from "@/components/registration/navbar";
import { DotPattern } from "@/components/registration/dot-pattern";
import { FormSection } from "@/components/registration/form-section";
import { StickyAlert } from "@/components/registration/sticky-alert";

interface ProblemStatement {
    id: string;
    title: string;
    description: string;
    teamCount: number;
    isActive: boolean;
}

export default function ProblemStatementsPage() {
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [alert, setAlert] = useState<{
        type: "success" | "error" | "warning" | "info";
        message: string;
    } | null>(null);

    const handleLogout = () => {
        logout();
        router.push("/login");
        setAlert({
            type: "info",
            message: "Logged out successfully",
        });
        setTimeout(() => setAlert(null), 3000);
    };

    useEffect(() => {
        const fetchProblemStatements = async () => {
            try {
                const response = await fetch('/api/problem-statements');
                const data = await response.json();

                if (data.success) {
                    setProblemStatements(data.data.problemStatements);
                } else {
                    setError(data.message || 'Failed to fetch problem statements');
                }
            } catch (err) {
                setError('An error occurred while fetching problem statements');
            } finally {
                setLoading(false);
            }
        };

        fetchProblemStatements();
    }, []);

    if (loading || (authLoading && !loading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#171717] text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff4d00]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#171717]">
                <div className="text-center p-8 glass-effect rounded-lg max-w-md mx-4">
                    <h2 className="text-2xl font-bold text-red-500 mb-4 font-heading">Error</h2>
                    <p className="text-white/80">{error}</p>
                </div>
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
            <NavBar
                user={user && user.name ? { uid: user.uid, name: user.name, email: user.email, role: user.role } : undefined}
                onLogout={handleLogout}
                onNavigate={(view) => {
                    if (view === 'login') {
                        router.push('/login');
                    } else if (view === 'register') {
                        router.push('/register');
                    } else if (view === 'landing') {
                        router.push('/');
                    } else {
                        router.push(`/dashboard/${view}`);
                    }
                }}
            />

            <div className="bg-[#171717] w-full relative flex-1">
                <div
                    className="flex flex-col w-full min-h-screen pb-[80px] pt-[60px] px-[40px] relative"
                    style={{
                        backgroundImage:
                            "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1440 652\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(31.68 0 0 22.168 0 174.74)\\'><stop stop-color=\\'rgba(62,32,19,1)\\' offset=\\'0.10445\\'/><stop stop-color=\\'rgba(62,32,19,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover'
                    }}
                >
                    <div className="max-w-7xl mx-auto w-full z-10">
                        {alert && (
                            <StickyAlert
                                type={alert.type}
                                message={alert.message}
                                onClose={() => setAlert(null)}
                            />
                        )}

                        <h1 className="text-4xl md:text-6xl font-heading mb-12 text-center text-white drop-shadow-[0_0_15px_rgba(255,77,0,0.5)]">
                            Problem Statements
                        </h1>

                        {problemStatements.length === 0 ? (
                            <FormSection title="No Active Problems">
                                <p className="text-xl text-white/60 font-body text-center">No active problem statements found.</p>
                            </FormSection>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {problemStatements.map((ps) => (
                                    <FormSection
                                        key={ps.id}
                                        title={ps.title}
                                    >
                                        <div className="flex flex-col gap-4">
                                            <p className="text-white/80 leading-relaxed font-body">
                                                {ps.description}
                                            </p>
                                        </div>
                                    </FormSection>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <DotPattern />
            </div>
        </div>
    );
}

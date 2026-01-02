'use client';

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { NavBar } from "@/components/registration/navbar";
import { DotPattern } from "@/components/registration/dot-pattern";
import { FormSection } from "@/components/registration/form-section";
import { StickyAlert } from "@/components/registration/sticky-alert";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/registration/button";
import { Modal } from "@/components/registration/modal";
import { Home, ExternalLink } from "lucide-react";

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
    const [selectedProblemStatement, setSelectedProblemStatement] = useState<ProblemStatement | null>(null);

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
                <Spinner size="lg" />
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

                        <div className="flex items-center justify-between mb-12">
                            <h1 className="text-4xl md:text-6xl font-heading text-white drop-shadow-[0_0_15px_rgba(255,77,0,0.5)]">
                                Problem Statements
                            </h1>
                            <Button onClick={() => router.push("/dashboard")} variant="secondary">
                                <Home className="w-4 h-4" />
                                Back to Dashboard
                            </Button>
                        </div>

                        <div className="mb-8">
                            <FormSection title="Common Guidelines">
                                <div className="space-y-4 text-white/80 font-body">
                                    <p>
                                        Before selecting a track, please adhere to the following architectural requirement applicable to all problem statements:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>
                                            <strong className="text-white">All solutions submitted must be built from scratch.</strong> We are not looking for wrappers around existing third-party platforms.
                                        </li>
                                        <li>
                                            Your solution must be architected as a <strong className="text-white">Plugin</strong>. It should be designed to be directly integratable into the Frai (Final Round AI) ecosystem, extending its core capabilities rather than functioning solely as a standalone silo.
                                        </li>
                                    </ul>
                                </div>
                            </FormSection>
                        </div>

                        {problemStatements.length === 0 ? (
                            <FormSection title="No Active Problems">
                                <p className="text-xl text-white/60 font-body text-center">No active problem statements found.</p>
                            </FormSection>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] max-w-6xl mx-auto">
                                    {problemStatements.map((ps) => {
                                        const description = ps.description || '';
                                        const shouldTruncate = description.length > 200;
                                        const displayText = shouldTruncate 
                                            ? description.substring(0, 200) + '...'
                                            : description;

                                        return (
                                            <div
                                                key={ps.id}
                                                className="relative p-[20px] rounded-[12px] border-2 border-[rgba(255,255,255,0.2)] bg-[rgba(138,138,138,0.1)] hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(138,138,138,0.15)] transition-all duration-300 cursor-pointer"
                                                onClick={() => setSelectedProblemStatement(ps)}
                                            >
                                                <h3 className="text-[18px] font-semibold text-white mb-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
                                                    {ps.title}
                                                </h3>
                                                <p className="text-[14px] text-white opacity-80 leading-relaxed mb-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
                                                    {displayText}
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedProblemStatement(ps);
                                                    }}
                                                    className="w-full mt-[8px] flex items-center justify-center gap-[6px] px-[12px] py-[6px] bg-[rgba(255,77,0,0.2)] hover:bg-[rgba(255,77,0,0.3)] border border-[rgba(255,77,0,0.4)] rounded-[8px] text-[13px] text-white transition-colors"
                                                    style={{ fontFamily: 'var(--font-body)' }}
                                                >
                                                    <span>Read More</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Problem Statement Modal */}
                                <Modal
                                    isOpen={!!selectedProblemStatement}
                                    onClose={() => setSelectedProblemStatement(null)}
                                    title={selectedProblemStatement?.title || ''}
                                >
                                    <div className="flex flex-col gap-[20px]">
                                        <div>
                                            <h3 className="text-[16px] text-white opacity-90 mb-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
                                                Description
                                            </h3>
                                            <p className="text-[14px] text-white opacity-80 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'var(--font-body)' }}>
                                                {selectedProblemStatement?.description || 'No description available.'}
                                            </p>
                                        </div>
                                    </div>
                                </Modal>
                            </>
                        )}
                    </div>
                </div>
                <DotPattern />
            </div>
        </div>
    );
}

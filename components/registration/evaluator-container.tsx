"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { Spinner } from "@/components/ui/spinner";
import { LayoutGrid, CheckCircle2, Vote, Search, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { FormSection } from "@/components/registration/form-section";
import { StickyAlert } from "@/components/registration/sticky-alert";
import { TeamDetailView } from "./team-detail-view";

interface Evaluation {
    evaluatorId: string;
    tier: string;
    comment: string;
    createdAt: string;
}

interface Vote {
    evaluatorId: string;
    vote: 'up' | 'down';
    comment?: string;
    createdAt: string;
}

interface Team {
    teamCode: string;
    teamName: string;
    memberCount: number;
    appliedFor?: { id: string; title: string };
    videoURL?: string;
    submissionPDF?: string;
    anyOtherLink?: string;
    isAssigned: boolean;
    assignedAt?: string;
    myEvaluation?: Evaluation;
    myVote?: Vote;
    evaluations: Evaluation[];
    votes: Vote[];
    voteCount?: number;
    isEvaluated: boolean;
}

type Tab = 'pending' | 'evaluated' | 'community' | 'tier_view';
type Tier = 'strongly_accepted' | 'accepted' | 'borderline' | 'rejected';

export function EvaluatorContainer() {
    const { getToken, user } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('pending');

    // Tier View State
    const [selectedTier, setSelectedTier] = useState<Tier>('strongly_accepted');

    const [searchQuery, setSearchQuery] = useState("");
    const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTeams, setTotalTeams] = useState(0);
    const limit = 10;

    // Stats for header
    const [stats, setStats] = useState({ assigned: 0, evaluated: 0, pending: 0 });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            let url = `${API_ENDPOINTS.evaluatorTeams}?page=${page}&limit=${limit}`;

            // Map tab to API type & filters
            if (activeTab === 'community') {
                url += '&type=community&sort=votes&filter=submitted';
            } else if (activeTab === 'tier_view') {
                url += `&type=tier&tier=${selectedTier}`;
            } else {
                url += '&type=assigned';
                // 'pending' and 'evaluated' are filtered client-side for now
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setTeams(data.data.teams || []);
                    if (data.data.pagination) {
                        setTotalPages(data.data.pagination.totalPages);
                        setTotalTeams(data.data.pagination.total);
                    }
                    if (data.data.stats) {
                        setStats(data.data.stats);
                    }
                }
            } else {
                setAlert({ type: "error", message: "Failed to load teams." });
            }
        } catch (error) {
            console.error("Fetch teams error:", error);
            setAlert({ type: "error", message: "Network error. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    // Reset page on tab/tier change
    useEffect(() => {
        setPage(1);
    }, [activeTab, selectedTier]);

    // Fetch data
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, activeTab, selectedTier]);

    const filteredTeams = useMemo(() => {
        let list = [...teams];

        // Client-side filtering for Assigned tabs
        if (activeTab === 'pending') {
            list = list.filter(t => !t.myEvaluation);
        } else if (activeTab === 'evaluated') {
            list = list.filter(t => !!t.myEvaluation);
        }
        // Community and Tier views are pre-filtered by API

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t =>
                t.teamName.toLowerCase().includes(q) ||
                t.teamCode.toLowerCase().includes(q)
            );
        }
        return list;
    }, [teams, activeTab, searchQuery]);

    const handleEvaluationSuccess = (teamCode: string, evaluation: Evaluation) => {
        setTeams(prev => prev.map(t =>
            t.teamCode === teamCode ? { ...t, myEvaluation: evaluation, evaluations: [...t.evaluations, evaluation] } : t
        ));
        setStats(prev => ({ ...prev, evaluated: prev.evaluated + 1, pending: prev.pending - 1 }));
        setSelectedTeam(null);
        setAlert({ type: "success", message: "Evaluation submitted successfully!" });
        setTimeout(() => setAlert(null), 3000);
    };

    const handleVoteSuccess = (teamCode: string, vote: Vote) => {
        setTeams(prev => prev.map(t =>
            t.teamCode === teamCode ? {
                ...t,
                myVote: vote,
                votes: [...t.votes.filter(v => v.evaluatorId !== vote.evaluatorId), vote]
            } : t
        ));
        setSelectedTeam(null);
        setAlert({ type: "success", message: "Vote submitted!" });
        setTimeout(() => setAlert(null), 3000);
    }

    const handleTabChange = (tab: Tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
            setPage(1);
            if (tab === 'tier_view') setSelectedTier('strongly_accepted'); // Default
        }
    };

    if (isLoading && page === 1 && teams.length === 0) {
        return (
            <div className="flex justify-center items-center py-20 min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (selectedTeam) {
        return (
            <TeamDetailView
                team={selectedTeam}
                onBack={() => setSelectedTeam(null)}
                onEvaluationSuccess={handleEvaluationSuccess}
                onVoteSuccess={handleVoteSuccess}
            />
        );
    }

    return (
        <div className="flex flex-col gap-[24px] w-full">
            {alert && (
                <StickyAlert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
            )}

            {/* Header Section */}
            <div className="flex flex-col gap-[12px] items-center text-center">
                <h1 className="text-[48px] text-white leading-[52px] tracking-[-1px]" style={{ fontFamily: 'var(--font-heading)' }}>
                    Evaluator Dashboard
                </h1>
                <p className="text-[15.9px] text-white opacity-90 leading-[23.8px]" style={{ fontFamily: 'var(--font-body)' }}>
                    Welcome back, {user?.name}. You have <span className="text-[#ff4d00] font-bold">{stats.pending}</span> teams pending evaluation.
                </p>
            </div>

            {/* Main Content Area in FormSection */}
            <FormSection title="Evaluation Overview">
                <div className="flex flex-col gap-6">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10 overflow-x-auto">
                        <button
                            onClick={() => handleTabChange('pending')}
                            className={`px-6 py-3 text-[14px] font-medium transition-all relative whitespace-nowrap ${activeTab === 'pending' ? 'text-[#ff4d00]' : 'text-white/60 hover:text-white'
                                }`}
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4" />
                                My Pending
                                {stats.pending > 0 && (
                                    <span className="bg-[#ff4d00] text-white text-[10px] px-2 py-0.5 rounded-full">{stats.pending}</span>
                                )}
                            </div>
                            {activeTab === 'pending' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff4d00]" />
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('evaluated')}
                            className={`px-6 py-3 text-[14px] font-medium transition-all relative whitespace-nowrap ${activeTab === 'evaluated' ? 'text-[#ff4d00]' : 'text-white/60 hover:text-white'
                                }`}
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                My Evaluated
                            </div>
                            {activeTab === 'evaluated' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff4d00]" />
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('community')}
                            className={`px-6 py-3 text-[14px] font-medium transition-all relative whitespace-nowrap ${activeTab === 'community' ? 'text-[#ff4d00]' : 'text-white/60 hover:text-white'
                                }`}
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            <div className="flex items-center gap-2">
                                <Vote className="w-4 h-4" />
                                Community Voting
                            </div>
                            {activeTab === 'community' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff4d00]" />
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('tier_view')}
                            className={`px-6 py-3 text-[14px] font-medium transition-all relative whitespace-nowrap ${activeTab === 'tier_view' ? 'text-[#ff4d00]' : 'text-white/60 hover:text-white'
                                }`}
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Tiered View
                            </div>
                            {activeTab === 'tier_view' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff4d00]" />
                            )}
                        </button>
                    </div>

                    {/* Tier Sub-Tabs */}
                    {activeTab === 'tier_view' && (
                        <div className="flex items-center gap-2 pb-2 overflow-x-auto">
                            {[
                                { id: 'strongly_accepted', label: 'Strongly Accepted', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
                                { id: 'accepted', label: 'Accepted', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                                { id: 'borderline', label: 'Borderline', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
                                { id: 'rejected', label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
                            ].map((tier) => (
                                <button
                                    key={tier.id}
                                    onClick={() => setSelectedTier(tier.id as Tier)}
                                    className={`px-4 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${selectedTier === tier.id
                                            ? tier.color + ' border-opacity-50 ring-1 ring-offset-1 ring-offset-[#1a1a1a] ring-white/10'
                                            : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    {tier.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                placeholder="Search teams..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff4d00]/50 transition-colors"
                                style={{ fontFamily: 'var(--font-body)' }}
                            />
                        </div>
                    </div>

                    {/* Team List with Pagination Spinner */}
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Spinner size="md" />
                        </div>
                    ) : filteredTeams.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
                            <p className="text-white/50" style={{ fontFamily: 'var(--font-body)' }}>No teams found on this page.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredTeams.map((team) => (
                                <div
                                    key={team.teamCode}
                                    onClick={() => setSelectedTeam(team)}
                                    className="group relative bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer flex flex-col gap-3"
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-medium text-white group-hover:text-[#ff4d00] transition-colors line-clamp-1" style={{ fontFamily: 'var(--font-body)' }}>
                                            {team.teamName}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {activeTab === 'community' && (
                                                <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center gap-1">
                                                    <Vote className="w-3 h-3" /> {team.voteCount || 0}
                                                </span>
                                            )}
                                            {team.isAssigned && (
                                                <span className="text-[10px] uppercase bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                                                    Assigned
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/60 line-clamp-2 min-h-[40px]" style={{ fontFamily: 'var(--font-body)' }}>
                                        {team.appliedFor ? team.appliedFor.title : 'No specific problem statement'}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                                        <span style={{ fontFamily: 'var(--font-body)' }}>Team Code: {team.teamCode}</span>
                                        {activeTab === 'evaluated' && team.myEvaluation && (
                                            <span className={`px-2 py-0.5 rounded border ${team.myEvaluation.tier === 'strongly_accepted' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                                                team.myEvaluation.tier === 'accepted' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                                    team.myEvaluation.tier === 'borderline' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                                                        'bg-red-500/20 border-red-500/30 text-red-400'
                                                }`} style={{ fontFamily: 'var(--font-body)' }}>
                                                {team.myEvaluation.tier.replace('_', ' ')}
                                            </span>
                                        )}
                                        {activeTab === 'community' && team.myVote && (
                                            <span className={`px-2 py-0.5 rounded border ${team.myVote.vote === 'up' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                                                'bg-red-500/20 border-red-500/30 text-red-400'
                                                }`} style={{ fontFamily: 'var(--font-body)' }}>
                                                voted {team.myVote.vote}
                                            </span>
                                        )}
                                        {activeTab === 'tier_view' && (
                                            <span className={`px-2 py-0.5 rounded border capitalize ${selectedTier === 'strongly_accepted' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                                                    selectedTier === 'accepted' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                                        selectedTier === 'borderline' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                                                            'bg-red-500/20 border-red-500/30 text-red-400'
                                                }`} style={{ fontFamily: 'var(--font-body)' }}>
                                                {selectedTier.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                            <div className="text-sm text-white/40" style={{ fontFamily: 'var(--font-body)' }}>
                                Showing page {page} of {totalPages} ({totalTeams} total)
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-white/10 bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg border border-white/10 bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </FormSection>
        </div>
    );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/registration/button";
import { ChevronLeft, FileText, Youtube, ExternalLink, ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp, User } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { StickyAlert } from "@/components/registration/sticky-alert";
import { Spinner } from "@/components/ui/spinner";
import { FormSection } from "@/components/registration/form-section";

import { UserProfileModal, UserDetails } from "./user-profile-modal";

interface TeamDetailViewProps {
    team: any;
    onBack: () => void;
    onEvaluationSuccess: (teamCode: string, evaluation: any) => void;
    onVoteSuccess: (teamCode: string, vote: any) => void;
}

export function TeamDetailView({ team, onBack, onEvaluationSuccess, onVoteSuccess }: TeamDetailViewProps) {
    const { getToken, user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tier, setTier] = useState<string>(team.myEvaluation?.tier || "");
    const [comment, setComment] = useState<string>(team.myEvaluation?.comment || "");

    // Voting state
    const [voteComment, setVoteComment] = useState<string>(team.myVote?.comment || "");
    const [localVote, setLocalVote] = useState<any>(team.myVote || null); // Optimistic UI state

    const [error, setError] = useState<string | null>(null);

    // Profile Modal State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    const isAssigned = team.isAssigned;

    // Sync local state when prop changes (e.g. after refresh)
    useEffect(() => {
        setLocalVote(team.myVote || null);
        setVoteComment(team.myVote?.comment || "");
    }, [team.myVote]);

    const handleMemberClick = async (uid: string) => {
        setIsLoadingProfile(true);
        setIsProfileOpen(true);
        setSelectedUser(null); // Reset
        try {
            const token = await getToken();
            const response = await fetch(`${API_ENDPOINTS.users}/${uid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.user) {
                setSelectedUser(data.user);
            } else {
                setError("Failed to load user profile");
            }
        } catch (err) {
            console.error(err);
            setError("Network error loading profile");
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleEvaluationSubmit = async () => {
        if (!tier) {
            setError("Please select a tier.");
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            const token = await getToken();
            const response = await fetch(API_ENDPOINTS.evaluatorEvaluate, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    teamCode: team.teamCode,
                    tier,
                    comment
                })
            });

            const data = await response.json();
            if (response.ok) {
                onEvaluationSuccess(team.teamCode, data.data.evaluation);
            } else {
                setError(data.message || "Failed to submit evaluation.");
            }
        } catch (err) {
            setError("Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Optimistic UI for Counts
    const { displayUpvotes, displayDownvotes } = useMemo(() => {
        let u = team.upvoteCount || 0;
        let d = team.downvoteCount || 0;

        // Subtract original vote if it existed
        if (team.myVote?.vote === 'up') u--;
        if (team.myVote?.vote === 'down') d--;

        // Add current local vote
        if (localVote?.vote === 'up') u++;
        if (localVote?.vote === 'down') d++;

        return { displayUpvotes: Math.max(0, u), displayDownvotes: Math.max(0, d) };
    }, [team.upvoteCount, team.downvoteCount, team.myVote, localVote?.vote]);

    const handleVoteSubmit = async (voteType: 'up' | 'down', isCommentUpdate = false) => {
        // Optimistic Update
        const previousVote = localVote;
        let newVoteState = null;

        if (isCommentUpdate) {
            newVoteState = { ...previousVote, comment: voteComment };
        } else {
            // Toggling or Switching
            if (previousVote && previousVote.vote === voteType) {
                newVoteState = null;
            } else {
                // Switching or New Vote
                newVoteState = { vote: voteType, comment: voteComment || '' };
            }
        }

        setLocalVote(newVoteState);
        setIsSubmitting(true);
        setError(null);

        try {
            const token = await getToken();
            const response = await fetch(API_ENDPOINTS.evaluatorVote, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    teamCode: team.teamCode,
                    vote: voteType,
                    comment: voteComment,
                    skipToggle: isCommentUpdate
                })
            });

            const data = await response.json();
            if (response.ok) {
                onVoteSuccess(team.teamCode, data.data.vote);
            } else {
                // Revert on failure
                setLocalVote(previousVote);
                setError(data.message || "Failed to submit vote.");
            }
        } catch (err) {
            setLocalVote(previousVote);
            setError("Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                userDetails={selectedUser}
                isLoading={isLoadingProfile}
            />

            <div className="flex items-center gap-4">
                <Button variant="secondary" onClick={onBack}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Dashboard
                </Button>
                <div>
                    <h2 className="text-xl font-bold text-white text-[24px]" style={{ fontFamily: 'var(--font-heading)' }}>{team.teamName}</h2>
                    <p className="text-sm text-white/60" style={{ fontFamily: 'var(--font-body)' }}>{team.appliedFor?.title || "No Problem Statement"}</p>
                </div>
            </div>

            {error && <StickyAlert type="error" message={error} onClose={() => setError(null)} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Column: Artifacts (PDF/Video) & Voting */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Submission Artifacts */}
                    <FormSection title="Submission Artifacts">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4 flex-wrap">
                                {team.videoURL && (
                                    <a
                                        href={team.videoURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-3 bg-red-600/10 text-red-400 border border-red-600/20 rounded-lg hover:bg-red-600/20 transition-colors"
                                        style={{ fontFamily: 'var(--font-body)' }}
                                    >
                                        <Youtube className="w-5 h-5" />
                                        Watch Video Pitch
                                        <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                                    </a>
                                )}
                                {team.submissionPDF ? (
                                    <a
                                        href={team.submissionPDF}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-3 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                        style={{ fontFamily: 'var(--font-body)' }}
                                    >
                                        <FileText className="w-5 h-5" />
                                        View Submission PDF
                                        <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/40 cursor-not-allowed">
                                        <FileText className="w-5 h-5 opacity-50" />
                                        No PDF Submission
                                    </div>
                                )}
                                {team.anyOtherLink && (
                                    <a
                                        href={team.anyOtherLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-3 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg hover:bg-blue-600/20 transition-colors"
                                        style={{ fontFamily: 'var(--font-body)' }}
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        Additional Link
                                    </a>
                                )}
                            </div>
                        </div>
                    </FormSection>

                    {/* Official Evaluation / Community Vote Form*/}
                    <FormSection title={isAssigned ? "Official Evaluation" : "Community Vote"}>
                        <div className="flex flex-col gap-6">
                            {isAssigned ? (
                                <>
                                    <div className="flex flex-col gap-3">
                                        <label className="text-sm font-medium text-white/80" style={{ fontFamily: 'var(--font-body)' }}>Decision Tier</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { value: 'strongly_accepted', label: 'Strongly Accepted', color: 'border-green-500/50 text-green-400 bg-green-500/10' },
                                                { value: 'accepted', label: 'Accepted', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' },
                                                { value: 'borderline', label: 'Borderline', color: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' },
                                                { value: 'rejected', label: 'Rejected', color: 'border-red-500/50 text-red-400 bg-red-500/10' }
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setTier(option.value)}
                                                    className={`px-4 py-3 rounded-lg border text-left transition-all ${tier === option.value
                                                        ? option.color + ' ring-1 ring-offset-1 ring-offset-[#1a1a1a]'
                                                        : 'border-white/10 text-white/50 hover:border-white/30 hover:bg-white/5'
                                                        }`}
                                                    style={{ fontFamily: 'var(--font-body)' }}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-white/80" style={{ fontFamily: 'var(--font-body)' }}>Comments</label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Add your evaluation notes..."
                                            className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[#ff4d00]/50"
                                            style={{ fontFamily: 'var(--font-body)' }}
                                        />
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={handleEvaluationSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Spinner size="sm" /> : "Submit Evaluation"}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleVoteSubmit('up')}
                                            disabled={isSubmitting}
                                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border transition-all ${localVote?.vote === 'up'
                                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30'
                                                }`}
                                            style={{ fontFamily: 'var(--font-body)' }}
                                        >
                                            <ThumbsUp className="w-6 h-6" />
                                            Upvote
                                        </button>
                                        <button
                                            onClick={() => handleVoteSubmit('down')}
                                            disabled={isSubmitting}
                                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border transition-all ${localVote?.vote === 'down'
                                                ? 'bg-red-500/20 border-red-500 text-red-400'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                                                }`}
                                            style={{ fontFamily: 'var(--font-body)' }}
                                        >
                                            <ThumbsDown className="w-6 h-6" />
                                            Downvote
                                        </button>
                                    </div>

                                    {/* Separate Comment Section */}
                                    <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                                        <label className="text-sm font-medium text-white/80 flex items-center gap-2" style={{ fontFamily: 'var(--font-body)' }}>
                                            <MessageSquare className="w-4 h-4" />
                                            Add Comment (Optional)
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                value={voteComment}
                                                onChange={(e) => setVoteComment(e.target.value)}
                                                placeholder="Share your thoughts..."
                                                className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[#ff4d00]/50 mb-2"
                                                style={{ fontFamily: 'var(--font-body)' }}
                                                disabled={!localVote}
                                            />
                                            {!localVote && (
                                                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center border border-white/5">
                                                    <p className="text-sm text-white/60 flex items-center gap-2">
                                                        <ThumbsUp className="w-3 h-3" /> Vote to comment
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 select-none">
                                                <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                    {displayUpvotes}
                                                </div>
                                                <div className="w-[1px] h-3 bg-white/10" />
                                                <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                                                    <ThumbsDown className="w-3.5 h-3.5" />
                                                    {displayDownvotes}
                                                </div>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                onClick={() => handleVoteSubmit(localVote?.vote as 'up' | 'down', true)} // true = isCommentUpdate
                                                disabled={isSubmitting || !localVote || !voteComment.trim() || voteComment === localVote?.comment}
                                            >
                                                {isSubmitting ? <Spinner size="sm" /> : "Post Comment"}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </FormSection>
                </div>

                {/* Right Column: Team Members*/}
                <div className="flex flex-col h-full">
                    <FormSection title="Team Members" className="h-full">
                        <div className="flex flex-col h-full gap-4">
                            {/* Render Actual Members */}
                            {team.teamMembers?.map((member: any) => (
                                <div
                                    key={member.uid}
                                    onClick={() => handleMemberClick(member.uid)}
                                    className="flex-1 flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                                            <span className="text-sm font-bold text-white/70 group-hover:text-white">{member.name.charAt(0)}</span>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-medium text-white group-hover:text-[#ff4d00] transition-colors line-clamp-1">{member.name}</span>
                                            <span className="text-xs text-white/50 line-clamp-1">{member.organisation}</span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] uppercase px-2.5 py-1 rounded-full border ${member.role === 'Team Lead'
                                        ? 'bg-[#ff4d00]/10 text-[#ff4d00] border-[#ff4d00]/20'
                                        : 'bg-white/5 text-white/40 border-white/5'
                                        }`} style={{ fontFamily: 'var(--font-body)' }}>
                                        {member.role === 'Team Lead' ? 'Lead' : 'Member'}
                                    </span>
                                </div>
                            ))}
                            {/* Render Empty Slots */}
                            {Array.from({ length: Math.max(0, 4 - (team.teamMembers?.length || 0)) }).map((_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="flex-1 flex items-center justify-between p-4 border border-dashed border-white/10 rounded-xl bg-transparent opacity-50 select-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                                            <User className="w-4 h-4 text-white/20" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-medium text-white/30" style={{ fontFamily: 'var(--font-body)' }}>Empty Slot</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FormSection>
                </div>
            </div>

            {/* Community Activity Feed */}
            <FormSection title="Community Feedback">
                {(!team.evaluations?.length && !team.votes?.length) && (
                    <p className="text-sm text-white/40 italic" style={{ fontFamily: 'var(--font-body)' }}>No feedback yet.</p>
                )}
                <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Official Evaluations */}
                    {team.evaluations?.map((ev: any, i: number) => (
                        <div key={`ev-${i}`} className="bg-white/5 rounded-lg p-3 border border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-white text-sm" style={{ fontFamily: 'var(--font-body)' }}>{ev.name || "Evaluator"}</span>
                                <span className="text-[10px] uppercase bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                                    Official
                                </span>
                            </div>
                            <div className="mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded border ${ev.tier === 'strongly_accepted' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                    ev.tier === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                        ev.tier === 'borderline' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`} style={{ fontFamily: 'var(--font-body)' }}>
                                    {ev.tier.replace('_', ' ')}
                                </span>
                            </div>
                            {ev.comment && <p className="text-sm text-white/70" style={{ fontFamily: 'var(--font-body)' }}>{ev.comment}</p>}
                        </div>
                    ))}
                    {/* Community Votes */}
                    {team.votes?.map((v: any, i: number) => v.comment ? (
                        <div key={`vt-${i}`} className="bg-white/5 rounded-lg p-3 border border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-white/60 text-sm" style={{ fontFamily: 'var(--font-body)' }}>{v.name || "Community Member"}</span>
                                {v.vote === 'up' ? (
                                    <ThumbsUp className="w-3 h-3 text-green-400" />
                                ) : (
                                    <ThumbsDown className="w-3 h-3 text-red-400" />
                                )}
                            </div>
                            <p className="text-sm text-white/70" style={{ fontFamily: 'var(--font-body)' }}>{v.comment}</p>
                        </div>
                    ) : null)}
                </div>
            </FormSection>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { FormInput } from "./form-input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { API_ENDPOINTS } from "@/lib/api-config";
import { Search, CheckCircle, Circle, Users } from "lucide-react";
import { StickyAlert } from "./sticky-alert";
import { ConfirmationDialog } from "./confirmation-dialog";

interface AssignTeamsModalProps {
    isOpen: boolean;
    onClose: () => void;
    evaluatorId: string;
    evaluatorName: string;
    onSuccess: () => void;
}

interface TeamSelect {
    teamCode: string;
    teamName: string;
    isAssigned: boolean;
    assignedToName?: string;
    problemStatement?: string;
}

export function AssignTeamsModal({
    isOpen,
    onClose,
    evaluatorId,
    evaluatorName,
    onSuccess
}: AssignTeamsModalProps) {
    const { getToken } = useAuth();
    const [teams, setTeams] = useState<TeamSelect[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        teamCode: "",
    });

    useEffect(() => {
        if (isOpen) {
            setPage(1);
            setTeams([]);
            setHasMore(true);
            setSelectedTeams(new Set());
            setSearch("");
            setAlert(null);
            fetchTeams(1, "");
        }
    }, [isOpen]);

    // Debounce search
    useEffect(() => {
        if (!isOpen) return;
        const timeoutId = setTimeout(() => {
            if (search) {
                setPage(1);
                setTeams([]);
                fetchTeams(1, search);
            } else if (page === 1 && teams.length === 0) {
                fetchTeams(1, "");
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const fetchTeams = async (pageNum: number, searchQuery: string) => {
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            const queryParams = new URLSearchParams({
                limit: '50', // Chunk size
                page: pageNum.toString(),
                search: searchQuery,
                isSubmitted: 'true',
                excludeAssigned: 'true'
            });

            const response = await fetch(`${API_ENDPOINTS.adminTeams}?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.teams) {
                    const mappedTeams = data.data.teams.map((t: any) => ({
                        teamCode: t.teamCode,
                        teamName: t.teamName,
                        isAssigned: !!t.evaluator,
                        assignedToName: t.evaluator?.name,
                        problemStatement: t.appliedFor?.title || "No Problem Statement"
                    }));

                    if (pageNum === 1) {
                        setTeams(mappedTeams);
                    } else {
                        setTeams(prev => [...prev, ...mappedTeams]);
                    }

                    setHasMore(data.data.pagination.currentPage < data.data.pagination.totalPages);
                }
            }
        } catch (error) {
            console.error("Failed to fetch teams:", error);
            setAlert({ type: "error", message: "Failed to load teams." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchTeams(nextPage, search);
    };

    const handleToggleTeam = (teamCode: string) => {
        const newSelected = new Set(selectedTeams);
        if (newSelected.has(teamCode)) {
            newSelected.delete(teamCode);
        } else {
            newSelected.add(teamCode);
        }
        setSelectedTeams(newSelected);
    };

    const handleAssign = async () => {
        if (selectedTeams.size === 0) return;

        setIsSubmitting(true);
        try {
            const token = await getToken();
            if (!token) return;

            const response = await fetch(API_ENDPOINTS.adminAssignEvaluators, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    evaluatorUid: evaluatorId,
                    teamCodes: Array.from(selectedTeams),
                }),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                setAlert({
                    type: "error",
                    message: data.message || "Failed to assign teams."
                });
            }
        } catch (error) {
            console.error("Assign error:", error);
            setAlert({ type: "error", message: "An error occurred while assigning teams." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter teams based on search
    const filteredTeams = teams;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Assign Teams to ${evaluatorName}`}
        >
            <div className="flex flex-col gap-[16px] max-h-[70vh]">
                {alert && (
                    <StickyAlert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                )}

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                        type="text"
                        placeholder="Search teams by name or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] pl-9 pr-4 py-2 text-white text-[14px] focus:outline-none focus:border-[#ff4d00]"
                    />
                </div>

                <div className="flex-1 overflow-y-auto min-h-[200px] flex flex-col gap-[8px] pr-1">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="lg" />
                        </div>
                    ) : filteredTeams.length === 0 ? (
                        <div className="text-center py-8 text-white/50">
                            No teams found.
                        </div>
                    ) : (
                        filteredTeams.map((team) => (
                            <div
                                key={team.teamCode}
                                onClick={() => handleToggleTeam(team.teamCode)}
                                className={`flex items-center justify-between p-3 rounded-[8px] border cursor-pointer transition-all ${selectedTeams.has(team.teamCode)
                                    ? "bg-[rgba(255,77,0,0.1)] border-[#ff4d00]"
                                    : "bg-[rgba(255,255,255,0.03)] border-transparent hover:bg-[rgba(255,255,255,0.05)]"
                                    }`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-white text-[14px] font-medium">{team.teamName}</span>
                                    <span className="text-white/60 text-[12px]">{team.problemStatement}</span>
                                    {team.isAssigned && (
                                        <span className="text-amber-400 text-[11px] mt-1 flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            Already assigned
                                        </span>
                                    )}
                                </div>
                                <div>
                                    {selectedTeams.has(team.teamCode) ? (
                                        <CheckCircle className="w-5 h-5 text-[#ff4d00]" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-white/20" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {hasMore && !isLoading && filteredTeams.length > 0 && (
                        <Button
                            variant="secondary"
                            onClick={handleLoadMore}
                            className="w-full mt-2"
                        >
                            Load More
                        </Button>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[rgba(255,255,255,0.1)]">
                    <span className="text-white/60 text-[13px]">
                        {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-[12px]">
                        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => setConfirmation({ isOpen: true, teamCode: "" })}
                            disabled={isSubmitting || selectedTeams.size === 0}
                        >
                            {isSubmitting && <Spinner size="sm" className="mr-2" />}
                            Assign Selected
                        </Button>
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={() => {
                    handleAssign();
                    setConfirmation({ ...confirmation, isOpen: false });
                }}
                title="Assign Team"
                message={`Are you sure you want to assign this team to ${evaluatorName}?`}
            />
        </Modal>
    );
}

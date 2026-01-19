import React, { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { Button } from "./button";
import { Card } from "./card";
import { Spinner } from "@/components/ui/spinner";
import { Download, UserCog, PlusCircle, LayoutGrid, CheckCircle2, UserPlus } from "lucide-react";
import { UserCircle } from "lucide-react";
import { StickyAlert } from "./sticky-alert";
import { AssignTeamsModal } from "./assign-teams-modal";
import { AddEvaluatorModal } from "./add-evaluator-modal";
import { Trash2 } from "lucide-react";

interface Evaluator {
    id: string;
    uid: string;
    name: string;
    email: string;
    assignedCount: number;
    evaluatedCount: number;
    pendingCount: number;
}

export function EvaluatorsTab() {
    const { getToken } = useAuth();
    const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedEvaluator, setSelectedEvaluator] = useState<{ id: string, name: string } | null>(null);

    const fetchEvaluators = async () => {
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            const response = await fetch(API_ENDPOINTS.adminEvaluators, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.evaluators) {
                    setEvaluators(data.data.evaluators);
                }
            } else {
                setAlert({ type: "error", message: "Failed to fetch evaluators" });
            }
        } catch (error) {
            console.error("Failed to fetch evaluators:", error);
            setAlert({ type: "error", message: "An error occurred while loading evaluators" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvaluators();
    }, []);

    const handleOpenAssignModal = (evaluator: Evaluator) => {
        setSelectedEvaluator({ id: evaluator.uid, name: evaluator.name });
        setIsAssignModalOpen(true);
    };

    const handleAssignSuccess = () => {
        setAlert({ type: "success", message: "Teams assigned successfully!" });
        fetchEvaluators(); // Refresh list to update counts
        setTimeout(() => setAlert(null), 3000);
    };

    const handlePruneAssignments = async () => {
        const confirmed = window.confirm("Are you sure you want to remove all assignments for teams that have not yet submitted? This action cannot be undone.");
        if (!confirmed) return;

        try {
            const token = await getToken();
            if (!token) return;

            const response = await fetch(`${API_ENDPOINTS.adminEvaluators}/prune`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAlert({
                    type: "success",
                    message: `Cleanup successful! Removed ${data.data.prunedCount} invalid assignments.`
                });
                fetchEvaluators();
            } else {
                setAlert({ type: "error", message: "Failed to prune assignments" });
            }
        } catch (error) {
            console.error("Prune error:", error);
            setAlert({ type: "error", message: "An error occurred during cleanup" });
        } finally {
            setTimeout(() => setAlert(null), 5000);
        }
    };

    const filteredEvaluators = evaluators.filter(ev =>
        ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-[24px] w-full mt-6">
            {alert && (
                <StickyAlert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
            )}

            <FormSection title="Manage Evaluators">
                <div className="flex flex-col gap-[12px] mb-6">
                    <div className="flex flex-col sm:flex-row gap-[12px]">
                        <div className="flex-1">
                            <FormInput
                                label=""
                                placeholder="Search evaluators..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(true)}>
                            <UserPlus className="w-4 h-4" />
                            Add Evaluator
                        </Button>
                        <Button variant="danger" onClick={handlePruneAssignments}>
                            <Trash2 className="w-4 h-4" />
                            Clean Invalid Assignments
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-[40px]">
                        <Spinner size="lg" />
                    </div>
                ) : filteredEvaluators.length === 0 ? (
                    <div className="text-white text-center py-[40px] opacity-70">
                        No evaluators found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-[16px]">
                        {filteredEvaluators.map((evaluator) => (
                            <Card key={evaluator.id}>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0">
                                            <UserCog className="w-6 h-6 text-[#ff4d00]" />
                                        </div>
                                        <div>
                                            <h3 className="font-['Inter',sans-serif] text-[16px] text-white font-medium">{evaluator.name}</h3>
                                            <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-70 mb-1 break-all">{evaluator.email}</p>
                                            <div className="flex flex-wrap gap-3 text-[12px]">
                                                <span className="text-white/60 flex items-center gap-1">
                                                    <LayoutGrid className="w-3 h-3" /> Assigned: {evaluator.assignedCount}
                                                </span>
                                                <span className="text-green-400/80 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Evaluated: {evaluator.evaluatedCount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-auto flex justify-end">
                                        <Button variant="primary" onClick={() => handleOpenAssignModal(evaluator)}>
                                            <PlusCircle className="w-4 h-4" />
                                            Assign Teams
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </FormSection>

            {selectedEvaluator && (
                <AssignTeamsModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    evaluatorId={selectedEvaluator.id}
                    evaluatorName={selectedEvaluator.name}
                    onSuccess={handleAssignSuccess}
                />
            )}

            <AddEvaluatorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    setAlert({ type: "success", message: "Evaluator added successfully!" });
                    fetchEvaluators();
                }}
            />
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { FormInput } from "./form-input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { API_ENDPOINTS } from "@/lib/api-config";
import { Search, UserPlus, Check } from "lucide-react";
import { StickyAlert } from "./sticky-alert";
import { ConfirmationDialog } from "./confirmation-dialog";

interface AddEvaluatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface UserResult {
    uid: string;
    name: string;
    email: string;
    role: string;
    isEvaluator: boolean;
}

export function AddEvaluatorModal({
    isOpen,
    onClose,
    onSuccess
}: AddEvaluatorModalProps) {
    const { getToken } = useAuth();
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<UserResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [promotingId, setPromotingId] = useState<string | null>(null);
    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        userId: "",
    });

    useEffect(() => {
        if (isOpen) {
            setSearch("");
            setUsers([]);
            setAlert(null);
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim().length >= 2) {
                searchUsers(search);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const searchUsers = async (query: string) => {
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            const response = await fetch(`${API_ENDPOINTS.adminParticipants}?search=${query}&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.participants) {
                    const mappedUsers = data.data.participants.map((u: any) => ({
                        uid: u.uid,
                        name: u.name,
                        email: u.email,
                        role: u.role || 'user',
                        isEvaluator: u.role === 'evaluator'
                    }));
                    setUsers(mappedUsers);
                }
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePromote = async (userId: string) => {
        setPromotingId(userId);
        setAlert(null);

        try {
            const token = await getToken();
            if (!token) return;

            const response = await fetch(API_ENDPOINTS.adminPromoteUser, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (response.ok) {
                setAlert({ type: "success", message: "User promoted to evaluator!" });
                // Update local state to reflect change immediately
                setUsers(prev => prev.map(u => u.uid === userId ? { ...u, isEvaluator: true, role: 'evaluator' } : u));

                // Notify parent after short delay
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            } else {
                setAlert({ type: "error", message: data.message || "Failed to promote user." });
            }
        } catch (error) {
            setAlert({ type: "error", message: "An error occurred." });
        } finally {
            setPromotingId(null);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Evaluator"
        >
            <div className="flex flex-col gap-[16px] min-h-[300px]">
                {alert && (
                    <StickyAlert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                )}

                <div className="relative">
                    <FormInput
                        label="Search User"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-[38px]">
                            <Spinner size="sm" />
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col gap-[8px]">
                    {users.length === 0 && search.length >= 2 && !isLoading && (
                        <div className="text-center py-6 text-white/50 text-sm">
                            No users found matching "{search}"
                        </div>
                    )}

                    {users.map((user) => (
                        <div
                            key={user.uid}
                            className="flex items-center justify-between p-3 rounded-[8px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]"
                        >
                            <div className="flex flex-col overflow-hidden mr-3">
                                <span className="text-white text-[14px] font-medium truncate">{user.name}</span>
                                <span className="text-white/60 text-[12px] truncate">{user.email}</span>
                            </div>

                            {user.isEvaluator ? (
                                <div className="flex items-center gap-1 text-green-400 text-[12px] px-3 py-1.5 bg-green-400/10 rounded-full border border-green-400/20">
                                    <Check className="w-3 h-3" />
                                    <span>Evaluator</span>
                                </div>
                            ) : (
                                <Button
                                    variant="secondary"
                                    className="shrink-0 h-8"
                                    onClick={() => setConfirmation({ isOpen: true, userId: user.uid })}
                                    disabled={!!promotingId}
                                >
                                    {promotingId === user.uid ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <UserPlus className="w-3 h-3 mr-1" />
                                            Add
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmationDialog
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={() => {
                    handlePromote(confirmation.userId);
                    setConfirmation({ ...confirmation, isOpen: false });
                }}
                title="Promote User"
                message="Are you sure you want to promote this user to an Evaluator? They will gain access to the evaluator dashboard."
            />
        </Modal>
    );
}

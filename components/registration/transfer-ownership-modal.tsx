"use client";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./button";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Crown, AlertTriangle } from "lucide-react";

interface TeamMember {
    uid: string;
    name: string;
    role: string;
}

interface TransferOwnershipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newLeadId: string) => Promise<void>;
    members: TeamMember[];
    currentUserId: string;
}

export function TransferOwnershipModal({
    isOpen,
    onClose,
    onConfirm,
    members,
    currentUserId,
}: TransferOwnershipModalProps) {
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const eligibleMembers = members.filter(
        (member) => member.uid !== currentUserId
    );

    const handleConfirm = async () => {
        if (!selectedMemberId) return;

        setIsSubmitting(true);
        try {
            await onConfirm(selectedMemberId);
        } finally {
            setIsSubmitting(false);
            setSelectedMemberId(null);
        }
    };

    const handleClose = () => {
        setSelectedMemberId(null);
        onClose();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={handleClose}>
            <AlertDialogContent className="bg-[#1a1a1a] border-[#333] max-h-[80vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-white flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        Transfer Team Ownership
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                        Select a member to transfer ownership to. <br />
                        <span className="text-yellow-500 flex items-center gap-1 mt-1 text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            You will become a regular member after this action.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 flex flex-col gap-2">
                    {eligibleMembers.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                            No other members to transfer ownership to.
                        </p>
                    ) : (
                        eligibleMembers.map((member) => (
                            <div
                                key={member.uid}
                                onClick={() => setSelectedMemberId(member.uid)}
                                className={`
                  p-3 rounded-[15px] border cursor-pointer transition-all flex items-center justify-between
                  ${selectedMemberId === member.uid
                                        ? "bg-[#2a2a2a] border-white/30 ring-1 ring-white/20"
                                        : "bg-[#111] border-[#333] hover:border-white/20 hover:bg-[#1f1f1f]"
                                    }
                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`
                    w-4 h-4 rounded-full border flex items-center justify-center
                    ${selectedMemberId === member.uid ? "border-green-500 bg-green-500/20" : "border-gray-600"}
                  `}>
                                        {selectedMemberId === member.uid && (
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                        )}
                                    </div>
                                    <span className="text-white text-sm font-medium">{member.name}</span>
                                </div>
                                {/* Visual indicator of role change */}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>Member</span>
                                    <span>→</span>
                                    <span className={selectedMemberId === member.uid ? "text-yellow-500" : ""}>Lead</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <AlertDialogFooter className="sm:justify-between gap-4">
                    <AlertDialogCancel onClick={handleClose} disabled={isSubmitting} className="m-0 bg-transparent border-[#333] text-white hover:bg-[#2a2a2a] hover:text-white">
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedMemberId || isSubmitting}
                        variant="primary"
                        className="bg-yellow-600 hover:bg-yellow-700 text-white border-none m-0 w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Transferring...
                            </>
                        ) : (
                            "Confirm Transfer"
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

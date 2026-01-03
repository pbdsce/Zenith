import React from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger";
    isLoading?: boolean;
}

export function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    isLoading = false
}: ConfirmationDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="flex flex-col items-center text-center gap-4 pt-2 pb-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/10' : 'bg-[#ff4d00]/10'
                    }`}>
                    <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-red-500' : 'text-[#ff4d00]'
                        }`} />
                </div>

                <h3 className="text-xl font-semibold text-white">
                    {title}
                </h3>

                <p className="text-white/70 text-sm max-w-[80%]">
                    {message}
                </p>

                <div className="flex gap-3 mt-4 w-full justify-center">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={variant === 'danger' ? '!bg-red-600 hover:!bg-red-700' : ''}
                    >
                        {isLoading ? "Processing..." : confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

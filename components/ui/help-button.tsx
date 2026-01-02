"use client";

import { useState } from "react";
import { Modal } from "@/components/registration/modal";
import { MessageCircleQuestion } from "lucide-react";

export function HelpButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 glass-effect hover:bg-white/10 text-white rounded-full px-5 py-3 shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,77,0,0.3)] group"
            >
                <MessageCircleQuestion className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-medium pr-1">Need Help?</span>
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Need Assistance?"
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-gray-300 text-lg">
                            Stuck or have a question? We're here to help!
                        </p>
                        <p className="text-gray-400">
                            Join our official Discord server and head over to the <span className="text-[var(--primary)] font-bold">#help</span> channel for support.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <a
                            href="https://discord.gg/zenith"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center bg-[var(--primary)] hover:brightness-110 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 w-full sm:w-auto shadow-[0_0_15px_rgba(255,77,0,0.4)] hover:shadow-[0_0_20px_rgba(255,77,0,0.6)]"
                        >
                            Join Discord Server
                        </a>
                    </div>
                </div>
            </Modal>
        </>
    );
}

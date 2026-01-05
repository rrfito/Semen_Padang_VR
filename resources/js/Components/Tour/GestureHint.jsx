import React, { useEffect, useState } from "react";
import { FaHandPointer } from "react-icons/fa";

export default function GestureHint() {
    // Initialize state based on session storage to prevent flash
    const [visible, setVisible] = useState(() => {
        // Check if running in browser
        if (typeof window !== "undefined") {
            return !sessionStorage.getItem("tour_gesture_shown");
        }
        return false;
    });

    useEffect(() => {
        if (visible) {
            // Mark as shown immediately
            sessionStorage.setItem("tour_gesture_shown", "true");

            // Auto hide after duration
            const timer = setTimeout(() => {
                setVisible(false);
            }, 4000); // 4 seconds duration
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="flex flex-col items-center animate-fade-out-delay">
                {/* Hand Animation */}
                <div className="w-20 h-20 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/10 relative overflow-hidden">
                    <FaHandPointer className="text-white text-3xl opacity-90 animate-hand-swipe" />
                </div>

                <p className="mt-4 text-white text-lg font-medium drop-shadow-md bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm">
                    Geser untuk melihat sekeliling
                </p>
            </div>

            <style>{`
                @keyframes hand-swipe {
                    0%, 100% { transform: translateX(-15px) rotate(-15deg); opacity: 0.8; }
                    50% { transform: translateX(15px) rotate(15deg); opacity: 1; }
                }
                .animate-hand-swipe {
                    animation: hand-swipe 1.5s ease-in-out infinite;
                }
                @keyframes fade-out {
                    0% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .animate-fade-out-delay {
                    animation: fade-out 4s forwards;
                }
            `}</style>
        </div>
    );
}

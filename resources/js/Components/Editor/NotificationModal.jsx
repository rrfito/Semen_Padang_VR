import React, { useEffect } from "react";

/**
 * Reusable Notification Toast
 * Positioning: Top-Left (Fixed)
 * Behavior: Non-blocking, auto-close
 */
export default function NotificationModal({
    isOpen,
    onClose,
    title,
    message,
    variant = "success", // 'success' | 'error' | 'info' | 'warning'
    autoClose = 5000, // Increased to 5s for readability
}) {
    useEffect(() => {
        if (isOpen && autoClose > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, autoClose);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, onClose]);

    if (!isOpen) return null;

    const variants = {
        success: {
            icon: "check_circle",
            iconColor: "text-green-500",
            iconBg: "bg-green-100",
            borderColor: "border-green-200",
        },
        error: {
            icon: "error",
            iconColor: "text-red-500",
            iconBg: "bg-red-100",
            borderColor: "border-red-200",
        },
        warning: {
            icon: "warning",
            iconColor: "text-amber-500",
            iconBg: "bg-amber-100",
            borderColor: "border-amber-200",
        },
        info: {
            icon: "info",
            iconColor: "text-blue-500",
            iconBg: "bg-blue-100",
            borderColor: "border-blue-200",
        },
    };

    const style = variants[variant] || variants.info;

    return (
        <div className="fixed bottom-6 left-6 z-[9999] pointer-events-none">
            <div
                className={`bg-white dark:bg-surface-dark rounded-xl shadow-lg border ${style.borderColor} w-80 pointer-events-auto animate-in slide-in-from-left duration-300 relative`}
            >
                {/* Content */}
                <div className="p-4 flex items-start gap-3">
                    <div
                        className={`size-10 flex items-center justify-center rounded-lg ${style.iconBg} ${style.iconColor} shrink-0`}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {style.icon}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        {title && (
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                {title}
                            </h3>
                        )}
                        <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors shrink-0 -mr-1 -mt-1"
                    >
                        <span className="material-symbols-outlined text-lg">
                            close
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

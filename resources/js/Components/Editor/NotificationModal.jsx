import React, { useEffect } from "react";

/**
 * Reusable Notification Modal
 * Replaces browser alert() with better UX
 */
export default function NotificationModal({
    isOpen,
    onClose,
    title,
    message,
    variant = "success", // 'success' | 'error' | 'info' | 'warning'
    autoClose = 3000, // Auto-close after 3 seconds, set to 0 to disable
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
            iconColor: "text-green-400",
            iconBg: "bg-green-500/10",
            borderColor: "border-green-500/30",
        },
        error: {
            icon: "error",
            iconColor: "text-red-400",
            iconBg: "bg-red-500/10",
            borderColor: "border-red-500/30",
        },
        warning: {
            icon: "warning",
            iconColor: "text-amber-400",
            iconBg: "bg-amber-500/10",
            borderColor: "border-amber-500/30",
        },
        info: {
            icon: "info",
            iconColor: "text-blue-400",
            iconBg: "bg-blue-500/10",
            borderColor: "border-blue-500/30",
        },
    };

    const style = variants[variant] || variants.info;

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-[100] p-4">
            <div
                className={`bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-md w-full border ${style.borderColor} animate-in fade-in zoom-in duration-200`}
            >
                {/* Content */}
                <div className="p-6 flex items-start gap-4">
                    <div
                        className={`size-12 flex items-center justify-center rounded-xl ${style.iconBg} ${style.iconColor} shrink-0`}
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {style.icon}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        {title && (
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {title}
                            </h3>
                        )}
                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors shrink-0"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Progress bar for auto-close */}
                {autoClose > 0 && (
                    <div className="h-1 bg-gray-200 dark:bg-slate-800 rounded-b-xl overflow-hidden">
                        <div
                            className={`h-full ${style.iconBg.replace(
                                "/10",
                                ""
                            )} transition-all`}
                            style={{
                                animation: `shrink ${autoClose}ms linear forwards`,
                            }}
                        />
                    </div>
                )}
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `,
                }}
            />
        </div>
    );
}

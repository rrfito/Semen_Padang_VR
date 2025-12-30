import React from "react";

/**
 * Reusable Confirmation Modal
 * Replaces browser confirm() with better UX
 */
export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Konfirmasi Tindakan",
    message,
    confirmText = "Konfirmasi",
    cancelText = "Batal",
    variant = "danger", // 'danger' | 'warning' | 'info'
}) {
    if (!isOpen) return null;

    const variants = {
        danger: {
            icon: "warning",
            iconColor: "text-red-400",
            iconBg: "bg-red-500/10",
            buttonBg: "bg-red-500 hover:bg-red-600",
        },
        warning: {
            icon: "info",
            iconColor: "text-amber-400",
            iconBg: "bg-amber-500/10",
            buttonBg: "bg-amber-500 hover:bg-amber-600",
        },
        info: {
            icon: "help",
            iconColor: "text-blue-400",
            iconBg: "bg-blue-500/10",
            buttonBg: "bg-blue-500 hover:bg-blue-600",
        },
    };

    const style = variants[variant] || variants.info;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-border-dark animate-in fade-in zoom-in duration-200">
                {/* Header with Icon */}
                <div className="p-6 flex items-start gap-4">
                    <div
                        className={`size-12 flex items-center justify-center rounded-xl ${style.iconBg} ${style.iconColor} shrink-0`}
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {style.icon}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {title}
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                            {message}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-[#111a22] border-t border-gray-200 dark:border-border-dark flex items-center justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-6 py-2 text-white font-bold rounded-lg transition-all shadow-lg ${style.buttonBg}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

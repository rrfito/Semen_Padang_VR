import React, { useState } from "react";
import PendingChangesModal from "../Modals/PendingChangesModal";
import ConformModal from "@/Components/Editor/ConfirmModal";
import axios from "axios";
import { useTheme } from "@/Contexts/ThemeContext";
import { router } from "@inertiajs/react";

export default function Header({
    breadcrumbs = [],
    saveStatus = "idle",
    pendingCount = 0,
    onOpenReview,
    rootId, // New Prop
}) {
    const { theme, toggleTheme, isDark } = useTheme();

    // Discard Logic
    const [confirmDiscard, setConfirmDiscard] = useState({ isOpen: false });

    const handleDiscard = async () => {
        if (!rootId) {
            alert("Kesalahan: Root ID tidak ditemukan.");
            return;
        }

        try {
            await axios.post(route("admin.editor.discard-all", rootId));
            // Reload page to fetch fresh data
            window.location.reload();
        } catch (error) {
            console.error("Discard failed", error);
            alert("Gagal membuang perubahan. Lihat konsol.");
        } finally {
            setConfirmDiscard({ isOpen: false });
        }
    };

    return (
        <header className="h-16 shrink-0 flex items-center justify-between border-b theme-border px-6 theme-surface z-20 font-display">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
                <img
                    src="/image/LOGO PT SEMEN PADANG.png"
                    alt="Semen Padang Logo"
                    className="h-10 w-auto object-contain"
                />
                <div>
                    <h2 className="text-sm font-bold leading-tight tracking-wide uppercase text-slate-500 dark:text-slate-400">
                        PT Semen Padang
                    </h2>
                    <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                        Admin Street View
                    </h1>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 theme-surface rounded-lg border theme-border">
                <span className="material-symbols-outlined theme-text-muted text-[20px]">
                    home
                </span>
                {breadcrumbs.length > 0 && (
                    <span className="theme-text-muted">/</span>
                )}

                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                        <span
                            className={`text-sm font-bold ${
                                index === breadcrumbs.length - 1
                                    ? "theme-text"
                                    : "theme-text-muted hover:text-action-primary cursor-pointer transition-colors"
                            }`}
                        >
                            {crumb.name}
                        </span>
                        {index < breadcrumbs.length - 1 && (
                            <span className="theme-text-muted">/</span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Auto-save Status Indicator */}
                {saveStatus !== "idle" && (
                    <div className="flex items-center gap-2 text-sm">
                        {saveStatus === "saving" && (
                            <>
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <span className="text-slate-400">
                                    💾 Menyimpan...
                                </span>
                            </>
                        )}
                        {saveStatus === "saved" && (
                            <>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-slate-400">
                                    ✓ Semua perubahan disimpan
                                </span>
                            </>
                        )}
                        {saveStatus === "error" && (
                            <>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-red-400">
                                    ⚠️ Gagal menyimpan
                                </span>
                            </>
                        )}
                    </div>
                )}

                {/* Review Changes Button */}
                <button
                    onClick={onOpenReview}
                    className={`theme-btn-submit transition-all flex items-center gap-2 ${
                        pendingCount > 0
                            ? "bg-primary hover:bg-primary/90 text-white border-primary shadow-lg shadow-primary/25 animate-[pulse_3s_ease-in-out_infinite]"
                            : "bg-slate-100 dark:bg-[#233648] text-text-secondary-light dark:text-text-secondary-dark border-border-light dark:border-border-dark hover:bg-slate-200 dark:hover:bg-[#2f455a]"
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">
                        {pendingCount > 0 ? "publish" : "check_circle"}
                    </span>
                    <span>
                        {pendingCount > 0
                            ? `Tinjau ${pendingCount} Perubahan`
                            : "Semua Tersinkronisasi"}
                    </span>
                </button>

                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="size-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#233648] hover:bg-gray-200 dark:hover:bg-[#2f455a] text-gray-600 dark:text-slate-300 transition-all border border-gray-200 dark:border-transparent"
                    title={
                        isDark
                            ? "Beralih ke Mode Terang"
                            : "Beralih ke Mode Gelap"
                    }
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {isDark ? "light_mode" : "dark_mode"}
                    </span>
                </button>

                <div className="h-8 w-px bg-border-light dark:bg-border-dark mx-1"></div>
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div
                        className="bg-center bg-no-repeat bg-cover rounded-full size-9 ring-2 ring-transparent group-hover:ring-primary/50 transition-all bg-slate-700"
                        style={{
                            backgroundImage:
                                "url('https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff')",
                        }}
                    ></div>
                </div>
            </div>
            {/* Pending Changes Modal passed Root ID */}
            <PendingChangesModal
            // Logic to handle open/close is usually here?
            // Wait, Header logic for rendering PendingChangesModal was:
            // <PendingChangesModal ... /> was NOT here in previous file view (Step 1849).
            // It was imported but I didn't see it rendered in the return block in Step 1849.
            // Ah, it WAS imported, but looking at Step 1880 (VisualEditor), VisualEditor invokes <Header /> and manages `showPendingChanges` state.
            // VisualEditor renders `PendingChangesModal` conditionally?
            // Let's check `VisualEditor.jsx` again.
            // If VisualEditor renders it, then I need to update VisualEditor to pass rootId to Modal, not Header.
            />
        </header>
    );
}

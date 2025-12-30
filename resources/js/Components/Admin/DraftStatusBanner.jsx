import React from "react";

export default function DraftStatusBanner({
    areaCount = 0,
    sceneCount = 0,
    linkCount = 0,
    isSynced = false,
    lastEdited = "Just now",
}) {
    // STATE: ALL SYNCED (Clean)
    if (isSynced) {
        return (
            <div className="rounded-xl theme-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden group font-display border-l-4 border-emerald-500">
                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>

                <div className="flex items-center gap-5 z-10">
                    <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg border border-emerald-500/20">
                        <span className="material-symbols-outlined text-[28px]">
                            check_circle
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="theme-text text-lg font-bold flex items-center gap-2">
                            Semua Data Tersinkronisasi
                        </h3>
                        <p className="theme-text-secondary text-sm font-medium">
                            Data live sudah terbaru. Tidak ada draf tertunda.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // STATE: PENDING CHANGES (Dirty)
    return (
        <div className="rounded-xl theme-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg relative overflow-hidden group font-display">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
            <div className="absolute inset-0 bg-amber-500/5 pointer-events-none"></div>

            <div className="flex items-center gap-5 z-10">
                <div className="bg-amber-500/10 text-amber-500 p-3 rounded-lg border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    <span className="material-symbols-outlined text-[28px]">
                        published_with_changes
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <h3 className="theme-text text-lg font-bold flex items-center gap-2">
                        Perubahan Draf Tertunda
                        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    </h3>
                    <p className="theme-text-secondary text-sm font-medium">
                        {areaCount} Area • {sceneCount} Scene • {linkCount} Link
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 z-10 bg-slate-100 dark:bg-[#111a22]/60 px-4 py-2.5 rounded-lg theme-border border backdrop-blur-sm">
                <span className="material-symbols-outlined text-[18px] theme-text-secondary">
                    schedule
                </span>
                <span className="text-sm font-medium theme-text-secondary">
                    Terakhir diedit: {lastEdited}
                </span>
            </div>
        </div>
    );
}

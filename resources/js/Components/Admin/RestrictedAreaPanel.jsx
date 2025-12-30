import React from "react";
import { Link } from "@inertiajs/react";

export default function RestrictedAreaPanel({ areas = [] }) {
    return (
        <div className="lg:col-span-2 rounded-xl theme-card p-6 flex flex-col h-full font-display">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="theme-text text-lg font-bold">
                        Area Terbatas
                    </h3>
                    <p className="theme-text-secondary text-sm">
                        Kontrol Akses &amp; Pemantauan
                    </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500">
                        lock
                    </span>
                    <span className="text-red-500 font-bold text-sm">
                        Total: {areas.length} Area
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 max-h-[250px] pr-2">
                {areas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center theme-text-secondary">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                            lock_open
                        </span>
                        <p>Tidak ada area terbatas ditemukan.</p>
                    </div>
                ) : (
                    areas.map((area, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#111a22]/50 border theme-border rounded-lg hover:bg-slate-100 dark:hover:bg-[#111a22] transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-red-500/10 text-red-500 p-2 rounded-lg">
                                    <span className="material-symbols-outlined text-[20px]">
                                        lock
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="theme-text font-medium text-sm">
                                        {area.name}
                                    </h4>
                                    {area.description && (
                                        <p className="theme-text-secondary text-xs truncate max-w-[200px]">
                                            {area.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Link
                                href={route("admin.editor.index", {
                                    focus: `area:${area.id}`,
                                })}
                                className="theme-text-secondary hover:theme-text hover:bg-slate-200 dark:hover:bg-[#324d67] p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium border border-transparent hover:border-slate-300 dark:hover:border-[#324d67]"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    visibility
                                </span>
                                <span className="hidden sm:inline">
                                    Lihat Detail
                                </span>
                            </Link>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-4 border-t theme-border flex justify-center">
                <Link
                    href={route("admin.editor.index")}
                    className="text-primary text-sm font-medium hover:text-primary-hover flex items-center gap-1 transition-colors"
                >
                    Lihat Semua Area Terbatas
                    <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                    </span>
                </Link>
            </div>
        </div>
    );
}

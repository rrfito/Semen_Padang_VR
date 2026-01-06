import React from "react";
import { Link } from "@inertiajs/react";

export default function VisibilityAreaPanel({ areas = [] }) {
    return (
        <div className="rounded-xl theme-card p-6 flex flex-col h-full font-display">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="theme-text text-lg font-bold">
                        Disembunyikan
                    </h3>
                    <p className="theme-text-secondary text-xs">
                        Tidak terlihat di tampilan depan.
                    </p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-500 text-[18px]">
                        visibility_off
                    </span>
                    <span className="text-purple-500 font-bold text-sm">
                        {areas.length}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1 max-h-[200px] pr-2">
                {areas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-center theme-text-secondary">
                        <span className="material-symbols-outlined text-2xl mb-1 opacity-50 text-purple-500">
                            visibility
                        </span>
                        <p className="text-xs">Tidak ada area disembunyikan.</p>
                    </div>
                ) : (
                    areas.map((area, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#111a22]/50 border theme-border rounded-lg hover:bg-slate-100 dark:hover:bg-[#111a22] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-500/10 text-purple-500 p-2 rounded-lg">
                                    <span className="material-symbols-outlined text-[18px]">
                                        visibility_off
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="theme-text font-medium text-sm">
                                        {area.name}
                                    </h4>
                                    {area.description && (
                                        <p className="theme-text-secondary text-xs truncate max-w-[150px]">
                                            {area.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Link
                                href={route("admin.editor.index", {
                                    focus: `area:${area.draft_id || area.id}`,
                                })}
                                className="theme-text-secondary hover:theme-text p-2 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    edit
                                </span>
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

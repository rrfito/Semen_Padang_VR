import React from "react";
import { Link } from "@inertiajs/react";

export default function RestrictedAreaPanel() {
    // Static data matching HTML for now
    const areas = [
        { id: 1, name: "Ruang Unit ICT", icon: "lock", type: "restricted" },
        { id: 2, name: "Storage Facility B", icon: "lock", type: "restricted" },
        {
            id: 3,
            name: "Server Room Access",
            icon: "lock",
            type: "restricted",
            action: "view",
        },
        {
            id: 4,
            name: "Executive Wing",
            icon: "info",
            type: "review",
            status: "Under Review",
            action: "edit",
        },
    ];

    return (
        <div className="lg:col-span-2 rounded-xl theme-card p-6 flex flex-col h-full font-display">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="theme-text text-lg font-bold">
                        Restricted Areas
                    </h3>
                    <p className="theme-text-secondary text-sm">
                        Access Control &amp; Monitoring
                    </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500">
                        lock
                    </span>
                    <span className="text-red-500 font-bold text-sm">
                        Total: 5 Areas
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 max-h-[250px] pr-2">
                {areas.map((area, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#111a22]/50 border theme-border rounded-lg hover:bg-slate-100 dark:hover:bg-[#111a22] transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`${
                                    area.type === "restricted"
                                        ? "bg-red-500/10 text-red-500"
                                        : "bg-blue-500/10 text-blue-500"
                                } p-2 rounded-lg`}
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {area.icon}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="theme-text font-medium text-sm">
                                    {area.name}
                                </h4>
                                {area.status && (
                                    <p className="theme-text-secondary text-xs">
                                        {area.status}
                                    </p>
                                )}
                            </div>
                        </div>

                        {area.action === "view" && (
                            <button className="theme-text-secondary hover:theme-text hover:bg-slate-200 dark:hover:bg-[#324d67] p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium border border-transparent hover:border-slate-300 dark:hover:border-[#324d67]">
                                <span className="material-symbols-outlined text-[18px]">
                                    visibility
                                </span>
                                <span className="hidden sm:inline">
                                    View Details
                                </span>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t theme-border flex justify-center">
                <Link
                    href="#"
                    className="text-primary text-sm font-medium hover:text-primary-hover flex items-center gap-1 transition-colors"
                >
                    View All Restricted Areas
                    <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                    </span>
                </Link>
            </div>
        </div>
    );
}

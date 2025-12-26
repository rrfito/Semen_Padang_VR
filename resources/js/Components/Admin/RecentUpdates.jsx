import React from "react";

export default function RecentUpdates() {
    return (
        <div className="rounded-xl theme-card p-6 flex flex-col gap-4 font-display">
            <h3 className="theme-text text-lg font-bold">Recent Updates</h3>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {/* Item 1: Update */}
                <div className="flex gap-3 items-start">
                    <div className="bg-primary/20 text-primary p-2 rounded-lg mt-1">
                        <span className="material-symbols-outlined text-[18px]">
                            edit
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <p className="theme-text text-sm font-medium">
                            Update Area : Pabrik Indarung 2
                        </p>
                        <p className="theme-text-secondary text-xs">
                            Area updated by Admin
                        </p>
                        <p className="theme-text-secondary text-[10px] mt-1">
                            2 mins ago
                        </p>
                    </div>
                </div>

                {/* Item 2: Add */}
                <div className="flex gap-3 items-start">
                    <div className="bg-green-500/20 text-green-500 p-2 rounded-lg mt-1">
                        <span className="material-symbols-outlined text-[18px]">
                            add_circle
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <p className="theme-text text-sm font-medium">
                            New Area: Kantor Pusat
                        </p>
                        <p className="theme-text-secondary text-xs">
                            Added by SuperAdmin
                        </p>
                        <p className="theme-text-secondary text-[10px] mt-1">
                            1 hour ago
                        </p>
                    </div>
                </div>

                {/* Item 3: Delete */}
                <div className="flex gap-3 items-start">
                    <div className="bg-red-500/20 text-red-500 p-2 rounded-lg mt-1">
                        <span className="material-symbols-outlined text-[18px]">
                            delete_forever
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <p className="theme-text text-sm font-medium">
                            Delete Scene : Ruang Rapat Planner
                        </p>
                        <p className="theme-text-secondary text-xs">
                            Scene Deleted by fito
                        </p>
                        <p className="theme-text-secondary text-[10px] mt-1">
                            3 hours ago
                        </p>
                    </div>
                </div>

                {/* Item 4: Link */}
                <div className="flex gap-3 items-start">
                    <div className="bg-green-500/20 text-green-500 p-2 rounded-lg mt-1">
                        <span className="material-symbols-outlined text-[18px]">
                            add_circle
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <p className="theme-text text-sm font-medium">
                            New Link : Scene Pintu Ruang Rapat Planner
                        </p>
                        <p className="theme-text-secondary text-xs">
                            Scene linked by Admin
                        </p>
                        <p className="theme-text-secondary text-[10px] mt-1">
                            Yesterday
                        </p>
                    </div>
                </div>
            </div>
            <button className="w-full py-2 text-sm text-primary font-bold hover:bg-slate-100 dark:hover:bg-[#111a22] rounded-lg transition-colors mt-auto">
                View All Activity
            </button>
        </div>
    );
}

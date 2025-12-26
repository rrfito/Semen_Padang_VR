import React from "react";

export default function DashboardStats({
    totalAreas = 42,
    totalScenes = 156,
    totalLinks = 320,
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-display">
            {/* Areas Card */}
            <div className="flex flex-col gap-3 rounded-xl p-6 theme-card shadow-lg">
                <div className="flex items-center justify-between">
                    <p className="theme-text-secondary text-sm font-medium">
                        Total Areas
                    </p>
                    <span className="material-symbols-outlined text-primary">
                        location_on
                    </span>
                </div>
                <div className="flex items-end gap-3">
                    <p className="theme-text text-3xl font-bold leading-tight">
                        {totalAreas}
                    </p>
                </div>
            </div>

            {/* Scenes Card */}
            <div className="flex flex-col gap-3 rounded-xl p-6 theme-card shadow-lg">
                <div className="flex items-center justify-between">
                    <p className="theme-text-secondary text-sm font-medium">
                        Total Scenes
                    </p>
                    <span className="material-symbols-outlined text-primary">
                        panorama_photosphere
                    </span>
                </div>
                <div className="flex items-end gap-3">
                    <p className="theme-text text-3xl font-bold leading-tight">
                        {totalScenes}
                    </p>
                </div>
            </div>

            {/* Links Card */}
            <div className="flex flex-col gap-3 rounded-xl p-6 theme-card shadow-lg">
                <div className="flex items-center justify-between">
                    <p className="theme-text-secondary text-sm font-medium">
                        Total Links
                    </p>
                    <span className="material-symbols-outlined text-primary">
                        link
                    </span>
                </div>
                <div className="flex items-end gap-3">
                    <p className="theme-text text-3xl font-bold leading-tight">
                        {totalLinks}
                    </p>
                </div>
            </div>
        </div>
    );
}

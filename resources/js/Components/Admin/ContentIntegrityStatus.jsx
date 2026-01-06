import React from "react";
import {
    FaHeartbeat,
    FaExclamationTriangle,
    FaUnlink,
    FaMapMarkerAlt,
    FaSync,
} from "react-icons/fa";
import { MdLocationOff } from "react-icons/md";

export default function ContentIntegrityStatus({ stats }) {
    const {
        draftMismatch,
        orphanScenes,
        brokenLinks,
        scenesWithoutGps,
        areasWithoutGps,
    } = stats;

    const MetricItem = ({ label, count, icon: Icon, colorClass, helpText }) => {
        // Determine severity color based on count
        // Default (Success/Good State) - Emerald/Green
        let baseClasses =
            "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";

        if (count > 0) {
            if (colorClass === "danger") {
                // Critical - Red
                baseClasses =
                    "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20";
            } else if (colorClass === "warning") {
                // Warning - Orange
                baseClasses =
                    "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20";
            } else if (colorClass === "info") {
                // Info - Blue
                baseClasses =
                    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
            }
        }

        return (
            <div
                className={`flex items-center justify-between p-3 rounded-lg border ${baseClasses} transition-all`}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full shadow-sm bg-white/50 dark:bg-black/20">
                        <Icon size={16} />
                    </div>
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-90">
                            {label}
                        </div>
                        <div className="text-[10px] opacity-75 leading-tight">
                            {helpText}
                        </div>
                    </div>
                </div>
                <div className="text-xl font-black">{count}</div>
            </div>
        );
    };

    return (
        <div className="theme-card p-5 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="theme-text text-lg font-bold">
                        Integritas Konten
                    </h3>
                    <p className="theme-text-secondary text-sm">
                        Status kesehatan dan integritas konten saat ini.
                    </p>
                </div>
            </div>

            <div className="flex-1 space-y-3">
                <MetricItem
                    label="Scene Terisolasi"
                    count={orphanScenes}
                    icon={FaExclamationTriangle}
                    colorClass="danger"
                    helpText="Scene tidak dapat dijangkau"
                />

                <MetricItem
                    label="Link Rusak"
                    count={brokenLinks}
                    icon={FaUnlink}
                    colorClass="danger"
                    helpText="Target tidak valid"
                />

                <MetricItem
                    label="Scene Tanpa GPS"
                    count={scenesWithoutGps}
                    icon={FaMapMarkerAlt}
                    colorClass="warning"
                    helpText="Data lokasi scene tidak ada"
                />

                <MetricItem
                    label="Area Tanpa GPS"
                    count={areasWithoutGps}
                    icon={MdLocationOff}
                    colorClass="info"
                    helpText="Data lokasi area tidak ada"
                />
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 text-center">
                Diagnostik Kesehatan Sistem
            </div>
        </div>
    );
}

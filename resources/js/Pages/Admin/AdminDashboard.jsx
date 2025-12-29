import React from "react";
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import DashboardStats from "@/Components/Admin/DashboardStats";
import DraftStatusBanner from "@/Components/Admin/DraftStatusBanner";
import RestrictedAreaPanel from "@/Components/Admin/RestrictedAreaPanel";
import ContentIntegrityStatus from "@/Components/Admin/ContentIntegrityStatus";

export default function AdminDashboard({
    stats,
    draftStats,
    integrityStats,
    restrictedAreas,
}) {
    return (
        <AdminLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* 1. DRAFT STATUS BANNER */}
                <DraftStatusBanner
                    areaCount={draftStats.areaCount}
                    sceneCount={draftStats.sceneCount}
                    linkCount={draftStats.linkCount}
                    isSynced={draftStats.isSynced}
                    lastEdited={draftStats.lastEdited}
                />

                {/* 2. STATS CARDS */}
                <DashboardStats
                    totalAreas={stats.totalAreas}
                    totalScenes={stats.totalScenes}
                    totalLinks={stats.totalLinks}
                />

                {/* 3. MAIN DASHBOARD CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT: Restricted Areas List */}
                    <div className="lg:col-span-2">
                        <RestrictedAreaPanel areas={restrictedAreas} />
                    </div>

                    {/* RIGHT: Content Integrity Status */}
                    <div className="lg:col-span-1">
                        <ContentIntegrityStatus stats={integrityStats} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

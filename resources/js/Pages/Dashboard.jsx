import React from "react";
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import DashboardStats from "@/Components/Admin/DashboardStats";
import DraftStatusBanner from "@/Components/Admin/DraftStatusBanner";
import RestrictedAreaPanel from "@/Components/Admin/RestrictedAreaPanel";
import RecentUpdates from "@/Components/Admin/RecentUpdates";

export default function Dashboard() {
    return (
        <AdminLayout headerTitle="Street View Admin">
            <Head title="Admin Dashboard" />

            <div className="flex flex-col gap-6">
                {/* Draft Status Banner */}
                <DraftStatusBanner />

                {/* Statistics Cards */}
                <DashboardStats />

                {/* Bottom Section: Restricted Areas & Updates */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <RestrictedAreaPanel />
                    <RecentUpdates />
                </div>
            </div>
        </AdminLayout>
    );
}

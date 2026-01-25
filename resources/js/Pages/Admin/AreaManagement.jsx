import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";

export default function AreaManagement({ areas, admins, filters }) {
    const [search, setSearch] = useState(filters?.search || "");
    const [sortField, setSortField] = useState(filters?.sort_field || "name");
    const [sortDirection, setSortDirection] = useState(
        filters?.sort_direction || "asc",
    );

    const [showModal, setShowModal] = useState(false);
    const [selectedArea, setSelectedArea] = useState(null);
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [saving, setSaving] = useState(false);

    const isFirstRun = useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            router.get(
                route("admin.area-management"),
                {
                    search,
                    sort_field: sortField,
                    sort_direction: sortDirection,
                },
                { preserveState: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, sortField, sortDirection]);

    const handleSort = (field) => {
        let newDirection = "asc";
        if (sortField === field && sortDirection === "asc") {
            newDirection = "desc";
        }
        setSortField(field);
        setSortDirection(newDirection);
    };

    const getSortIcon = (field) => {
        if (sortField !== field) return "unfold_more";
        return sortDirection === "asc" ? "expand_less" : "expand_more";
    };

    const openOwnerModal = (area) => {
        setSelectedArea(area);
        setSelectedOwner(area.created_by);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedArea(null);
        setSelectedOwner(null);
    };

    const saveOwner = () => {
        if (!selectedArea) return;
        setSaving(true);

        router.put(
            route("admin.area.update-owner", selectedArea.id),
            { created_by: selectedOwner },
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                },
                onFinish: () => {
                    setSaving(false);
                },
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="Manajemen Area" />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="theme-text text-xl font-bold">
                            Manajemen Area
                        </h2>
                        <p className="theme-text-secondary text-sm">
                            Kelola kepemilikan area (Level 1) untuk semua admin.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari area..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#111a22] border theme-border rounded-lg focus:ring-2 focus:ring-primary/20 theme-text w-full sm:w-64"
                            />
                            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] theme-text-secondary">
                                search
                            </span>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#111a22] px-4 py-2 rounded-lg border theme-border">
                            <span className="material-symbols-outlined theme-text-secondary text-[20px]">
                                map
                            </span>
                            <span className="theme-text text-sm font-bold">
                                Total: {areas.total}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="theme-card rounded-xl border theme-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b theme-border bg-slate-50/50 dark:bg-[#1b2631]/50">
                                    <th
                                        className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary cursor-pointer hover:theme-text transition-colors select-none"
                                        onClick={() => handleSort("name")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Nama Area
                                            <span className="material-symbols-outlined text-[16px]">
                                                {getSortIcon("name")}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary">
                                        Pemilik
                                    </th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                                {areas.data.map((area) => (
                                    <tr
                                        key={area.id}
                                        className="hover:bg-slate-50 dark:hover:bg-[#1b2631] transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-amber-500">
                                                        domain
                                                    </span>
                                                </div>
                                                <span className="theme-text font-medium text-sm">
                                                    {area.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="theme-text font-medium text-sm">
                                                {area.creator_name}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() =>
                                                    openOwnerModal(area)
                                                }
                                                className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">
                                                    swap_horiz
                                                </span>
                                                Transfer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {areas.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="p-8 text-center theme-text-secondary"
                                        >
                                            Tidak ada area ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {areas.last_page > 1 && (
                        <div className="border-t theme-border p-4 flex items-center justify-between bg-slate-50/50 dark:bg-[#1b2631]/50">
                            <div className="text-sm theme-text-secondary">
                                Menampilkan {areas.from} sampai {areas.to} dari{" "}
                                {areas.total} area
                            </div>
                            <div className="flex gap-1">
                                {areas.links.map((link, i) => {
                                    let label = link.label;
                                    if (label.includes("Previous")) label = "«";
                                    else if (label.includes("Next"))
                                        label = "»";

                                    return link.url ? (
                                        <button
                                            key={i}
                                            onClick={() =>
                                                router.get(
                                                    link.url,
                                                    {},
                                                    { preserveState: true },
                                                )
                                            }
                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                                link.active
                                                    ? "bg-primary text-white"
                                                    : "bg-white dark:bg-[#233648] theme-text border theme-border hover:bg-slate-100 dark:hover:bg-[#2a4055]"
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="px-3 py-1 text-xs rounded-md text-slate-400 border theme-border opacity-50"
                                            dangerouslySetInnerHTML={{
                                                __html: label,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Owner Modal */}
            {showModal && selectedArea && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="theme-modal w-full max-w-md overflow-hidden">
                        <div className="theme-modal-header flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold theme-text">
                                    Transfer Pemilik
                                </h3>
                                <p className="text-sm theme-text-secondary mt-1">
                                    {selectedArea.name}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="theme-text-subtle hover:text-action-primary"
                            >
                                <span className="material-symbols-outlined">
                                    close
                                </span>
                            </button>
                        </div>

                        <div className="p-4 max-h-[300px] overflow-y-auto">
                            <div className="flex flex-col gap-2">
                                {/* Admin options */}
                                {admins.map((admin) => (
                                    <label
                                        key={admin.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                                            selectedOwner === admin.id
                                                ? "border-primary bg-primary/5"
                                                : "border-transparent hover:bg-slate-100 dark:hover:bg-[#1b2631]"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="owner"
                                            checked={selectedOwner === admin.id}
                                            onChange={() =>
                                                setSelectedOwner(admin.id)
                                            }
                                            className="w-4 h-4 text-primary"
                                        />
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#233648] flex items-center justify-center font-bold theme-text text-sm">
                                                {admin.name.charAt(0)}
                                            </div>
                                            <span className="theme-text font-medium text-sm">
                                                {admin.name}
                                            </span>
                                        </div>
                                        {selectedArea.created_by ===
                                            admin.id && (
                                            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 rounded theme-text-secondary">
                                                Saat ini
                                            </span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="theme-modal-footer flex justify-end gap-2">
                            <button
                                onClick={closeModal}
                                className="theme-btn-secondary"
                                disabled={saving}
                            >
                                Batal
                            </button>
                            <button
                                onClick={saveOwner}
                                disabled={saving}
                                className="theme-btn-primary disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

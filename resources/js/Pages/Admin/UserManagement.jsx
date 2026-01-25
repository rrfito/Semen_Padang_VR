import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, Link, usePage } from "@inertiajs/react";

export default function UserManagement({ users, filters }) {
    const { props } = usePage();
    const currentUser = props.auth?.user;

    const [search, setSearch] = useState(filters?.search || "");
    const [sortField, setSortField] = useState(filters?.sort_field || "name");
    const [sortDirection, setSortDirection] = useState(
        filters?.sort_direction || "asc",
    );
    // Add status state for tabs
    const [status, setStatus] = useState(filters?.status || "active");

    // State for owned areas modal
    const [showAreasModal, setShowAreasModal] = useState(false);
    const [selectedUserAreas, setSelectedUserAreas] = useState(null);

    // State for transfer super-admin modal
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferTargetUser, setTransferTargetUser] = useState(null);
    const [transferring, setTransferring] = useState(false);

    const isFirstRun = useRef(true);

    // Native Debounce for Search and Sorting
    useEffect(() => {
        // Skip the first render to avoid double fetching on page load
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            router.get(
                route("admin.user-management"),
                {
                    search: search,
                    sort_field: sortField,
                    sort_direction: sortDirection,
                    status: status, // Include status in query
                },
                { preserveState: true, replace: true },
            );
        }, 300); // 300ms delay

        return () => clearTimeout(timeoutId);
    }, [search, sortField, sortDirection, status]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleSort = (field) => {
        let newDirection = "asc";
        if (sortField === field && sortDirection === "asc") {
            newDirection = "desc";
        }
        setSortField(field);
        setSortDirection(newDirection);
    };

    const handleTabChange = (newStatus) => {
        setStatus(newStatus);
        setSearch(""); // Reset search on tab change
    };

    const handleRoleChange = (
        userId,
        newRole,
        userName,
        ownedAreasCount = 0,
    ) => {
        // Intercept super_admin selection - show transfer modal instead
        if (newRole === "super_admin") {
            setTransferTargetUser({
                id: userId,
                name: userName,
                owned_areas_count: ownedAreasCount,
            });
            setShowTransferModal(true);
            return;
        }

        router.put(
            route("admin.users.update-role", userId),
            { role: newRole },
            { preserveScroll: true },
        );
    };

    const handleTransferSuperAdmin = () => {
        if (!transferTargetUser) return;
        setTransferring(true);

        router.post(
            route("admin.transfer-super-admin", transferTargetUser.id),
            {},
            {
                onFinish: () => {
                    setTransferring(false);
                    setShowTransferModal(false);
                    setTransferTargetUser(null);
                },
            },
        );
    };

    const approveUser = (userId, role) => {
        if (confirm("Setujui pengguna ini?")) {
            router.post(
                route("admin.users.approve", userId),
                { role: role },
                { preserveScroll: true },
            );
        }
    };

    const rejectUser = (userId) => {
        if (confirm("Tolak permintaan pengguna ini?")) {
            router.post(
                route("admin.users.reject", userId),
                {},
                { preserveScroll: true },
            );
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "super_admin":
                return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "admin":
                return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "pegawai":
                return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        }
    };

    const getSortIcon = (field) => {
        if (sortField !== field) return "unfold_more";
        return sortDirection === "asc" ? "expand_less" : "expand_more";
    };

    return (
        <AdminLayout>
            <Head title="User Management" />

            <div className="flex flex-col gap-6">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="theme-text text-xl font-bold">
                            Manajemen Pengguna
                        </h2>
                        <p className="theme-text-secondary text-sm">
                            Kelola akses pengguna, peran, dan persetujuan.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari pengguna..."
                                value={search}
                                onChange={handleSearch}
                                className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#111a22] border theme-border rounded-lg focus:ring-2 focus:ring-primary/20 theme-text w-full sm:w-64"
                            />
                            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] theme-text-secondary">
                                search
                            </span>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#111a22] px-4 py-2 rounded-lg border theme-border">
                            <span className="material-symbols-outlined theme-text-secondary text-[20px]">
                                group
                            </span>
                            <span className="theme-text text-sm font-bold">
                                Total: {users.total}
                            </span>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-2 border-b theme-border">
                    <button
                        onClick={() => handleTabChange("active")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            status === "active"
                                ? "border-primary text-primary"
                                : "border-transparent theme-text-secondary hover:theme-text"
                        }`}
                    >
                        Pengguna Aktif
                    </button>
                    <button
                        onClick={() => handleTabChange("pending")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            status === "pending"
                                ? "border-amber-500 text-amber-500" // Use amber/orange for pending attention
                                : "border-transparent theme-text-secondary hover:theme-text"
                        }`}
                    >
                        Menunggu Persetujuan
                    </button>
                    <button
                        onClick={() => handleTabChange("rejected")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            status === "rejected"
                                ? "border-red-500 text-red-500"
                                : "border-transparent theme-text-secondary hover:theme-text"
                        }`}
                    >
                        Ditolak
                    </button>
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
                                            Pengguna
                                            <span className="material-symbols-outlined text-[16px]">
                                                {getSortIcon("name")}
                                            </span>
                                        </div>
                                    </th>

                                    {status === "active" && (
                                        <th
                                            className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary cursor-pointer hover:theme-text transition-colors select-none"
                                            onClick={() => handleSort("role")}
                                        >
                                            <div className="flex items-center gap-1">
                                                Peran
                                                <span className="material-symbols-outlined text-[16px]">
                                                    {getSortIcon("role")}
                                                </span>
                                            </div>
                                        </th>
                                    )}

                                    {status === "pending" && (
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary">
                                            Peran
                                        </th>
                                    )}

                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary">
                                        {status === "active"
                                            ? "Aktivitas Terakhir"
                                            : "Terdaftar Pada"}
                                    </th>

                                    {status === "active" && (
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary text-center">
                                            Kepemilikan Area
                                        </th>
                                    )}

                                    {status === "pending" && (
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary text-right">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                                {users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-slate-50 dark:hover:bg-[#1b2631] transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#233648] flex items-center justify-center font-bold theme-text text-sm">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="theme-text font-medium text-sm">
                                                        {user.name}
                                                    </span>
                                                    <span className="theme-text-secondary text-xs">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {status === "active" && (
                                            <td className="p-4">
                                                <div className="relative inline-block text-left">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) =>
                                                            handleRoleChange(
                                                                user.id,
                                                                e.target.value,
                                                                user.name,
                                                                user.owned_areas_count,
                                                            )
                                                        }
                                                        className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none ${getRoleBadgeColor(
                                                            user.role,
                                                        )} bg-transparent`}
                                                    >
                                                        {currentUser?.role ===
                                                            "super_admin" && (
                                                            <option
                                                                value="super_admin"
                                                                className="text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111a22]"
                                                            >
                                                                Super Admin
                                                            </option>
                                                        )}
                                                        <option
                                                            value="admin"
                                                            className="text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111a22]"
                                                        >
                                                            Admin
                                                        </option>
                                                        <option
                                                            value="pegawai"
                                                            className="text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111a22]"
                                                        >
                                                            Pegawai
                                                        </option>
                                                    </select>
                                                </div>
                                            </td>
                                        )}

                                        {status === "pending" && (
                                            <td className="p-4">
                                                {/* Pre-assign role before approving */}
                                                <div className="relative inline-block text-left">
                                                    <select
                                                        defaultValue={"pegawai"}
                                                        id={`role-${user.id}`}
                                                        onChange={(e) => {
                                                            // Force update to refresh class (simple hack or use state)
                                                            e.target.className = `appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border theme-border bg-white dark:bg-[#111a22] transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none ${getRoleBadgeColor(
                                                                e.target.value,
                                                            )}`;
                                                            // For pending users, we don't need transfer warnings yet as they are not admins yet
                                                        }}
                                                        className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none ${getRoleBadgeColor(
                                                            "pegawai",
                                                        )} bg-transparent`}
                                                    >
                                                        <option
                                                            value="admin"
                                                            className="text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111a22]"
                                                        >
                                                            Admin
                                                        </option>
                                                        <option
                                                            value="pegawai"
                                                            className="text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111a22]"
                                                        >
                                                            Pegawai
                                                        </option>
                                                    </select>
                                                </div>
                                            </td>
                                        )}

                                        <td className="p-4">
                                            <div className="flex items-center gap-2 theme-text-secondary text-sm">
                                                <span className="material-symbols-outlined text-[16px]">
                                                    {status === "active"
                                                        ? "history"
                                                        : "calendar_today"}
                                                </span>
                                                <span>
                                                    {status === "active"
                                                        ? user.last_activity
                                                        : user.created_at}
                                                </span>
                                            </div>
                                        </td>

                                        {status === "active" && (
                                            <td className="p-4 text-center">
                                                {user.role === "admin" ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUserAreas(
                                                                {
                                                                    name: user.name,
                                                                    areas:
                                                                        user.owned_areas ||
                                                                        [],
                                                                },
                                                            );
                                                            setShowAreasModal(
                                                                true,
                                                            );
                                                        }}
                                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 mx-auto theme-text"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">
                                                            visibility
                                                        </span>
                                                        {user.owned_areas_count ||
                                                            0}{" "}
                                                        area
                                                    </button>
                                                ) : (
                                                    <span className="theme-text-secondary text-xs">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        )}

                                        {status === "pending" && (
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            approveUser(
                                                                user.id,
                                                                document.getElementById(
                                                                    `role-${user.id}`,
                                                                ).value,
                                                            )
                                                        }
                                                        className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">
                                                            check
                                                        </span>
                                                        Terima
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            rejectUser(user.id)
                                                        }
                                                        className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">
                                                            close
                                                        </span>
                                                        Tolak
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="p-8 text-center theme-text-secondary"
                                        >
                                            Tidak ada pengguna ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="border-t theme-border p-4 flex items-center justify-between bg-slate-50/50 dark:bg-[#1b2631]/50">
                        <div className="text-sm theme-text-secondary">
                            Menampilkan {users.from} sampai {users.to} dari{" "}
                            {users.total} pengguna
                        </div>
                        <div className="flex gap-1">
                            {users.links.map((link, i) => {
                                let label = link.label;
                                if (label.includes("Previous")) {
                                    label = "&laquo; Sebelumnya";
                                } else if (label.includes("Next")) {
                                    label = "Berikutnya &raquo;";
                                }

                                return link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        // Preserve all current query params including status
                                        data={{
                                            ...filters,
                                            status: status,
                                            search: search,
                                            sort_field: sortField,
                                            sort_direction: sortDirection,
                                        }}
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
                                        className="px-3 py-1 text-xs rounded-md text-slate-400 border theme-border opacity-50 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{
                                            __html: label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Owned Areas Modal */}
            {showAreasModal && selectedUserAreas && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="theme-modal w-full max-w-md overflow-hidden">
                        <div className="theme-modal-header flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold theme-text">
                                    Kepemilikan Area
                                </h3>
                                <p className="text-sm theme-text-secondary mt-1">
                                    {selectedUserAreas.name}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAreasModal(false);
                                    setSelectedUserAreas(null);
                                }}
                                className="theme-text-subtle hover:text-action-primary"
                            >
                                <span className="material-symbols-outlined">
                                    close
                                </span>
                            </button>
                        </div>

                        <div className="p-4 max-h-[300px] overflow-y-auto">
                            {selectedUserAreas.areas.length === 0 ? (
                                <div className="text-center py-8 theme-text-secondary">
                                    <span className="material-symbols-outlined text-4xl opacity-30 mb-2 block">
                                        folder_off
                                    </span>
                                    <p className="text-sm">
                                        Belum memiliki area
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {selectedUserAreas.areas.map((area) => (
                                        <div
                                            key={area.id}
                                            className="flex items-center gap-3 p-3 rounded-lg theme-surface border theme-border"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-amber-500 text-[18px]">
                                                    domain
                                                </span>
                                            </div>
                                            <span className="theme-text font-medium text-sm">
                                                {area.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="theme-modal-footer flex justify-end">
                            <button
                                onClick={() => {
                                    setShowAreasModal(false);
                                    setSelectedUserAreas(null);
                                }}
                                className="theme-btn-secondary"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Super Admin Modal */}
            {showTransferModal && transferTargetUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="theme-modal w-full max-w-md overflow-hidden border-2 border-amber-500/50">
                        <div className="theme-modal-header flex justify-between items-center bg-amber-500/10">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-amber-500">
                                    warning
                                </span>
                                <div>
                                    <h3 className="text-lg font-bold theme-text text-amber-500">
                                        Transfer Peran Super Admin
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowTransferModal(false);
                                    setTransferTargetUser(null);
                                }}
                                className="theme-text-subtle hover:text-action-primary"
                            >
                                <span className="material-symbols-outlined">
                                    close
                                </span>
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="theme-text mb-4 leading-relaxed">
                                Hanya boleh ada <strong>1 Super Admin</strong>{" "}
                                dalam sistem.
                            </p>
                            <p className="theme-text-secondary mb-6 leading-relaxed">
                                Jika Anda melanjutkan, peran Super Admin akan
                                dipindahkan ke{" "}
                                <strong className="theme-text-primary px-1 rounded bg-primary/10">
                                    {transferTargetUser.name}
                                </strong>{" "}
                                dan peran Anda akan berubah menjadi{" "}
                                <strong>Admin</strong>.
                            </p>

                            {/* Area Transfer Warning */}
                            {transferTargetUser.owned_areas_count > 0 && (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 text-sm text-blue-600 dark:text-blue-400 mb-4">
                                    <span className="material-symbols-outlined shrink-0 text-[18px] mt-0.5">
                                        swap_horiz
                                    </span>
                                    <div>
                                        <p className="font-bold mb-1">
                                            Pemindahan Aset Area
                                        </p>
                                        <p>
                                            Pengguna ini memiliki{" "}
                                            <strong>
                                                {
                                                    transferTargetUser.owned_areas_count
                                                }{" "}
                                                area
                                            </strong>
                                            . Area-area tersebut akan
                                            dipindahkan kepemilikannya menjadi
                                            milik Anda.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 text-sm text-amber-600 dark:text-amber-400">
                                <span className="material-symbols-outlined shrink-0 text-[18px] mt-0.5">
                                    info
                                </span>
                                <p>
                                    Anda akan otomatis logout setelah transfer
                                    berhasil.
                                </p>
                            </div>
                        </div>

                        <div className="theme-modal-footer flex justify-end gap-3 bg-slate-50/50 dark:bg-[#1b2631]/50">
                            <button
                                onClick={() => {
                                    setShowTransferModal(false);
                                    setTransferTargetUser(null);
                                }}
                                className="theme-btn-secondary"
                                disabled={transferring}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleTransferSuperAdmin}
                                disabled={transferring}
                                className="theme-btn-primary bg-amber-500 hover:bg-amber-600 border-amber-500 text-white disabled:opacity-50 flex items-center gap-2"
                            >
                                {transferring ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[18px]">
                                            progress_activity
                                        </span>
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">
                                            swap_horiz
                                        </span>
                                        Transfer & Logout
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

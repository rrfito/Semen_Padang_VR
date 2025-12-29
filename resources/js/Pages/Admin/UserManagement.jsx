import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, Link } from "@inertiajs/react";

export default function UserManagement({ users, filters }) {
    const [search, setSearch] = useState(filters?.search || "");
    const [sortField, setSortField] = useState(filters?.sort_field || "name");
    const [sortDirection, setSortDirection] = useState(
        filters?.sort_direction || "asc"
    );

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
                },
                { preserveState: true, replace: true }
            );
        }, 300); // 300ms delay

        return () => clearTimeout(timeoutId);
    }, [search, sortField, sortDirection]);

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

    const handleRoleChange = (userId, newRole) => {
        router.put(
            route("admin.users.update-role", userId),
            { role: newRole },
            { preserveScroll: true }
        );
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "admin":
                return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "pegawai":
                return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            default:
                return "bg-slate-500/10 text-slate-500 border-slate-500/20";
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
                            All Users
                        </h2>
                        <p className="theme-text-secondary text-sm">
                            Manage user access and roles.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users..."
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
                                            User
                                            <span className="material-symbols-outlined text-[16px]">
                                                {getSortIcon("name")}
                                            </span>
                                        </div>
                                    </th>
                                    <th
                                        className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary cursor-pointer hover:theme-text transition-colors select-none"
                                        onClick={() => handleSort("role")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Role
                                            <span className="material-symbols-outlined text-[16px]">
                                                {getSortIcon("role")}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary">
                                        Last Activity
                                    </th>
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
                                        <td className="p-4">
                                            <div className="relative inline-block text-left">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) =>
                                                        handleRoleChange(
                                                            user.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none ${getRoleBadgeColor(
                                                        user.role
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
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        expand_more
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 theme-text-secondary text-sm">
                                                <span className="material-symbols-outlined text-[16px]">
                                                    history
                                                </span>
                                                <span>
                                                    {user.last_activity}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="p-8 text-center theme-text-secondary"
                                        >
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="border-t theme-border p-4 flex items-center justify-between bg-slate-50/50 dark:bg-[#1b2631]/50">
                        <div className="text-sm theme-text-secondary">
                            Showing{" "}
                            <span className="font-medium theme-text">
                                {users.from}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium theme-text">
                                {users.to}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium theme-text">
                                {users.total}
                            </span>{" "}
                            results
                        </div>
                        <div className="flex gap-1">
                            {users.links.map((link, i) =>
                                link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                            link.active
                                                ? "bg-primary text-white"
                                                : "bg-white dark:bg-[#233648] theme-text border theme-border hover:bg-slate-100 dark:hover:bg-[#2a4055]"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ) : (
                                    <span
                                        key={i}
                                        className="px-3 py-1 text-xs rounded-md text-slate-400 border theme-border opacity-50 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

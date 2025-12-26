import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";

export default function Index({ users }) {
    // Function to handle role change
    const handleRoleChange = (userId, newRole) => {
        router.put(
            route("admin.users.update-role", userId),
            {
                role: newRole,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Optional: Show toast notification
                    // console.log('Role updated');
                },
            }
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

    return (
        <AdminLayout>
            <Head title="User Management" />

            <div className="flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="theme-text text-xl font-bold">
                            All Users
                        </h2>
                        <p className="theme-text-secondary text-sm">
                            Manage user access and roles directly.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#111a22] px-4 py-2 rounded-lg border theme-border">
                        <span className="material-symbols-outlined theme-text-secondary text-[20px]">
                            group
                        </span>
                        <span className="theme-text text-sm font-bold">
                            Total Users: {users.length}
                        </span>
                    </div>
                </div>

                {/* Table Card */}
                <div className="theme-card rounded-xl border theme-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b theme-border bg-slate-50/50 dark:bg-[#1b2631]/50">
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary">
                                        Name
                                    </th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary">
                                        Role
                                    </th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider theme-text-secondary">
                                        Last Activity
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y theme-border">
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-slate-50 dark:hover:bg-[#1b2631] transition-colors group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#233648] bg-cover bg-center"
                                                    style={{
                                                        backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                            user.name
                                                        )}&background=random')`,
                                                    }}
                                                ></div>
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
                                                    className={`
                                                        appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none
                                                        ${getRoleBadgeColor(
                                                            user.role
                                                        )}
                                                        bg-transparent
                                                    `}
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
                                                    schedule
                                                </span>
                                                <span>
                                                    {user.last_activity}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

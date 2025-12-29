import React from "react";
import { Link, usePage } from "@inertiajs/react";

export default function Sidebar() {
    const { url } = usePage();

    return (
        <aside className="flex w-64 flex-col border-r theme-border theme-surface flex-shrink-0 font-display transition-all duration-300 h-full">
            <div className="flex flex-col h-full justify-between p-4 pt-6">
                <div className="flex flex-col gap-6">
                    {/* Removed Branding - Moved to Header */}

                    <div className="flex flex-col gap-2">
                        {/* Edit Mode Section */}
                        <div className="px-2">
                            <p className="text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-2">
                                Edit Mode
                            </p>
                            <Link
                                href={route("admin.editor.index")}
                                className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined fill-1">
                                        map
                                    </span>
                                    <p className="text-sm font-bold leading-normal">
                                        Visual Editor
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-[18px] opacity-70 group-hover:translate-x-1 transition-transform">
                                    arrow_forward
                                </span>
                            </Link>
                        </div>

                        <div className="h-px bg-border-light dark:bg-border-dark mx-2 my-2"></div>

                        {/* Management Section */}
                        <div className="px-2">
                            <p className="text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-2">
                                Management
                            </p>
                            <nav className="flex flex-col gap-1">
                                {/* Dashboard Link */}
                                <Link
                                    href={route("admin.dashboard")}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border-l-4 ${
                                        route().current("admin.dashboard")
                                            ? "bg-slate-200 dark:bg-[#233648] theme-text border-primary"
                                            : "theme-text-secondary hover:bg-slate-100 dark:hover:bg-[#233648] hover:theme-text border-transparent"
                                    }`}
                                >
                                    <span
                                        className={`material-symbols-outlined ${
                                            route().current("admin.dashboard")
                                                ? "text-primary"
                                                : ""
                                        }`}
                                    >
                                        dashboard
                                    </span>
                                    <p className="text-sm font-medium leading-normal">
                                        Dashboard
                                    </p>
                                </Link>

                                {/* User Link */}
                                <Link
                                    href={route("admin.user-management")}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border-l-4 ${
                                        route().current("admin.user-management")
                                            ? "bg-slate-200 dark:bg-[#233648] theme-text border-primary"
                                            : "theme-text-secondary hover:bg-slate-100 dark:hover:bg-[#233648] hover:theme-text border-transparent"
                                    }`}
                                >
                                    <span className="material-symbols-outlined">
                                        group
                                    </span>
                                    <p className="text-sm font-medium leading-normal">
                                        User
                                    </p>
                                </Link>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Footer / Logout */}
                <div className="flex flex-col gap-2 border-t theme-border pt-4">
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="flex items-center gap-3 px-3 py-3 rounded-lg theme-sidebar-item w-full text-left"
                    >
                        <span className="material-symbols-outlined">
                            logout
                        </span>
                        <p className="text-sm font-medium leading-normal">
                            Log Out
                        </p>
                    </Link>
                </div>
            </div>
        </aside>
    );
}

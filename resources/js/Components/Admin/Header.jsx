import React from "react";
import { usePage } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { APP_DEFAULTS } from "@/Config/AppDefaults";

export default function Header({ title = "Street View Admin" }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const { isDark, toggleTheme } = useTheme();

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b theme-border theme-surface px-8 py-4 flex-shrink-0 font-display transition-colors duration-200">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger */}
                <button className="md:hidden theme-text-secondary">
                    <span className="material-symbols-outlined">menu</span>
                </button>

                {/* Branding - Matching Visual Editor Style */}
                <div className="flex items-center gap-4">
                    {/* Optional: Add Logo here if needed to match Visual Editor exactly */}
                    <img
                        src={APP_DEFAULTS.LOGO_URL}
                        alt="Logo"
                        className="h-8 w-auto object-contain"
                    />
                    <div>
                        <h2 className="text-sm font-bold leading-tight tracking-wide uppercase text-slate-500 dark:text-slate-400">
                            {APP_DEFAULTS.NAME}
                        </h2>
                        <h1 className="theme-text text-xl font-bold leading-tight tracking-[-0.015em]">
                            {title}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="size-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#233648] hover:bg-slate-200 dark:hover:bg-[#2f455a] text-gray-600 dark:text-slate-300 transition-all border border-gray-200 dark:border-transparent"
                    title={
                        isDark
                            ? "Beralih ke Mode Terang"
                            : "Beralih ke Mode Gelap"
                    }
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {isDark ? "light_mode" : "dark_mode"}
                    </span>
                </button>

                <div className="h-8 w-px bg-border-light dark:bg-border-dark mx-1"></div>

                <div className="flex items-center gap-3 cursor-pointer group">
                    {/* User Info */}
                    <div className="hidden md:flex flex-col items-end">
                        <p className="theme-text text-sm font-bold leading-none">
                            {user.name}
                        </p>
                        <p className="theme-text-secondary text-xs font-normal leading-normal mt-1">
                            {user.role === "super_admin"
                                ? "Super Administrator"
                                : "Administrator"}
                        </p>
                    </div>
                    <div
                        className="bg-center bg-no-repeat bg-cover rounded-full size-9 ring-2 ring-transparent group-hover:ring-primary/50 transition-all bg-slate-700"
                        style={{
                            backgroundImage:
                                "url('https://ui-avatars.com/api/?name=" +
                                encodeURIComponent(user.name) +
                                "&background=0D8ABC&color=fff')",
                        }}
                    ></div>
                </div>
            </div>
        </header>
    );
}

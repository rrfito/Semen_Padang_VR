import React from "react";

export default function WelcomeView({ onSelectExisting }) {
    return (
        <main className="flex-1 relative flex flex-col theme-canvas overflow-hidden group/canvas items-center justify-center font-sans">
            <div className="absolute inset-0 theme-canvas">
                <svg
                    className="w-full h-full opacity-[0.03]"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern
                            height="40"
                            id="grid-pattern"
                            patternUnits="userSpaceOnUse"
                            width="40"
                        >
                            <path
                                d="M 40 0 L 0 0 0 40"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                            ></path>
                        </pattern>
                    </defs>
                    <rect
                        fill="url(#grid-pattern)"
                        height="100%"
                        width="100%"
                    ></rect>
                </svg>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#182430] via-transparent to-transparent"></div>
            </div>

            <div className="z-10 flex flex-col items-center max-w-lg w-full px-6 text-center">
                <div className="size-24 rounded-3xl bg-gradient-to-br from-gray-200 dark:from-slate-700/50 to-gray-300 dark:to-slate-900/50 border theme-border shadow-2xl backdrop-blur-sm flex items-center justify-center mb-8">
                    <span className="material-symbols-outlined text-action-primary text-[48px]">
                        add_location_alt
                    </span>
                </div>

                <h1 className="text-3xl font-bold theme-text mb-3 tracking-tight">
                    Selamat Datang di Editor Visual
                </h1>

                <p className="theme-text-secondary text-lg mb-10 leading-relaxed">
                    Pilih area untuk mulai mengedit, atau buat lokasi baru untuk
                    mulai mengelola scene street view Anda.
                </p>
            </div>
        </main>
    );
}

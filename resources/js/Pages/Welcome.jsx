import { Head, Link } from "@inertiajs/react";
import { FaMapMarkedAlt, FaSignInAlt, FaUserPlus } from "react-icons/fa";

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Selamat Datang" />
            <div className="bg-gray-50 text-black/50 dark:bg-black dark:text-white/50 min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans">
                {/* Background Image / Decoration */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Semen_Padang_Indarung_VI.jpg"
                        alt="Background Semen Padang"
                        className="w-full h-full object-cover opacity-10 dark:opacity-20 grayscale"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-black dark:via-black/80"></div>
                </div>

                <div className="relative z-10 w-full max-w-2xl px-6 lg:max-w-7xl">
                    {/* Header / Nav */}
                    <header className="flex items-center justify-between py-6">
                        <div className="flex items-center gap-3">
                            <img
                                src="/image/LOGO PT SEMEN PADANG.png"
                                alt="Semen Padang Logo"
                                className="h-12 w-auto object-contain"
                            />
                            <div className="hidden sm:flex flex-col">
                                <span className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none tracking-tight">
                                    PT SEMEN PADANG
                                </span>
                                <span className="text-xs text-[#D32F2F] font-bold tracking-widest mt-0.5">
                                    VIRTUAL TOUR
                                </span>
                            </div>
                        </div>

                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={route("tour.index")}
                                    className="px-4 py-2 bg-[#D32F2F] text-white rounded-lg font-bold hover:bg-[#b71c1c] transition text-sm flex items-center gap-2 shadow-lg shadow-red-500/30"
                                >
                                    <FaMapMarkedAlt />
                                    Buka Peta
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route("login")}
                                        className="px-4 py-2 text-gray-600 hover:text-[#D32F2F] font-bold transition text-sm flex items-center gap-2 dark:text-gray-300 dark:hover:text-white"
                                    >
                                        <FaSignInAlt />
                                        Masuk
                                    </Link>
                                    {/* Register hidden unless requested */}
                                </>
                            )}
                        </nav>
                    </header>

                    {/* Main Content */}
                    <main className="mt-16 flex flex-col items-center text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-[#D32F2F] text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-up">
                            <span className="w-2 h-2 rounded-full bg-[#D32F2F] animate-pulse"></span>
                            Virtual Tour System
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 animate-fade-in-up delay-100">
                            Jelajahi{" "}
                            <span className="text-[#D32F2F]">Pabrik</span>{" "}
                            Secara Virtual
                        </h1>

                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-10 leading-relaxed animate-fade-in-up delay-200">
                            Sistem informasi geografis interaktif untuk
                            mengeksplorasi setiap sudut area pabrik PT Semen
                            Padang dengan teknologi 360° yang imersif.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
                            <Link
                                href={route("tour.index")}
                                className="group relative px-8 py-4 bg-[#D32F2F] text-white rounded-xl font-bold text-lg hover:bg-[#b71c1c] transition-all shadow-xl shadow-red-500/20 hover:shadow-red-500/40 flex items-center justify-center gap-3"
                            >
                                <FaMapMarkedAlt className="group-hover:scale-110 transition-transform" />
                                Mulai Menjelajah
                            </Link>
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="mt-32 py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                        &copy; {new Date().getFullYear()} PT Semen Padang. All
                        rights reserved.
                    </footer>
                </div>
            </div>
        </>
    );
}

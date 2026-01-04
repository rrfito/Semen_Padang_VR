import PrimaryButton from "@/Components/PrimaryButton";
import { Head, useForm } from "@inertiajs/react";
import { APP_DEFAULTS } from "@/Config/AppDefaults";
import { FaClock } from "react-icons/fa";

export default function ApprovalPending() {
    const { post } = useForm();

    const logout = (e) => {
        e.preventDefault();
        post(route("logout"));
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans p-4">
            <Head title="Menunggu Persetujuan" />

            {/* Decorative Blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            {/* Main Card */}
            <div className="w-full max-w-lg relative z-10 backdrop-blur-md bg-black/30 border border-white/10 rounded-3xl shadow-2xl p-8 text-center animate-fade-in-up">
                {/* Logo */}
                <div className="mb-6 flex justify-center">
                    <img
                        src={APP_DEFAULTS.LOGO_URL}
                        alt={APP_DEFAULTS.NAME}
                        className="h-20 w-auto drop-shadow-xl"
                    />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                    Menunggu Persetujuan
                </h2>

                {/* Message */}
                <div className="text-gray-400 text-sm leading-relaxed mb-8">
                    <p className="mb-4">
                        Terima kasih telah mendaftar! Akun Anda saat ini sedang
                        dalam peninjauan oleh{" "}
                        <span className="text-white font-semibold">
                            Administrator
                        </span>
                        .
                    </p>
                    <p>
                        Mohon tunggu beberapa saat. Anda dapat mengecek status
                        akun Anda secara berkala dengan mencoba masuk kembali
                        nanti.
                    </p>
                </div>

                {/* Action */}
                <form onSubmit={logout}>
                    <PrimaryButton className="w-full justify-center py-3.5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold rounded-xl shadow-lg border border-white/5 transition-all">
                        Kembali ke Halaman Utama
                    </PrimaryButton>
                </form>
            </div>
        </div>
    );
}

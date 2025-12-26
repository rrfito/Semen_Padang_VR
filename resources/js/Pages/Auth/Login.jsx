import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <div className="h-screen w-screen flex overflow-hidden bg-gray-900 font-sans">
            <Head title="Log in" />

            {/* LEFT SIDE: IMAGE & BRANDING (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-black">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110"
                    style={{
                        backgroundImage: "url('/image/BG-Semen_Padang.jpg')",
                        opacity: 0.6,
                    }}
                ></div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full text-white">
                    <div>
                        <img
                            src="/image/LOGO PT SEMEN PADANG.png"
                            alt="Semen Padang"
                            className="h-20 w-auto drop-shadow-2xl"
                        />
                    </div>
                    <div className="space-y-6">
                        <h1 className="text-6xl font-extrabold leading-tight tracking-tight drop-shadow-lg">
                            Virtual Tour <br />
                            <span className="text-red-600">Experience</span>
                        </h1>
                        <p className="text-xl text-gray-200 max-w-lg drop-shadow-md">
                            Jelajahi setiap sudut fasilitas Semen Padang dengan
                            pengalaman 360° yang imersif dan detail.
                        </p>
                    </div>
                    <div className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} PT Semen Padang. All
                        rights reserved.
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: LOGIN FORM */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0f172a] relative h-full">
                {/* Mobile Background (Subtle) */}
                <div
                    className="absolute inset-0 lg:hidden bg-cover bg-center opacity-20"
                    style={{
                        backgroundImage: "url('/image/BG-Semen_Padang.jpg')",
                    }}
                ></div>
                <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-[#0f172a]/90 to-[#0f172a]"></div>

                {/* Decorative Blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="w-full max-w-md space-y-8 relative z-10 backdrop-blur-sm lg:backdrop-blur-none p-6 lg:p-0 rounded-2xl lg:rounded-none border border-white/5 lg:border-none bg-black/20 lg:bg-transparent">
                    <div className="text-center lg:text-left">
                        {/* Mobile Logo */}
                        <img
                            src="/image/LOGO PT SEMEN PADANG.png"
                            alt="Semen Padang"
                            className="h-12 w-auto mx-auto lg:hidden mb-6 drop-shadow-lg"
                        />

                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            Selamat Datang
                        </h2>
                        <p className="mt-2 text-gray-400">
                            Silakan masuk untuk mengakses dashboard pegawai.
                        </p>
                    </div>

                    {status && (
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <InputLabel
                                htmlFor="email"
                                value="Email"
                                className="text-gray-300"
                            />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
                                    <FaUser />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="block w-full pl-10 bg-gray-800/50 border-gray-700 text-white focus:border-red-500 focus:ring-red-500 rounded-xl transition-all py-3"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    placeholder="nama@semenpadang.co.id"
                                />
                            </div>
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <InputLabel
                                htmlFor="password"
                                value="Password"
                                className="text-gray-300"
                            />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
                                    <FaLock />
                                </div>
                                <TextInput
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    className="block w-full pl-10 pr-10 bg-gray-800/50 border-gray-700 text-white focus:border-red-500 focus:ring-red-500 rounded-xl transition-all py-3"
                                    autoComplete="current-password"
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            <InputError
                                message={errors.password}
                                className="mt-1"
                            />
                        </div>

                        {/* Remember & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                    className="text-red-600 focus:ring-red-500 bg-gray-800 border-gray-700 rounded"
                                />
                                <span className="ms-2 text-sm text-gray-400 hover:text-gray-300 cursor-pointer">
                                    Ingat saya
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route("password.request")}
                                    className="text-sm text-red-500 hover:text-red-400 hover:underline transition-colors font-medium"
                                >
                                    Lupa password?
                                </Link>
                            )}
                        </div>

                        <PrimaryButton
                            className="w-full justify-center py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transform transition hover:-translate-y-0.5 text-lg"
                            disabled={processing}
                        >
                            {processing ? "Memproses..." : "Masuk Sekarang"}
                        </PrimaryButton>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-500">
                            Bukan pegawai?{" "}
                            <Link
                                href="/"
                                className="text-white hover:text-red-500 font-medium transition-colors"
                            >
                                Kembali ke Beranda
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope } from "react-icons/fa";
import { useState } from "react";
import { APP_DEFAULTS } from "@/Config/AppDefaults";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <div className="h-screen w-screen flex overflow-hidden bg-gray-900 font-sans">
            <Head title="Daftar" />

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
                            src={APP_DEFAULTS.LOGO_URL}
                            alt={APP_DEFAULTS.NAME}
                            className="h-20 w-auto drop-shadow-2xl"
                        />
                    </div>
                    <div className="space-y-6">
                        <h1 className="text-6xl font-extrabold leading-tight tracking-tight drop-shadow-lg">
                            Bergabung <br />
                            <span className="text-red-600">ke Tur Virtual</span>
                        </h1>
                        <p className="text-xl text-gray-200 max-w-lg drop-shadow-md">
                            Daftarkan akun pegawai untuk dapat megakses area
                            area terbatas.
                        </p>
                    </div>
                    <div className="text-sm text-gray-400">
                        {APP_DEFAULTS.COPYRIGHT}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: REGISTER FORM */}
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
                            src={APP_DEFAULTS.LOGO_URL}
                            alt={APP_DEFAULTS.NAME}
                            className="h-12 w-auto mx-auto lg:hidden mb-6 drop-shadow-lg"
                        />

                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            Buat Akun Baru
                        </h2>
                        <p className="mt-2 text-gray-400">
                            Lengkapi data diri Anda untuk mendaftar.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <InputLabel
                                htmlFor="name"
                                value="Nama Lengkap"
                                className="text-gray-300"
                            />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
                                    <FaUser />
                                </div>
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="block w-full pl-10 bg-gray-800/50 border-gray-700 text-white focus:border-red-500 focus:ring-red-500 rounded-xl transition-all py-3"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    placeholder="Nama Lengkap Pegawai"
                                    required
                                />
                            </div>
                            <InputError
                                message={errors.name}
                                className="mt-1"
                            />
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <InputLabel
                                htmlFor="email"
                                value="Email"
                                className="text-gray-300"
                            />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
                                    <FaEnvelope />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="block w-full pl-10 bg-gray-800/50 border-gray-700 text-white focus:border-red-500 focus:ring-red-500 rounded-xl transition-all py-3"
                                    autoComplete="username"
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    placeholder="nama@gmail.com"
                                    required
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
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    placeholder="••••••••"
                                    required
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

                        {/* Confirm Password Input */}
                        <div className="space-y-2">
                            <InputLabel
                                htmlFor="password_confirmation"
                                value="Konfirmasi Password"
                                className="text-gray-300"
                            />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
                                    <FaLock />
                                </div>
                                <TextInput
                                    id="password_confirmation"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="block w-full pl-10 pr-10 bg-gray-800/50 border-gray-700 text-white focus:border-red-500 focus:ring-red-500 rounded-xl transition-all py-3"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value
                                        )
                                    }
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <FaEyeSlash />
                                    ) : (
                                        <FaEye />
                                    )}
                                </button>
                            </div>
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-1"
                            />
                        </div>

                        <PrimaryButton
                            className="w-full justify-center py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transform transition hover:-translate-y-0.5 text-lg"
                            disabled={processing}
                        >
                            {processing ? "Memproses..." : "Daftar Sekarang"}
                        </PrimaryButton>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-500">
                            Sudah punya akun?{" "}
                            <Link
                                href={route("login")}
                                className="text-white hover:text-red-500 font-medium transition-colors"
                            >
                                Masuk disini
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

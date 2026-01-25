import React, { useState } from "react";
import axios from "axios";
import SectionHeader from "@/Components/Editor/SectionHeader";
import FormInput from "@/Components/Editor/FormInput";
import FormTextarea from "@/Components/Editor/FormTextarea";
import ConfirmModal from "@/Components/Editor/ConfirmModal";
import MapPickerModal from "@/Components/Editor/MapPickerModal";

export default function PropertiesPanel({
    selection,
    activeNode,
    onUpdate,
    onDelete,
    showStatusLabels, // Passed from parent (Audit Mode), though Properties Panel is implicitly "Focus Mode" so labels always show
}) {
    // Show loading placeholder when scene is selected but data not yet loaded
    if (selection && selection.type === "scene" && !activeNode) {
        return (
            <aside className="w-96 flex flex-col border-l theme-border theme-sidebar z-10 transition-all font-sans">
                <div className="px-6 py-5 border-b theme-border flex items-center gap-3 theme-surface">
                    <div className="size-10 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                        <span className="material-symbols-outlined text-[24px]">
                            panorama_photosphere
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold theme-text leading-tight">
                            {selection.name || `Scene #${selection.id}`}
                        </h2>
                        <p className="text-xs font-medium theme-text-muted mt-0.5">
                            Memuat properti...
                        </p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex items-center justify-center">
                    <div className="text-center text-white/50 flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-emerald-400 rounded-full animate-spin"></div>
                        <span className="text-sm">Memuat data scene...</span>
                    </div>
                </div>
            </aside>
        );
    }

    if (!selection || !activeNode) {
        // RENDER GETTING STARTED GUIDE
        return (
            <aside className="w-96 flex flex-col border-l theme-border theme-sidebar z-10 transition-all font-sans">
                <div className="px-6 py-5 border-b theme-border flex items-center gap-3 theme-surface">
                    <div className="size-10 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                        <span className="material-symbols-outlined text-[24px]">
                            lightbulb
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold theme-text leading-tight">
                            Memulai
                        </h2>
                        <p className="text-xs font-medium theme-text-muted mt-0.5">
                            Panduan Memulai Cepat
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <h3 className="theme-section-header mb-4">Langkah Kerja</h3>
                    <ul className="space-y-6 relative">
                        <div className="absolute left-[11px] top-2 bottom-4 w-px theme-border -z-10"></div>
                        <li className="flex gap-4 items-start">
                            <span className="flex items-center justify-center size-6 rounded-full theme-icon-bg theme-text-secondary text-xs font-bold shrink-0 border theme-border">
                                1
                            </span>
                            <div className="pt-0.5">
                                <p className="text-sm font-medium theme-text-secondary">
                                    Buat atau pilih Area
                                </p>
                                <p className="text-xs theme-text-muted mt-1">
                                    Tentukan struktur lokasi Anda.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="flex items-center justify-center size-6 rounded-full bg-gray-100 dark:bg-[#233648] text-gray-600 dark:text-slate-300 text-xs font-bold shrink-0 border border-gray-200 dark:border-slate-600">
                                2
                            </span>
                            <div className="pt-0.5">
                                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                    Unggah scene
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                    Unggah panorama 360°.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="flex items-center justify-center size-6 rounded-full bg-gray-100 dark:bg-[#233648] text-gray-600 dark:text-slate-300 text-xs font-bold shrink-0 border border-gray-200 dark:border-slate-600">
                                3
                            </span>
                            <div className="pt-0.5">
                                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                    Hubungkan scene
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                    Gunakan link otomatis untuk menghubungkan
                                    sudut pandang.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="flex items-center justify-center size-6 rounded-full bg-gray-100 dark:bg-[#233648] text-gray-600 dark:text-slate-300 text-xs font-bold shrink-0 border border-gray-200 dark:border-slate-600">
                                4
                            </span>
                            <div className="pt-0.5">
                                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                    Tinjau dan terbitkan
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                    Terbitkan data agar dapat diakses oleh
                                    pengguna.
                                </p>
                            </div>
                        </li>
                    </ul>
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-border-dark">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3">
                            Legenda
                        </h3>
                        <div className="bg-gray-100 dark:bg-[#111a22] rounded-lg p-3 space-y-2 border border-gray-200 dark:border-border-dark">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-amber-500 text-[20px]">
                                    domain
                                </span>
                                <span className="text-sm text-gray-700 dark:text-slate-300">
                                    <span className="font-bold">
                                        Area Utama
                                    </span>{" "}
                                    = Kantor Pusat / Workshop
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-500 text-[20px]">
                                    layers
                                </span>
                                <span className="text-sm text-gray-700 dark:text-slate-300">
                                    <span className="font-bold">Area Zona</span>{" "}
                                    = Lantai / Blok / Zona
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-teal-500 text-[20px]">
                                    meeting_room
                                </span>

                                <span className="text-sm text-gray-700 dark:text-slate-300">
                                    <span className="font-bold">Ruangan</span> =
                                    Ruangan Spesifik
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-purple-500 text-[20px]">
                                    360
                                </span>
                                <span className="text-sm text-gray-700 dark:text-slate-300">
                                    <span className="font-bold">Scene</span> =
                                    Titik Pandang di Dalam
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        );
    }

    const handleChange = (field, value) => {
        onUpdate(selection.id, selection.type, { [field]: value });
    };

    // Delete confirmation modal state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletionImpact, setDeletionImpact] = useState(null);

    // Map picker modal state
    const [showMapPicker, setShowMapPicker] = useState(false);

    // Helper to calculate deletion impact client-side (Instant)
    const calculateImpact = (node) => {
        let count = { areas: 0, scenes: 0, area_names: [] };

        const traverse = (n) => {
            // Explicitly skip if marked for deletion
            if (n.marked_for_deletion) return;

            count.areas++;

            if (n.scenes) {
                // Filter scenes that are marked for deletion
                const validScenes = n.scenes.filter(
                    (s) => !s.marked_for_deletion,
                );
                count.scenes += validScenes.length;
            }

            if (n.children) {
                n.children.forEach((child) => {
                    traverse(child);
                    // Collect names of direct children for display
                    // Only if child wasn't skipped inside traverse (traverse checks marked_for_deletion)
                    if (n === node && !child.marked_for_deletion) {
                        count.area_names.push(child.name);
                    }
                });
            }
        };

        traverse(node);

        return {
            total_areas: count.areas, // Includes self
            total_scenes: count.scenes,
            area_name: node.name,
            area_names: count.area_names.slice(0, 5), // Limit to 5 for display
        };
    };

    const handleDeleteClick = async () => {
        if (selection.type === "scene") {
            setDeletionImpact(null);
            setShowDeleteConfirm(true);
            return;
        }

        // For Areas: Calculate impact instantly
        const impact = calculateImpact(activeNode);
        setDeletionImpact({
            ...impact,
            warning:
                "Semua area turunan dan scene di dalamnya akan dihapus secara permanen.",
        });
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        // Use the unified parent handler (optimistic)
        onDelete(selection.id, selection.type);
        setShowDeleteConfirm(false);
        setDeletionImpact(null);
    };

    return (
        <aside className="w-80 flex flex-col border-l theme-border theme-surface z-10 font-sans">
            {/* Header */}
            <div className="px-6 py-6 border-b theme-border flex items-start gap-4">
                <div
                    className={`mt-1 size-10 flex items-center justify-center rounded-xl shadow-lg border border-white/5 shrink-0 ${
                        selection.type === "scene"
                            ? "bg-purple-500 text-white"
                            : activeNode.level === 1
                              ? "bg-amber-500 text-white"
                              : activeNode.level === 2 &&
                                  activeNode.is_container
                                ? "bg-blue-500 text-white"
                                : "bg-teal-500 text-white"
                    }`}
                >
                    <span className="material-symbols-outlined text-xl">
                        {selection.type === "scene"
                            ? "360"
                            : activeNode.level === 1
                              ? "domain"
                              : activeNode.level === 2 &&
                                  activeNode.is_container
                                ? "layers"
                                : "meeting_room"}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold theme-text leading-tight truncate">
                            {activeNode.name}
                        </h2>
                        {/* Status Badges */}
                        {showStatusLabels && (
                            <>
                                {activeNode.status === "new" && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                                        BARU
                                    </span>
                                )}
                                {activeNode.status === "modified" && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                        DIUBAH
                                    </span>
                                )}
                            </>
                        )}
                        {/* Live badge removed as per request */}
                    </div>
                    <p className="text-xs font-bold theme-text-muted uppercase tracking-wider mt-1">
                        {selection.type === "area"
                            ? "Properti Area"
                            : "Properti Scene"}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* 1. Scene/Area Name */}
                <div className="space-y-3">
                    <SectionHeader>
                        {selection.type === "area" ? "Nama Area" : "Nama Scene"}
                    </SectionHeader>
                    <FormInput
                        value={activeNode.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder={
                            selection.type === "area"
                                ? "Masukkan nama area"
                                : "Masukkan nama scene"
                        }
                    />
                </div>

                {/* 2. Description - ONLY for Areas */}
                {selection.type === "area" && (
                    <div className="space-y-3">
                        <SectionHeader>Deskripsi</SectionHeader>
                        <FormTextarea
                            value={activeNode.description || ""}
                            onChange={(e) =>
                                handleChange("description", e.target.value)
                            }
                            placeholder="Tambahkan deskripsi..."
                        />
                    </div>
                )}

                {/* 3. GPS Location - ONLY for Root Areas (Level 1) */}
                {selection.type === "area" && activeNode.level === 1 && (
                    <div className="space-y-3 pt-4 border-t theme-border">
                        <SectionHeader>Lokasi Area</SectionHeader>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold theme-text-muted uppercase tracking-wide mb-1.5">
                                    Lintang
                                </label>
                                <FormInput
                                    type="number"
                                    step="any"
                                    value={activeNode.lat || ""}
                                    onChange={(e) =>
                                        handleChange(
                                            "lat",
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    placeholder="0.0000"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold theme-text-muted uppercase tracking-wide mb-1.5">
                                    Bujur
                                </label>
                                <FormInput
                                    type="number"
                                    step="any"
                                    value={activeNode.lng || ""}
                                    onChange={(e) =>
                                        handleChange(
                                            "lng",
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    placeholder="0.0000"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowMapPicker(true)}
                            className="w-full flex items-center justify-center gap-2 h-9 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 theme-text-secondary font-bold text-xs rounded-lg border theme-border transition-all"
                        >
                            <span className="material-symbols-outlined text-[16px]">
                                explore
                            </span>
                            Lokasi dari Peta
                        </button>
                    </div>
                )}

                {/* 4. Ownership Display - ONLY for Level 1 Areas when super-admin */}
                {selection.type === "area" &&
                    activeNode.level === 1 &&
                    activeNode.creator_name && (
                        <div className="space-y-2 pt-4 border-t theme-border">
                            <SectionHeader>Pemilik Area</SectionHeader>
                            <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-slate-800/50 rounded-lg border theme-border-subtle">
                                <div className="size-8 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                                    <span className="material-symbols-outlined text-[18px]">
                                        person
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold theme-text">
                                        @{activeNode.creator_name}
                                    </p>
                                    <p className="text-[10px] theme-text-muted uppercase tracking-wide">
                                        Kreator & Pemilik
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                {/* ========== SCENE-SPECIFIC PROPERTIES ========== */}
                {selection.type === "scene" && (
                    <>
                        {/* GPS Location */}
                        <div className="space-y-3 pt-4 border-t theme-border">
                            <SectionHeader>
                                Referensi GPS Opsional
                            </SectionHeader>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold theme-text-muted uppercase tracking-wide mb-1.5">
                                        Lintang
                                    </label>
                                    <FormInput
                                        type="number"
                                        step="any"
                                        value={activeNode.lat || ""}
                                        onChange={(e) =>
                                            handleChange(
                                                "lat",
                                                parseFloat(e.target.value) || 0,
                                            )
                                        }
                                        placeholder="0.0000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold theme-text-muted uppercase tracking-wide mb-1.5">
                                        Bujur
                                    </label>
                                    <FormInput
                                        type="number"
                                        step="any"
                                        value={activeNode.lng || ""}
                                        onChange={(e) =>
                                            handleChange(
                                                "lng",
                                                parseFloat(e.target.value) || 0,
                                            )
                                        }
                                        placeholder="0.0000"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowMapPicker(true)}
                                className="w-full flex items-center justify-center gap-2 h-9 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 theme-text-secondary font-bold text-xs rounded-lg border theme-border transition-all"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    explore
                                </span>
                                Lokasi dari Peta
                            </button>
                        </div>

                        {/* Gateway Toggle */}
                        <div className="space-y-3 pt-4 border-t theme-border">
                            <SectionHeader>Koneksi Gerbang</SectionHeader>
                            <label className="flex items-start gap-3 p-4 bg-gray-100 dark:bg-slate-800/50 rounded-lg border theme-border-subtle cursor-pointer hover:border-primary/30 transition-colors">
                                <div className="flex items-center h-6">
                                    <input
                                        type="checkbox"
                                        checked={
                                            activeNode.can_be_gateway || false
                                        }
                                        onChange={(e) =>
                                            handleChange(
                                                "can_be_gateway",
                                                e.target.checked,
                                            )
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="relative w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-success rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium theme-text">
                                        Izinkan koneksi ke area berbeda
                                    </div>
                                    <p className="text-xs theme-text-muted mt-1">
                                        Aktifkan jika scene berfungsi sebagai
                                        gerbang atau titik masuk antara area
                                        berbeda
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Active Links */}
                        <div className="space-y-3 pt-4 border-t theme-border">
                            <SectionHeader>Link Aktif</SectionHeader>
                            {activeNode.links && activeNode.links.length > 0 ? (
                                <div className="space-y-2">
                                    {activeNode.links.map((link) => (
                                        <div
                                            key={link.id}
                                            className={`p-3 rounded-lg border ${
                                                link.type === "gateway"
                                                    ? "theme-link-gateway"
                                                    : "theme-link-navigation"
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span
                                                    className={`material-symbols-outlined text-lg ${
                                                        link.type === "gateway"
                                                            ? "theme-link-gateway-icon"
                                                            : "theme-link-navigation-icon"
                                                    }`}
                                                >
                                                    {link.type === "gateway"
                                                        ? "door_open"
                                                        : "arrow_forward"}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div
                                                        className={`text-xs font-bold uppercase tracking-wide ${
                                                            link.type ===
                                                            "gateway"
                                                                ? "theme-link-gateway-label"
                                                                : "theme-link-navigation-label"
                                                        }`}
                                                    >
                                                        {link.type === "gateway"
                                                            ? "GATEWAY: "
                                                            : "NAVIGASI: "}
                                                        <span className="theme-text">
                                                            {link.target_name ||
                                                                "Tidak Diketahui"}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] theme-text-muted mt-1 font-mono">
                                                        {link.type === "gateway"
                                                            ? link.target_name
                                                            : link.target_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 px-4 bg-gray-100 dark:bg-slate-800/30 border border-dashed theme-border rounded-lg">
                                    <span className="material-symbols-outlined text-3xl theme-text-subtle mb-2 block">
                                        link_off
                                    </span>
                                    <p className="text-xs theme-text-muted">
                                        Belum ada link
                                    </p>
                                    <p className="text-[10px] theme-text-subtle mt-1">
                                        Gunakan kanvas untuk menambahkan link
                                        navigasi
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ========== AREA-SPECIFIC PROPERTIES ========== */}
                {/* Priority Input - only for areas */}

                {/* Settings Section - Restricted Access (Areas Only) - Lower visual weight */}
                {selection.type === "area" && (
                    <div className="space-y-3">
                        <SectionHeader>Pengaturan</SectionHeader>

                        <label
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                activeNode.is_restricted
                                    ? "bg-amber-50 dark:bg-amber-500/5 border-amber-300 dark:border-amber-500/30"
                                    : "theme-input theme-border hover:border-primary/30"
                            }`}
                        >
                            <div className="pt-0.5">
                                <input
                                    type="checkbox"
                                    className="bg-gray-200 dark:bg-[#233648] border-gray-400 dark:border-slate-600 rounded text-amber-500 focus:ring-0 focus:ring-offset-0"
                                    checked={activeNode.is_restricted || false}
                                    onChange={(e) =>
                                        handleChange(
                                            "is_restricted",
                                            e.target.checked,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 theme-text text-xs font-bold mb-0.5">
                                    <span
                                        className={`material-symbols-outlined text-[16px] ${
                                            activeNode.is_restricted
                                                ? "text-amber-500"
                                                : "theme-text-muted"
                                        }`}
                                    >
                                        lock
                                    </span>
                                    Akses Terbatas
                                </div>
                                <p className="text-[10px] theme-text-muted leading-snug">
                                    Jika dicentang, hanya pegawai atau admin
                                    yang dapat melihat item ini.
                                </p>
                            </div>
                        </label>

                        {/* Hidden Toggle */}
                        <label
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                activeNode.is_hidden
                                    ? "bg-purple-50 dark:bg-purple-500/5 border-purple-300 dark:border-purple-500/30"
                                    : "theme-input theme-border hover:border-primary/30"
                            }`}
                        >
                            <div className="pt-0.5">
                                <input
                                    type="checkbox"
                                    className="bg-gray-200 dark:bg-[#233648] border-gray-400 dark:border-slate-600 rounded text-purple-500 focus:ring-0 focus:ring-offset-0"
                                    checked={activeNode.is_hidden || false}
                                    onChange={(e) =>
                                        handleChange(
                                            "is_hidden",
                                            e.target.checked,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 theme-text text-xs font-bold mb-0.5">
                                    <span
                                        className={`material-symbols-outlined text-[16px] ${
                                            activeNode.is_hidden
                                                ? "text-purple-500"
                                                : "theme-text-muted"
                                        }`}
                                    >
                                        {activeNode.is_hidden
                                            ? "visibility_off"
                                            : "visibility"}
                                    </span>
                                    Sembunyikan Sementara
                                </div>
                                <p className="text-[10px] theme-text-muted leading-snug">
                                    Area ini disembunyikan dari semua pengguna
                                    di tampilan depan.
                                </p>
                            </div>
                        </label>
                    </div>
                )}

                {/* DANGER ZONE - Separated section with intentional friction */}
                <div className="pt-6 mt-6 border-t-2 border-dashed border-red-200 dark:border-red-500/20">
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-3">
                            <span className="material-symbols-outlined text-[14px]">
                                warning
                            </span>
                            Zona Bahaya
                        </h4>
                        <button
                            onClick={handleDeleteClick}
                            className="w-full flex items-center justify-center gap-2 h-10 bg-red-500/10 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white font-bold text-xs rounded-lg border border-red-200 dark:border-red-500/30 hover:border-red-600 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                delete
                            </span>
                            Hapus {selection.type === "area" ? "Area" : "Scene"}
                        </button>
                        <p className="text-[10px] text-red-500/70 dark:text-red-400/50 text-center mt-2">
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal with Cascade Warning */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setDeletionImpact(null);
                }}
                onConfirm={handleDelete}
                title={`Hapus ${selection.type === "area" ? "Area" : "Scene"}?`}
                message={
                    deletionImpact ? (
                        <div className="space-y-4">
                            <p className="text-sm theme-text-secondary">
                                Anda akan menghapus{" "}
                                <span className="font-bold theme-text">
                                    "{deletionImpact.area_name}"
                                </span>
                            </p>

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="material-symbols-outlined text-amber-400 text-xl">
                                        warning
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-amber-500 dark:text-amber-400 mb-1">
                                            Peringatan Penghapusan Bertingkat
                                        </p>
                                        <p className="text-xs theme-text-secondary">
                                            {deletionImpact.warning}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-400 text-base">
                                            domain
                                        </span>
                                        <span className="theme-text-secondary">
                                            <span className="font-bold theme-text">
                                                {deletionImpact.total_areas}
                                            </span>{" "}
                                            area
                                            {deletionImpact.total_areas > 1
                                                ? ""
                                                : ""}{" "}
                                            akan dihapus
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-400 text-base">
                                            360
                                        </span>
                                        <span className="theme-text-secondary">
                                            <span className="font-bold theme-text">
                                                {deletionImpact.total_scenes}
                                            </span>{" "}
                                            scene
                                            {deletionImpact.total_scenes > 1
                                                ? ""
                                                : ""}{" "}
                                            akan dihapus
                                        </span>
                                    </div>
                                </div>

                                {deletionImpact.area_names &&
                                    deletionImpact.area_names.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-amber-500/20">
                                            <p className="text-xs font-bold text-slate-400 mb-2">
                                                Area turunan yang terdampak:
                                            </p>
                                            <div className="max-h-24 overflow-y-auto custom-scrollbar">
                                                <ul className="text-xs text-slate-400 space-y-1">
                                                    {deletionImpact.area_names.map(
                                                        (name, idx) => (
                                                            <li
                                                                key={idx}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <span className="text-amber-400">
                                                                    •
                                                                </span>
                                                                {name}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                            </div>

                            <p className="text-xs theme-text-muted bg-gray-200 dark:bg-slate-800/50 p-3 rounded border theme-border-subtle">
                                <span className="font-bold theme-text">
                                    Peringatan:
                                </span>{" "}
                                Tindakan ini tidak dapat dibatalkan. Semua data
                                dan file akan dihapus secara permanen.
                            </p>
                        </div>
                    ) : (
                        `Apakah Anda yakin ingin menghapus "${
                            activeNode.name
                        }"? Ini juga akan menghapus semua ${
                            selection.type === "area"
                                ? "scene dan link"
                                : "link"
                        } terkait. Tindakan ini tidak dapat dibatalkan.`
                    )
                }
                confirmText={deletionImpact ? "Hapus Semua" : "Hapus"}
                cancelText="Batal"
                variant="danger"
            />

            {/* Map Picker Modal - For Area and Scene GPS Location */}
            <MapPickerModal
                isOpen={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                initialLat={activeNode.lat || -0.953566091006568}
                initialLng={activeNode.lng || 100.46790061740707}
                onConfirm={(coords) => {
                    // Send both lat and lng together in one update
                    onUpdate(selection.id, selection.type, {
                        lat: coords.lat,
                        lng: coords.lng,
                    });
                }}
            />
        </aside>
    );
}

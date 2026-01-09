import React, { useState, useEffect } from "react";
import { FaNetworkWired, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";
import NotificationModal from "@/Components/Editor/NotificationModal";
import ConfirmModal from "@/Components/Editor/ConfirmModal";

export default function AutoLinkModal({ isOpen, onClose, area, onSuccess }) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [replaceMode, setReplaceMode] = useState(false);
    // const [linkAllAreas, setLinkAllAreas] = useState(false); // Removed feature
    const [radius, setRadius] = useState(5); // Default 100 meters

    // Notification modals
    const [showNotification, setShowNotification] = useState(false);
    const [notificationConfig, setNotificationConfig] = useState({
        variant: "success",
        title: "",
        message: "",
    });
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({
        title: "",
        message: "",
        onConfirm: () => {},
    });

    useEffect(() => {
        if (isOpen) {
            fetchPreview();
        } else {
            // Reset Notification on Close
            setShowNotification(false);
            setNotificationConfig({
                variant: "success",
                title: "",
                message: "",
            });
            setLoading(false);
        }
    }, [isOpen, replaceMode]); // Removed radius - no auto refresh on radius change

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                "/admin/visual-editor/api/autolink/execute",
                {
                    area_id: area?.id, // Always scoped to current area
                    replace_existing: replaceMode,
                    preview_only: true,
                    radius: radius,
                }
            );
            setPreview(response.data);
        } catch (error) {
            console.error("Preview failed:", error);
            setNotificationConfig({
                variant: "error",
                title: "Pratinjau Gagal",
                message: error.message,
            });
            setShowNotification(true);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (replaceMode && preview?.existing_links > 0) {
            setConfirmConfig({
                title: "Hapus Link yang Ada?",
                message: `Ini akan MENGHAPUS ${preview.existing_links} Link yang ada dan membuatnya ulang. Lanjutkan?`,
                onConfirm: executeAutoLink,
            });
            setShowConfirm(true);
            return;
        }
        executeAutoLink();
    };

    const executeAutoLink = async () => {
        setExecuting(true);
        try {
            const response = await axios.post(
                "/admin/visual-editor/api/autolink/execute",
                {
                    area_id: area?.id, // Always scoped to current area
                    replace_existing: replaceMode,
                    preview_only: false,
                    radius: radius,
                }
            );

            if (response.data.async) {
                setNotificationConfig({
                    variant: "success",
                    title: "Memproses",
                    message:
                        "Pembuatan Link otomatis sedang berjalan di latar belakang...",
                });
                setShowNotification(true);
            } else {
                const title = replaceMode ? "Link Diganti!" : "Link Dibuat!";
                const message = replaceMode
                    ? `Menghapus ${response.data.deleted_links} Link lama dan membuat ${response.data.total_created} Link baru!\n\n🧭 Navigasi: ${response.data.navigation_links}\n🚪 Gerbang: ${response.data.gateway_links}`
                    : `Membuat ${response.data.total_created} Link baru!\n\n🧭 Navigasi: ${response.data.navigation_links}\n🚪 Gerbang: ${response.data.gateway_links}`;
                setNotificationConfig({ variant: "success", title, message });
                setShowNotification(true);
                setTimeout(() => {
                    onClose();
                    if (onSuccess) onSuccess(response.data);
                    else window.location.reload();
                }, 2500);
                return;
            }

            onClose();
            if (onSuccess) onSuccess(response.data);
            else window.location.reload();
        } catch (error) {
            console.error("Auto-link failed:", error);
            setNotificationConfig({
                variant: "error",
                title: "Link Otomatis Gagal",
                message: error.response?.data?.error || error.message,
            });
            setShowNotification(true);
        } finally {
            setExecuting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="theme-modal-backdrop backdrop-blur-sm">
            <div
                id="modal-auto-link"
                className="w-full max-w-2xl theme-modal overflow-hidden animate-fade-in-up"
            >
                {/* Header */}
                <div className="theme-modal-header flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-action-primary/10 text-action-primary flex items-center justify-center">
                            <FaNetworkWired size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold theme-text">
                                Link Otomatis Scene
                            </h3>
                            {preview && (
                                <p className="text-xs theme-text-muted mt-0.5">
                                    {preview.scope === "universal"
                                        ? "🌍 Semua Area"
                                        : "📂 " +
                                          (area?.name || "Area Terpilih")}{" "}
                                    · {preview.target_areas.length} area
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="theme-text-subtle hover:text-action-primary transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-12 text-center theme-text-muted">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-action-primary"></div>
                            <p className="mt-3 text-sm">Memuat pratinjau...</p>
                        </div>
                    ) : preview ? (
                        <>
                            {/* GPS Accuracy Warning */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 p-4 rounded-lg flex items-start gap-3 border border-slate-200 dark:border-slate-700">
                                <span className="text-xl">ℹ️</span>
                                <div className="text-sm leading-relaxed">
                                    <strong>Penting:</strong> Pastikan semua
                                    scene memiliki GPS dan posisinya akurat.
                                    Perbedaan posisi sekitar 1-5 meter bisa
                                    membuat posisi link berbeda jauh.
                                </div>
                            </div>

                            {/* Mode Toggle */}
                            <div>
                                <label className="theme-section-header block mb-3">
                                    Mode Pembuatan Link
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setReplaceMode(false)}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            !replaceMode
                                                ? "theme-sidebar-item-active"
                                                : "theme-surface-elevated theme-border theme-sidebar-item"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`text-2xl ${
                                                    !replaceMode
                                                        ? "text-action-primary"
                                                        : "theme-text-muted"
                                                }`}
                                            >
                                                ➕
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-bold theme-text text-sm">
                                                    Lewati yang Ada
                                                </div>
                                                <div className="text-xs theme-text-muted mt-1">
                                                    Hanya buat Link baru. Aman
                                                    untuk dijalankan ulang.
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setReplaceMode(true)}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            replaceMode
                                                ? // Using orange for destructive/replace action, but keeping same style pattern
                                                  "bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 border-l-4 border-l-orange-500 border-y border-r border-y-orange-200 dark:border-y-orange-800 border-r-orange-200 dark:border-r-orange-800"
                                                : "theme-surface-elevated theme-border theme-sidebar-item"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`text-2xl ${
                                                    replaceMode
                                                        ? "text-orange-500"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                🔄
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-bold theme-text text-sm">
                                                    Ganti Semua
                                                </div>
                                                <div
                                                    className={`text-xs mt-1  ${
                                                        replaceMode
                                                            ? "text-orange-500"
                                                            : "theme-text-muted"
                                                    }`}
                                                >
                                                    Hapus{" "}
                                                    {preview.existing_links}{" "}
                                                    yang ada, lalu buat ulang.
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Radius Input */}
                            <div>
                                <label className="theme-section-header block mb-2">
                                    Radius Link (meter)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={radius}
                                    onChange={(e) =>
                                        setRadius(
                                            Math.max(
                                                1,
                                                Math.min(
                                                    100,
                                                    parseInt(e.target.value) ||
                                                        1
                                                )
                                            )
                                        )
                                    }
                                    className="theme-form-input"
                                    placeholder="5"
                                />
                                <p className="theme-form-hint">
                                    Jarak maksimum untuk membuat Link antar
                                    scene (1-100 meter)
                                </p>
                            </div>

                            <div className="theme-divider"></div>

                            {/* Preview Stats */}
                            <div>
                                <h4 className="text-sm font-bold theme-text mb-3">
                                    Area Target ({preview.target_areas.length})
                                </h4>
                                <div className="theme-surface-elevated rounded-lg p-4 space-y-2 max-h-32 overflow-y-auto">
                                    {preview.target_areas
                                        .slice(0, 10)
                                        .map((a) => (
                                            <div
                                                key={a.id}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <span className="theme-text-secondary">
                                                    ✓ {a.name}
                                                </span>
                                                <span className="theme-text-subtle text-xs">
                                                    {a.scene_count} scene
                                                </span>
                                            </div>
                                        ))}
                                    {preview.target_areas.length > 10 && (
                                        <div className="text-xs theme-text-subtle text-center pt-2 border-t theme-border">
                                            +{preview.target_areas.length - 10}{" "}
                                            area lainnya
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Warnings */}
                            {preview.scenes_without_gps > 0 && (
                                <div className="theme-alert-warning flex items-start gap-3">
                                    <FaExclamationTriangle className="text-amber-500 dark:text-amber-400 mt-0.5" />
                                    <div className="text-sm theme-text-secondary">
                                        <strong>
                                            {preview.scenes_without_gps}
                                        </strong>{" "}
                                        scene tanpa GPS akan dilewati
                                    </div>
                                </div>
                            )}

                            {preview.gateway_scenes === 0 && (
                                <div className="theme-alert-info text-sm theme-text-secondary">
                                    ℹ️ Tidak ada scene gerbang ditemukan - hanya
                                    Link navigasi yang akan dibuat
                                </div>
                            )}

                            {replaceMode && preview.existing_links > 0 && (
                                <div className="theme-alert-danger flex items-start gap-3">
                                    <FaExclamationTriangle className="text-red-500 dark:text-red-400 mt-0.5" />
                                    <div className="text-sm theme-text-secondary">
                                        <strong>Peringatan:</strong> Ini akan
                                        menghapus secara permanen{" "}
                                        {preview.existing_links} Link yang ada!
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="theme-modal-footer flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={executing}
                        className="theme-btn-secondary disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={
                            executing ||
                            loading ||
                            !preview ||
                            preview.total_scenes === 0
                        }
                        className={`theme-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                            replaceMode
                                ? "!bg-orange-600 hover:!bg-orange-500 shadow-orange-600/20"
                                : ""
                        }`}
                    >
                        {executing ? (
                            <>
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Memproses...
                            </>
                        ) : (
                            <>
                                <FaNetworkWired size={12} />
                                {replaceMode
                                    ? "Hapus & Buat Ulang Link"
                                    : "Buat Link"}{" "}
                                →
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Reusable Modals */}
            <NotificationModal
                isOpen={showNotification}
                onClose={() => setShowNotification(false)}
                title={notificationConfig.title}
                message={notificationConfig.message}
                variant={notificationConfig.variant}
                autoClose={2500}
            />

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant="danger"
                confirmText="Lanjutkan"
                cancelText="Batal"
            />
        </div>
    );
}

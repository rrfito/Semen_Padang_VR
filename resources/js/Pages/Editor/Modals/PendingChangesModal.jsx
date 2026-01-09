import React, { useState, useEffect } from "react";
import axios from "axios";
import ConfirmModal from "@/Components/Editor/ConfirmModal";
import NotificationModal from "@/Components/Editor/NotificationModal";

// Field name translations for admin-friendly display
import { EDITOR_CONFIG } from "@/Config/EditorConfig";

// Field name translations for admin-friendly display
const FIELD_LABELS = EDITOR_CONFIG.STATIC_LABELS;

// Format values for better readability
const formatValue = (field, value) => {
    if (value === null || value === undefined) return "(kosong)";

    // 1. Angle Fields (Radians -> Degrees)
    // Convert 2.48 rad -> ~142 deg
    if (["yaw", "pitch", "heading"].includes(field)) {
        // Ensure it's a number
        const num = parseFloat(value);
        if (isNaN(num)) return value;

        // Conversion: rad * (180/PI)
        const deg = num * (180 / Math.PI);
        return deg.toFixed(1) + "°";
    }

    // Boolean values
    if (
        typeof value === "boolean" ||
        value === "true" ||
        value === "false" ||
        (value === 0 && !["yaw", "pitch", "heading"].includes(field)) || // Exclude angles from this check if somehow code falls through
        (value === 1 && !["yaw", "pitch", "heading"].includes(field))
    ) {
        if (field === "is_restricted") {
            return value ? "🔒 Terbatas" : "🌐 Publik";
        }

        if (field === "is_hidden") {
            return value ? "👁️‍🗨️ Disembunyikan" : "👁️ Terlihat";
        }

        return value ? "Ya" : "Tidak";
    }

    // Coordinates - show with precision
    if (
        field === "lat" ||
        field === "latitude" ||
        field === "lng" ||
        field === "longitude"
    ) {
        return parseFloat(value).toFixed(6);
    }

    // Numbers
    if (typeof value === "number") {
        return value.toString();
    }

    return String(value);
};

// Get human-readable field name
const getFieldLabel = (field) => {
    return (
        FIELD_LABELS[field] ||
        field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
};

export default function PendingChangesModal({
    isOpen,
    onClose,
    onPublished,
    rootId,
}) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ summary: {}, changes: {} });

    // Modal states
    const [showConfirm, setShowConfirm] = useState(false);
    const [notification, setNotification] = useState({
        isOpen: false,
        type: "success",
        message: "",
    });
    const [isPublishing, setIsPublishing] = useState(false); // NEW: Publishing state

    // Expandable timeline states
    const [expandedItems, setExpandedItems] = useState({}); // { changeId: true/false }
    const [timelineVisible, setTimelineVisible] = useState({}); // { changeId: true/false }

    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchChanges();
        } else {
            // Reset Notification on Close
            setNotification({
                isOpen: false,
                type: "success",
                message: "",
            });
            setIsPublishing(false);
        }
    }, [isOpen]);

    const fetchChanges = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                route("admin.editor.pending-changes")
            );
            setData(response.data);
        } catch (error) {
            console.error("Failed to load pending changes", error);
            setNotification({
                isOpen: true,
                type: "error",
                message: "Gagal memuat perubahan tertunda",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = async () => {
        if (!rootId) {
            setNotification({
                isOpen: true,
                type: "error",
                title: "Galat",
                message:
                    "ID Root tidak ditemukan. Tidak dapat membuang perubahan.",
            });
            setShowDiscardConfirm(false);
            return;
        }

        try {
            await axios.post(route("admin.editor.discard-all", rootId));
            // Success
            setNotification({
                isOpen: true,
                type: "success",
                title: "Jalan Dibuang",
                message: "Semua draf telah diatur ulang ke keadaan Live.",
            });
            setShowDiscardConfirm(false);

            // Reload page after short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error("Discard failed", error);
            setNotification({
                isOpen: true,
                type: "error",
                title: "Gagal Membuang",
                message: "Gagal membuang perubahan.",
            });
            setShowDiscardConfirm(false);
        }
    };

    const handlePublishAll = async () => {
        setIsPublishing(true); // Start loading
        try {
            await axios.post(route("admin.editor.publish-all"));

            setNotification({
                isOpen: true,
                type: "success",
                title: "Berhasil Diterbitkan!",
                message: "Semua perubahan sekarang aktif di tur publik",
            });

            // Close confirm modal immediately
            setShowConfirm(false);

            // Close main modal after showing notification (2 seconds)
            setTimeout(() => {
                onClose();
                if (onPublished) onPublished();
            }, 2000);
        } catch (error) {
            console.error("Publish failed:", error);
            setNotification({
                isOpen: true,
                type: "error",
                title: "Gagal Menerbitkan",
                message: "Gagal menerbitkan perubahan. Silakan coba lagi.",
            });
            setShowConfirm(false);
        } finally {
            setIsPublishing(false); // End loading
        }
    };

    // ... (toggle functions remain same)

    const toggleExpand = (changeId) => {
        setExpandedItems((prev) => ({
            ...prev,
            [changeId]: !prev[changeId],
        }));
    };

    const toggleTimeline = (changeId) => {
        setTimelineVisible((prev) => ({
            ...prev,
            [changeId]: !prev[changeId],
        }));
    };

    if (!isOpen) return null;

    // ... (getEventColor remains same)
    const getEventColor = (event) => {
        switch (event) {
            case "created":
                return {
                    bg: "bg-green-500/10",
                    border: "border-green-500/30",
                    text: "text-green-400",
                    icon: "add_circle",
                };
            case "updated":
                return {
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/30",
                    text: "text-amber-400",
                    icon: "edit",
                };
            case "deleted":
                return {
                    bg: "bg-red-500/10",
                    border: "border-red-500/30",
                    text: "text-red-400",
                    icon: "delete",
                };
            default:
                return {
                    bg: "bg-slate-500/10",
                    border: "border-slate-500/30",
                    text: "text-slate-400",
                    icon: "circle",
                };
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
            <div
                id="modal-pending-changes"
                className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-border-light dark:border-border-dark"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-gray-100 dark:bg-[#15202b]">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            📋 Perubahan Tertunda
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            Tinjau perubahan yang belum diterbitkan sebelum
                            membuatnya aktif
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Stats Summary - Purple/Cyan/Indigo/Pink */}
                {!loading && (
                    <div className="px-6 py-4 bg-gray-200/50 dark:bg-[#111a22] border-b border-border-light dark:border-border-dark grid grid-cols-4 gap-4">
                        {/* ... Stats ... */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {data.summary.total_changes || 0}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                Total Perubahan
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {data.summary.areas_count || 0}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                Area
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {data.summary.scenes_count || 0}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                Scene
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                                {data.summary.links_count || 0}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                Link
                            </div>
                        </div>
                    </div>
                )}

                {/* Changes List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* ... List Logic (unchanged essentially) ... */}
                    {loading ? (
                        <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                            Loading...
                        </div>
                    ) : data.summary.total_changes === 0 ? (
                        <div className="text-center py-12">
                            {/* ... No Changes ... */}
                            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-slate-700 mb-4 block">
                                check_circle
                            </span>
                            <p className="text-lg text-gray-500 dark:text-slate-400 font-medium">
                                Tidak Ada Perubahan Tertunda
                            </p>
                            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">
                                Semua perubahan telah diterbitkan
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* ... Render Changes ... */}
                            {Object.entries(data.changes).map(
                                ([type, changes]) => (
                                    <div key={type}>
                                        <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">
                                                {type === "Area"
                                                    ? "domain"
                                                    : type === "Scene"
                                                    ? "360"
                                                    : "link"}
                                            </span>
                                            {/* ... */}
                                            {type} ({changes.length} perubahan)
                                        </h3>
                                        <div className="space-y-3">
                                            {changes.map((change) => {
                                                const colors = getEventColor(
                                                    change.event
                                                );
                                                return (
                                                    <div
                                                        key={change.id}
                                                        className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                                                    >
                                                        {/* ... Change Item ... */}
                                                        <div className="flex items-start gap-3">
                                                            <span
                                                                className={`material-symbols-outlined ${colors.text} mt-0.5`}
                                                            >
                                                                {colors.icon}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="text-sm font-medium text-gray-800 dark:text-white flex-1">
                                                                        {
                                                                            change.description
                                                                        }
                                                                    </div>
                                                                    {/* ... Badges ... */}
                                                                </div>
                                                                {/* ... Details ... */}
                                                                <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                                                    {change.edit_count >
                                                                    1 ? (
                                                                        <>
                                                                            Edit
                                                                            pertama{" "}
                                                                            {
                                                                                change.oldest_edit
                                                                            }{" "}
                                                                            ·
                                                                            Terakhir{" "}
                                                                            {
                                                                                change.created_at
                                                                            }{" "}
                                                                            ·
                                                                            oleh{" "}
                                                                            {
                                                                                change.causer_name
                                                                            }
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {
                                                                                change.created_at
                                                                            }{" "}
                                                                            ·
                                                                            oleh{" "}
                                                                            {
                                                                                change.causer_name
                                                                            }
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* Expandable and Details */}
                                                                {(expandedItems[
                                                                    change.id
                                                                ] ||
                                                                    change.edit_count ===
                                                                        1) && (
                                                                    <div className="mt-3 space-y-3">
                                                                        {/* ... Field Details ... */}
                                                                        {change.event ===
                                                                            "updated" &&
                                                                            change.change_details &&
                                                                            change
                                                                                .change_details
                                                                                .length >
                                                                                0 && (
                                                                                <div>
                                                                                    {/* ... */}
                                                                                    <div className="text-xs text-slate-400 font-bold mb-2">
                                                                                        Bidang
                                                                                        berubah:
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        {change.change_details.map(
                                                                                            (
                                                                                                detail,
                                                                                                idx
                                                                                            ) => (
                                                                                                <div
                                                                                                    key={
                                                                                                        idx
                                                                                                    }
                                                                                                    className="text-xs bg-surface-light dark:bg-surface-dark rounded px-3 py-2 border border-slate-700"
                                                                                                >
                                                                                                    <div className="text-slate-400 font-bold mb-1">
                                                                                                        {getFieldLabel(
                                                                                                            detail.field
                                                                                                        )}

                                                                                                        :
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="text-red-400 line-through flex-1 break-all">
                                                                                                            {formatValue(
                                                                                                                detail.field,
                                                                                                                detail.old
                                                                                                            )}
                                                                                                        </span>
                                                                                                        <span className="text-slate-600">
                                                                                                            →
                                                                                                        </span>
                                                                                                        <span className="text-green-400 flex-1 break-all">
                                                                                                            {formatValue(
                                                                                                                detail.field,
                                                                                                                detail.new
                                                                                                            )}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-between bg-gray-100 dark:bg-[#111a22]">
                    {/* Discard Button (Far Left) */}
                    <button
                        id="btn-discard-all"
                        onClick={() => setShowDiscardConfirm(true)}
                        disabled={loading || data.summary.total_changes === 0}
                        className="theme-btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined">
                            delete_forever
                        </span>
                        Buang Semua
                    </button>

                    <div className="flex gap-3">
                        <button
                            id="btn-publish"
                            onClick={() => setShowConfirm(true)}
                            disabled={
                                loading || data.summary.total_changes === 0
                            }
                            className="theme-btn-submit flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                publish
                            </span>
                            <span>
                                Terbitkan Semua (
                                {data.summary.total_changes || 0})
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirm Publish Modal */}
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handlePublishAll}
                title="Terbitkan Semua Perubahan?"
                message={`Ini akan menerbitkan ${data.summary.total_changes} perubahan ke tur publik. Apakah Anda yakin?`}
                confirmText="Terbitkan Sekarang"
                cancelText="Batal"
                variant="warning"
            />

            {/* Confirm Discard Modal */}
            <ConfirmModal
                isOpen={showDiscardConfirm}
                onClose={() => setShowDiscardConfirm(false)}
                onConfirm={handleDiscard}
                title="Buang Semua Draf?"
                message="Apakah Anda yakin ingin membuang SEMUA perubahan yang belum diterbitkan? Ini akan mengembalikan semuanya ke versi Live. Ini tidak dapat dibatalkan."
                confirmText="Buang & Atur Ulang"
                cancelText="Batal"
                variant="danger"
            />

            {/* Notification Modal */}
            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() =>
                    setNotification((prev) => ({ ...prev, isOpen: false }))
                }
                title={notification.title}
                message={notification.message}
                variant={notification.type}
                autoClose={3000}
            />
        </div>
    );
}

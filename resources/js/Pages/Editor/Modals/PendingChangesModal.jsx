import React, { useState, useEffect } from "react";
import axios from "axios";
import ConfirmModal from "@/Components/Editor/ConfirmModal";
import NotificationModal from "@/Components/Editor/NotificationModal";

// Field name translations for admin-friendly display
const FIELD_LABELS = {
    // Common fields
    name: "Nama",
    description: "Deskripsi",
    slug: "URL Slug",

    // Area fields
    parent_id: "Parent Area",
    level: "Level Hierarki",
    priority: "Urutan Prioritas",
    content_type: "Tipe Konten",
    is_restricted: "Status Akses",

    // Location fields
    lat: "Latitude (Koordinat)",
    latitude: "Latitude (Koordinat)",
    lng: "Longitude (Koordinat)",
    longitude: "Longitude (Koordinat)",

    // Scene fields
    area_id: "Area",
    image_path: "Path Gambar",
    heading: "Arah Pandang",
    fov: "Field of View",

    // Link fields
    source_scene_id: "Scene Asal",
    target_scene_id: "Scene Tujuan",
    yaw: "Yaw (Rotasi)",
    pitch: "Pitch (Elevasi)",

    // Timestamps
    created_at: "Tanggal Dibuat",
    updated_at: "Tanggal Diubah",
    is_published: "Status Publikasi",
    last_published_at: "Terakhir Dipublikasi",
};

// Format values for better readability
const formatValue = (field, value) => {
    if (value === null || value === undefined) return "(kosong)";

    // Boolean values
    if (
        typeof value === "boolean" ||
        value === "true" ||
        value === "false" ||
        value === 0 ||
        value === 1
    ) {
        if (field === "is_restricted") {
            return value ? "🔒 Terbatas" : "🌐 Publik";
        }
        if (field === "is_published") {
            return value ? "✅ Published" : "⏳ Draft";
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

export default function PendingChangesModal({ isOpen, onClose, onPublished }) {
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

    useEffect(() => {
        if (isOpen) fetchChanges();
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
                message: "Failed to load pending changes",
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePublishAll = async () => {
        setIsPublishing(true); // Start loading
        try {
            await axios.post(route("admin.editor.publish-all"));

            setNotification({
                isOpen: true,
                type: "success",
                title: "Published Successfully!",
                message: "All changes are now live on the public tour",
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
                title: "Publish Failed",
                message: "Failed to publish changes. Please try again.",
            });
            setShowConfirm(false);
        } finally {
            setIsPublishing(false); // End loading
        }
    };

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

    // Event colors (create/update/delete badges)
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-dark rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-border-dark">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between bg-[#15202b]">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            📋 Pending Changes
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Review unpublished changes before making them live
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Stats Summary - Purple/Cyan/Indigo/Pink */}
                {!loading && (
                    <div className="px-6 py-4 bg-[#111a22] border-b border-border-dark grid grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">
                                {data.summary.total_changes || 0}
                            </div>
                            <div className="text-xs text-slate-400">
                                Total Changes
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">
                                {data.summary.areas_count || 0}
                            </div>
                            <div className="text-xs text-slate-400">Areas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-400">
                                {data.summary.scenes_count || 0}
                            </div>
                            <div className="text-xs text-slate-400">Scenes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-pink-400">
                                {data.summary.links_count || 0}
                            </div>
                            <div className="text-xs text-slate-400">Links</div>
                        </div>
                    </div>
                )}

                {/* Changes List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-12 text-slate-400">
                            Loading...
                        </div>
                    ) : data.summary.total_changes === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-slate-700 mb-4 block">
                                check_circle
                            </span>
                            <p className="text-lg text-slate-400 font-medium">
                                No Pending Changes
                            </p>
                            <p className="text-sm text-slate-500 mt-2">
                                All changes have been published
                            </p>
                        </div>
                    ) : (
                        <>
                            {Object.entries(data.changes).map(
                                ([type, changes]) => (
                                    <div key={type}>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">
                                                {type === "Area"
                                                    ? "domain"
                                                    : type === "Scene"
                                                    ? "360"
                                                    : "link"}
                                            </span>
                                            {type}s ({changes.length} changes)
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
                                                        <div className="flex items-start gap-3">
                                                            <span
                                                                className={`material-symbols-outlined ${colors.text} mt-0.5`}
                                                            >
                                                                {colors.icon}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="text-sm font-medium text-white flex-1">
                                                                        {
                                                                            change.description
                                                                        }
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {/* Show edit count if multiple edits */}
                                                                        {change.edit_count >
                                                                            1 && (
                                                                            <span className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-300 border border-slate-600">
                                                                                {
                                                                                    change.edit_count
                                                                                }{" "}
                                                                                edits
                                                                            </span>
                                                                        )}
                                                                        <span
                                                                            className={`text-xs font-bold uppercase px-2 py-1 rounded ${colors.bg} ${colors.text} border ${colors.border}`}
                                                                        >
                                                                            {
                                                                                change.event
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-slate-500 mt-1">
                                                                    {change.edit_count >
                                                                    1 ? (
                                                                        <>
                                                                            First
                                                                            edit{" "}
                                                                            {
                                                                                change.oldest_edit
                                                                            }{" "}
                                                                            ·
                                                                            Latest{" "}
                                                                            {
                                                                                change.created_at
                                                                            }{" "}
                                                                            · by{" "}
                                                                            {
                                                                                change.causer_name
                                                                            }
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {
                                                                                change.created_at
                                                                            }{" "}
                                                                            · by{" "}
                                                                            {
                                                                                change.causer_name
                                                                            }
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* Expandable button for multiple edits */}
                                                                {change.edit_count >
                                                                    1 && (
                                                                    <button
                                                                        onClick={() =>
                                                                            toggleExpand(
                                                                                change.id
                                                                            )
                                                                        }
                                                                        className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">
                                                                            {expandedItems[
                                                                                change
                                                                                    .id
                                                                            ]
                                                                                ? "expand_less"
                                                                                : "expand_more"}
                                                                        </span>
                                                                        {expandedItems[
                                                                            change
                                                                                .id
                                                                        ]
                                                                            ? "Hide Changes"
                                                                            : "Show Changes"}
                                                                    </button>
                                                                )}

                                                                {/* Expanded view: Show summary and timeline */}
                                                                {expandedItems[
                                                                    change.id
                                                                ] && (
                                                                    <div className="mt-3 space-y-3">
                                                                        {/* Summary of changed fields */}
                                                                        {change.event ===
                                                                            "updated" &&
                                                                            change.change_details &&
                                                                            change
                                                                                .change_details
                                                                                .length >
                                                                                0 && (
                                                                                <div>
                                                                                    <div className="text-xs text-slate-400 font-bold mb-2">
                                                                                        Fields
                                                                                        changed:
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
                                                                                                    className="text-xs bg-slate-900/50 rounded px-3 py-2 border border-slate-700"
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

                                                                        {/* Timeline toggle button */}
                                                                        {change.timeline &&
                                                                            change
                                                                                .timeline
                                                                                .length >
                                                                                0 && (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        toggleTimeline(
                                                                                            change.id
                                                                                        )
                                                                                    }
                                                                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-sm">
                                                                                        schedule
                                                                                    </span>
                                                                                    {timelineVisible[
                                                                                        change
                                                                                            .id
                                                                                    ]
                                                                                        ? "Hide Full Timeline"
                                                                                        : "Show Full Timeline"}
                                                                                </button>
                                                                            )}

                                                                        {/* Full Timeline */}
                                                                        {timelineVisible[
                                                                            change
                                                                                .id
                                                                        ] &&
                                                                            change.timeline && (
                                                                                <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700">
                                                                                    <div className="text-xs text-slate-400 font-bold mb-2">
                                                                                        Edit
                                                                                        Timeline:
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        {change.timeline.map(
                                                                                            (
                                                                                                entry,
                                                                                                idx
                                                                                            ) => (
                                                                                                <div
                                                                                                    key={
                                                                                                        idx
                                                                                                    }
                                                                                                    className="border-l-2 border-slate-600 pl-3 pb-2 last:pb-0"
                                                                                                >
                                                                                                    <div className="text-xs text-slate-400 font-medium mb-1">
                                                                                                        📅{" "}
                                                                                                        {
                                                                                                            entry.timestamp
                                                                                                        }
                                                                                                    </div>
                                                                                                    {entry.changes &&
                                                                                                        entry
                                                                                                            .changes
                                                                                                            .length >
                                                                                                            0 && (
                                                                                                            <div className="space-y-1">
                                                                                                                {entry.changes.map(
                                                                                                                    (
                                                                                                                        ch,
                                                                                                                        chIdx
                                                                                                                    ) => (
                                                                                                                        <div
                                                                                                                            key={
                                                                                                                                chIdx
                                                                                                                            }
                                                                                                                            className="text-xs ml-2"
                                                                                                                        >
                                                                                                                            <span className="text-slate-500">
                                                                                                                                {getFieldLabel(
                                                                                                                                    ch.field
                                                                                                                                )}

                                                                                                                                :
                                                                                                                            </span>
                                                                                                                            <span className="text-red-400 mx-1">
                                                                                                                                {formatValue(
                                                                                                                                    ch.field,
                                                                                                                                    ch.old
                                                                                                                                )}
                                                                                                                            </span>
                                                                                                                            <span className="text-slate-600">
                                                                                                                                →
                                                                                                                            </span>
                                                                                                                            <span className="text-green-400 mx-1">
                                                                                                                                {formatValue(
                                                                                                                                    ch.field,
                                                                                                                                    ch.new
                                                                                                                                )}
                                                                                                                            </span>
                                                                                                                        </div>
                                                                                                                    )
                                                                                                                )}
                                                                                                            </div>
                                                                                                        )}
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
                <div className="px-6 py-4 border-t border-border-dark flex items-center justify-between bg-[#111a22]">
                    <div className="text-xs text-slate-500">
                        {data.summary.oldest_change && (
                            <>Oldest: {data.summary.oldest_change}</>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors font-medium"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={data.summary.total_changes === 0}
                            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                publish
                            </span>
                            <span>
                                Publish All ({data.summary.total_changes})
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handlePublishAll}
                title="Publish All Changes?"
                message={`This will publish ${data.summary.total_changes} changes to the public tour. Are you sure?`}
                confirmText="Publish Now"
                cancelText="Cancel"
                variant="warning"
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

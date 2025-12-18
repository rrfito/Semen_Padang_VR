import React, { useState, useEffect } from "react";
import { FaNetworkWired, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";

export default function AutoLinkModal({ isOpen, onClose, area }) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [replaceMode, setReplaceMode] = useState(false);
    const [linkAllAreas, setLinkAllAreas] = useState(false);
    const [radius, setRadius] = useState(100); // Default 100 meters
    const [notification, setNotification] = useState(null); // {type: 'success'|'error'|'confirm', title, message, onConfirm}

    useEffect(() => {
        if (isOpen) {
            fetchPreview();
        }
    }, [isOpen, replaceMode, linkAllAreas]); // Removed radius - no auto refresh on radius change

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                "/admin/visual-editor/api/autolink/execute",
                {
                    area_id: linkAllAreas ? null : area?.id,
                    replace_existing: replaceMode,
                    preview_only: true,
                    radius: radius,
                }
            );
            setPreview(response.data);
        } catch (error) {
            console.error("Preview failed:", error);
            setNotification({
                type: "error",
                title: "Preview Failed",
                message: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (replaceMode && preview?.existing_links > 0) {
            setNotification({
                type: "confirm",
                title: "Delete Existing Links?",
                message: `This will DELETE ${preview.existing_links} existing links and recreate them. Continue?`,
                onConfirm: () => {
                    setNotification(null);
                    executeAutoLink();
                },
            });
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
                    area_id: linkAllAreas ? null : area?.id,
                    replace_existing: replaceMode,
                    preview_only: false,
                    radius: radius,
                }
            );

            if (response.data.async) {
                setNotification({
                    type: "success",
                    title: "Processing",
                    message: "Auto-link processing in background...",
                });
            } else {
                const title = replaceMode
                    ? "Links Replaced!"
                    : "Links Created!";
                const message = replaceMode
                    ? `Deleted ${response.data.deleted_links} old links and created ${response.data.total_created} new links!\n\n🧭 Navigation: ${response.data.navigation_links}\n🚪 Gateway: ${response.data.gateway_links}`
                    : `Created ${response.data.total_created} new links!\n\n🧭 Navigation: ${response.data.navigation_links}\n🚪 Gateway: ${response.data.gateway_links}`;
                setNotification({
                    type: "success",
                    title,
                    message,
                    onClose: () => {
                        setNotification(null);
                        onClose();
                        window.location.reload();
                    },
                });
                return; // Don't auto-close, wait for user to dismiss notification
            }

            onClose();
            window.location.reload();
        } catch (error) {
            console.error("Auto-link failed:", error);
            setNotification({
                type: "error",
                title: "Auto-Link Failed",
                message: error.response?.data?.error || error.message,
            });
        } finally {
            setExecuting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <FaNetworkWired size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                Auto-Link Scenes
                            </h3>
                            {preview && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {preview.scope === "universal"
                                        ? "🌍 All Areas"
                                        : "📂 " +
                                          (area?.name || "Selected Area")}{" "}
                                    · {preview.target_areas.length} areas
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="mt-3 text-sm">Loading preview...</p>
                        </div>
                    ) : preview ? (
                        <>
                            {/* Universal Toggle */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={linkAllAreas}
                                        onChange={(e) =>
                                            setLinkAllAreas(e.target.checked)
                                        }
                                        className="mt-0.5 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-white text-sm">
                                            Link in all areas
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {linkAllAreas
                                                ? `Process all areas in the database (Universal mode)`
                                                : `Process only "${
                                                      area?.name ||
                                                      "selected area"
                                                  }" and its descendants (Recursive mode)`}
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Mode Toggle */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-3">
                                    Link Creation Mode
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setReplaceMode(false)}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            !replaceMode
                                                ? "border-blue-500 bg-blue-500/10"
                                                : "border-gray-700 bg-gray-800 hover:border-gray-600"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`text-2xl ${
                                                    !replaceMode
                                                        ? "text-blue-500"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                ➕
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-bold text-white text-sm">
                                                    Skip Existing
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Only create new links. Safe
                                                    to re-run.
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setReplaceMode(true)}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            replaceMode
                                                ? "border-orange-500 bg-orange-500/10"
                                                : "border-gray-700 bg-gray-800 hover:border-gray-600"
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
                                                <div className="font-bold text-white text-sm">
                                                    Replace All
                                                </div>
                                                <div
                                                    className={`text-xs mt-1  ${
                                                        replaceMode
                                                            ? "text-orange-400"
                                                            : "text-gray-400"
                                                    }`}
                                                >
                                                    Delete{" "}
                                                    {preview.existing_links}{" "}
                                                    existing, then recreate.
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Radius Input */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">
                                    Link Radius (meters)
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
                                                        5
                                                )
                                            )
                                        )
                                    }
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="5"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Maximum distance to create links between
                                    scenes (1-100 meters)
                                </p>
                            </div>

                            <div className="border-t border-gray-700"></div>

                            {/* Preview Stats */}
                            <div>
                                <h4 className="text-sm font-bold text-white mb-3">
                                    Target Areas ({preview.target_areas.length})
                                </h4>
                                <div className="bg-gray-800 rounded-lg p-4 space-y-2 max-h-32 overflow-y-auto">
                                    {preview.target_areas
                                        .slice(0, 10)
                                        .map((a) => (
                                            <div
                                                key={a.id}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <span className="text-gray-300">
                                                    ✓ {a.name}
                                                </span>
                                                <span className="text-gray-500 text-xs">
                                                    {a.scene_count} scenes
                                                </span>
                                            </div>
                                        ))}
                                    {preview.target_areas.length > 10 && (
                                        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
                                            +{preview.target_areas.length - 10}{" "}
                                            more areas
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Warnings */}
                            {preview.scenes_without_gps > 0 && (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                                    <FaExclamationTriangle className="text-yellow-500 mt-0.5" />
                                    <div className="text-sm text-yellow-200">
                                        <strong>
                                            {preview.scenes_without_gps}
                                        </strong>{" "}
                                        scenes without GPS will be skipped
                                    </div>
                                </div>
                            )}

                            {preview.gateway_scenes === 0 && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-200">
                                    ℹ️ No gateway scenes found - only navigation
                                    links will be created
                                </div>
                            )}

                            {replaceMode && preview.existing_links > 0 && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                                    <FaExclamationTriangle className="text-red-500 mt-0.5" />
                                    <div className="text-sm text-red-200">
                                        <strong>Warning:</strong> This will
                                        permanently delete{" "}
                                        {preview.existing_links} existing links!
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-700 bg-gray-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={executing}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={
                            executing ||
                            loading ||
                            !preview ||
                            preview.total_scenes === 0
                        }
                        className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            replaceMode
                                ? "bg-orange-600 hover:bg-orange-500 shadow-orange-600/20"
                                : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                        }`}
                    >
                        {executing ? (
                            <>
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <FaNetworkWired size={12} />
                                {replaceMode
                                    ? "Delete & Recreate Links"
                                    : "Create Links"}{" "}
                                →
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Custom Notification Modal */}
            {notification && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
                    onClick={() =>
                        notification.type !== "confirm" && setNotification(null)
                    }
                >
                    <div
                        className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={`px-6 py-4 border-b flex items-center gap-3 ${
                                notification.type === "error"
                                    ? "border-red-500/30 bg-red-500/10"
                                    : notification.type === "confirm"
                                    ? "border-orange-500/30 bg-orange-500/10"
                                    : "border-green-500/30 bg-green-500/10"
                            }`}
                        >
                            <div className="text-3xl">
                                {notification.type === "error" && "❌"}
                                {notification.type === "confirm" && "⚠️"}
                                {notification.type === "success" && "✅"}
                            </div>
                            <h3 className="text-lg font-bold text-white">
                                {notification.title}
                            </h3>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-gray-300 whitespace-pre-line">
                                {notification.message}
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-700 flex gap-3 justify-end">
                            {notification.type === "confirm" ? (
                                <>
                                    <button
                                        onClick={() => setNotification(null)}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={notification.onConfirm}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
                                    >
                                        Continue
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (notification.onClose) {
                                            notification.onClose();
                                        } else {
                                            setNotification(null);
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${
                                        notification.type === "error"
                                            ? "bg-red-500 hover:bg-red-600"
                                            : "bg-green-500 hover:bg-green-600"
                                    } text-white`}
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

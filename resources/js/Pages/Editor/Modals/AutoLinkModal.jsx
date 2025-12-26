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
    const [linkAllAreas, setLinkAllAreas] = useState(false);
    const [radius, setRadius] = useState(100); // Default 100 meters

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
            setNotificationConfig({
                variant: "error",
                title: "Preview Failed",
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
                title: "Delete Existing Links?",
                message: `This will DELETE ${preview.existing_links} existing links and recreate them. Continue?`,
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
                    area_id: linkAllAreas ? null : area?.id,
                    replace_existing: replaceMode,
                    preview_only: false,
                    radius: radius,
                }
            );

            if (response.data.async) {
                setNotificationConfig({
                    variant: "success",
                    title: "Processing",
                    message: "Auto-link processing in background...",
                });
                setShowNotification(true);
            } else {
                const title = replaceMode
                    ? "Links Replaced!"
                    : "Links Created!";
                const message = replaceMode
                    ? `Deleted ${response.data.deleted_links} old links and created ${response.data.total_created} new links!\n\n🧭 Navigation: ${response.data.navigation_links}\n🚪 Gateway: ${response.data.gateway_links}`
                    : `Created ${response.data.total_created} new links!\n\n🧭 Navigation: ${response.data.navigation_links}\n🚪 Gateway: ${response.data.gateway_links}`;
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
                title: "Auto-Link Failed",
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
            <div className="w-full max-w-2xl theme-modal overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="theme-modal-header flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <FaNetworkWired size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold theme-text">
                                Auto-Link Scenes
                            </h3>
                            {preview && (
                                <p className="text-xs theme-text-muted mt-0.5">
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
                        className="theme-text-subtle hover:text-primary transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-12 text-center theme-text-muted">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="mt-3 text-sm">Loading preview...</p>
                        </div>
                    ) : preview ? (
                        <>
                            {/* Universal Toggle */}
                            <div className="theme-alert-info">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={linkAllAreas}
                                        onChange={(e) =>
                                            setLinkAllAreas(e.target.checked)
                                        }
                                        className="mt-0.5 w-4 h-4 rounded border-gray-400 dark:border-gray-600 text-primary focus:ring-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold theme-text text-sm">
                                            Link in all areas
                                        </div>
                                        <div className="text-xs theme-text-muted mt-1">
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
                                <label className="theme-section-header block mb-3">
                                    Link Creation Mode
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setReplaceMode(false)}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            !replaceMode
                                                ? "border-primary bg-primary/10"
                                                : "theme-border bg-gray-100 dark:bg-gray-800 hover:border-primary/50"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`text-2xl ${
                                                    !replaceMode
                                                        ? "text-primary"
                                                        : "theme-text-muted"
                                                }`}
                                            >
                                                ➕
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-bold theme-text text-sm">
                                                    Skip Existing
                                                </div>
                                                <div className="text-xs theme-text-muted mt-1">
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
                                                : "theme-border bg-gray-100 dark:bg-gray-800 hover:border-orange-300"
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
                                                    Replace All
                                                </div>
                                                <div
                                                    className={`text-xs mt-1  ${
                                                        replaceMode
                                                            ? "text-orange-500"
                                                            : "theme-text-muted"
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
                                <label className="theme-section-header block mb-2">
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
                                    className="theme-form-input"
                                    placeholder="5"
                                />
                                <p className="theme-form-hint">
                                    Maximum distance to create links between
                                    scenes (1-100 meters)
                                </p>
                            </div>

                            <div className="theme-divider"></div>

                            {/* Preview Stats */}
                            <div>
                                <h4 className="text-sm font-bold theme-text mb-3">
                                    Target Areas ({preview.target_areas.length})
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
                                                    {a.scene_count} scenes
                                                </span>
                                            </div>
                                        ))}
                                    {preview.target_areas.length > 10 && (
                                        <div className="text-xs theme-text-subtle text-center pt-2 border-t theme-border">
                                            +{preview.target_areas.length - 10}{" "}
                                            more areas
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
                                        scenes without GPS will be skipped
                                    </div>
                                </div>
                            )}

                            {preview.gateway_scenes === 0 && (
                                <div className="theme-alert-info text-sm theme-text-secondary">
                                    ℹ️ No gateway scenes found - only navigation
                                    links will be created
                                </div>
                            )}

                            {replaceMode && preview.existing_links > 0 && (
                                <div className="theme-alert-danger flex items-start gap-3">
                                    <FaExclamationTriangle className="text-red-500 dark:text-red-400 mt-0.5" />
                                    <div className="text-sm theme-text-secondary">
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
                <div className="theme-modal-footer flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={executing}
                        className="theme-btn-secondary disabled:opacity-50"
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
                        className={`theme-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                            replaceMode
                                ? "!bg-orange-600 hover:!bg-orange-500 shadow-orange-600/20"
                                : ""
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
                confirmText="Continue"
                cancelText="Cancel"
            />
        </div>
    );
}

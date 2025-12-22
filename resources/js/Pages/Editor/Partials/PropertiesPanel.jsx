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
}) {
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
                            Getting Started
                        </h2>
                        <p className="text-xs font-medium theme-text-muted mt-0.5">
                            Quick Start Guide
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <h3 className="theme-section-header mb-4">
                        Workflow Steps
                    </h3>
                    <ul className="space-y-6 relative">
                        <div className="absolute left-[11px] top-2 bottom-4 w-px theme-border -z-10"></div>
                        <li className="flex gap-4 items-start">
                            <span className="flex items-center justify-center size-6 rounded-full theme-icon-bg theme-text-secondary text-xs font-bold shrink-0 border theme-border">
                                1
                            </span>
                            <div className="pt-0.5">
                                <p className="text-sm font-medium theme-text-secondary">
                                    Create or select an Area
                                </p>
                                <p className="text-xs theme-text-muted mt-1">
                                    Define the structure of your location.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="flex items-center justify-center size-6 rounded-full bg-gray-100 dark:bg-[#233648] text-gray-600 dark:text-slate-300 text-xs font-bold shrink-0 border border-gray-200 dark:border-slate-600">
                                2
                            </span>
                            <div className="pt-0.5">
                                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                    Upload scenes
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                    Upload 360° panoramas or splats.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="flex items-center justify-center size-6 rounded-full bg-gray-100 dark:bg-[#233648] text-gray-600 dark:text-slate-300 text-xs font-bold shrink-0 border border-gray-200 dark:border-slate-600">
                                3
                            </span>
                            <div className="pt-0.5">
                                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                    Link scenes
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                    Use auto-link to connect viewpoints.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="flex items-center justify-center size-6 rounded-full bg-gray-100 dark:bg-[#233648] text-gray-600 dark:text-slate-300 text-xs font-bold shrink-0 border border-gray-200 dark:border-slate-600">
                                4
                            </span>
                            <div className="pt-0.5">
                                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                    Review and publish
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                    Make your tour live for users.
                                </p>
                            </div>
                        </li>
                    </ul>
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-border-dark">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3">
                            Legend
                        </h3>
                        <div className="bg-gray-100 dark:bg-[#111a22] rounded-lg p-3 space-y-2 border border-gray-200 dark:border-border-dark">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-amber-500 text-[20px]">
                                    domain
                                </span>
                                <span className="text-sm text-gray-700 dark:text-slate-300">
                                    <span className="font-bold">Area</span> =
                                    Room / Location
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-action-primary text-[20px]">
                                    360
                                </span>
                                <span className="text-sm text-gray-700 dark:text-slate-300">
                                    <span className="font-bold">Scene</span> =
                                    Viewpoint inside
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

    const handleDeleteClick = async () => {
        // For scenes, directly show confirmation
        if (selection.type === "scene") {
            setShowDeleteConfirm(true);
            return;
        }

        // For areas, fetch deletion impact first
        try {
            const response = await axios.get(
                route("admin.editor.area.deletion-impact", selection.id)
            );

            // Show confirmation modal with impact data
            setDeletionImpact(response.data);
            setShowDeleteConfirm(true);
        } catch (error) {
            console.error("Failed to fetch deletion impact:", error);
            alert("Failed to fetch deletion information. Please try again.");
        }
    };

    const handleDelete = async () => {
        if (selection.type === "area" && deletionImpact) {
            // Cascade delete with force parameter
            try {
                await axios.delete(
                    route("admin.editor.area.destroy", selection.id) +
                        "?force=true"
                );
                setShowDeleteConfirm(false);
                setDeletionImpact(null);

                // Reload page to refresh hierarchy after cascade deletion
                window.location.href = route("admin.editor.index");
            } catch (error) {
                console.error("Delete failed:", error);
                alert("Failed to delete area. Please try again.");
                setShowDeleteConfirm(false);
                setDeletionImpact(null);
            }
        } else {
            // Normal delete for scenes or empty areas (handled by parent)
            onDelete(selection.id, selection.type);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <aside className="w-80 flex flex-col border-l theme-border theme-surface z-10 font-sans">
            {/* Header */}
            <div className="px-6 py-6 border-b theme-border flex items-start gap-4">
                <div
                    className={`mt-1 size-10 flex items-center justify-center rounded-xl shadow-lg border border-white/5 ${
                        selection.type === "area"
                            ? "bg-amber-500 text-white"
                            : "bg-primary text-white"
                    } shrink-0`}
                >
                    <span className="material-symbols-outlined text-xl">
                        {selection.type === "area" ? "domain" : "360"}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold theme-text leading-tight truncate">
                        {activeNode.name}
                    </h2>
                    <p className="text-xs font-bold theme-text-muted uppercase tracking-wider mt-1">
                        {selection.type === "area"
                            ? "Area Properties"
                            : "Scene Properties"}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* 1. Scene/Area Name */}
                <div className="space-y-3">
                    <SectionHeader>
                        {selection.type === "area" ? "Area Name" : "Scene Name"}
                    </SectionHeader>
                    <FormInput
                        value={activeNode.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder={
                            selection.type === "area"
                                ? "Enter area name"
                                : "Enter scene name"
                        }
                    />
                </div>

                {/* 2. Description - ONLY for Areas */}
                {selection.type === "area" && (
                    <div className="space-y-3">
                        <SectionHeader>Description</SectionHeader>
                        <FormTextarea
                            value={activeNode.description || ""}
                            onChange={(e) =>
                                handleChange("description", e.target.value)
                            }
                            placeholder="Add a description..."
                        />
                    </div>
                )}

                {/* ========== SCENE-SPECIFIC PROPERTIES ========== */}
                {selection.type === "scene" && (
                    <>
                        {/* GPS Location */}
                        <div className="space-y-3 pt-4 border-t theme-border">
                            <SectionHeader>
                                Optional GPS Reference
                            </SectionHeader>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold theme-text-muted uppercase tracking-wide mb-1.5">
                                        Latitude
                                    </label>
                                    <FormInput
                                        type="number"
                                        step="any"
                                        value={activeNode.lat || ""}
                                        onChange={(e) =>
                                            handleChange(
                                                "lat",
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        placeholder="0.0000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold theme-text-muted uppercase tracking-wide mb-1.5">
                                        Longitude
                                    </label>
                                    <FormInput
                                        type="number"
                                        step="any"
                                        value={activeNode.lng || ""}
                                        onChange={(e) =>
                                            handleChange(
                                                "lng",
                                                parseFloat(e.target.value) || 0
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
                                Location from Map
                            </button>
                        </div>

                        {/* Gateway Toggle */}
                        <div className="space-y-3 pt-4 border-t theme-border">
                            <SectionHeader>Gateway Connection</SectionHeader>
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
                                                e.target.checked
                                            )
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="relative w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium theme-text">
                                        Allow connecting to different areas
                                    </div>
                                    <p className="text-xs theme-text-muted mt-1">
                                        Enable this if the scene serves as a
                                        gateway or entrance point between
                                        different areas
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Active Links */}
                        <div className="space-y-3 pt-4 border-t theme-border">
                            <SectionHeader>Active Links</SectionHeader>
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
                                                                "Unknown"}
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
                                        No links yet
                                    </p>
                                    <p className="text-[10px] theme-text-subtle mt-1">
                                        Use the canvas to add navigation links
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ========== AREA-SPECIFIC PROPERTIES ========== */}
                {/* Priority Input - only for areas */}
                {selection.type === "area" && (
                    <div className="space-y-3 pt-4 border-t theme-border">
                        <SectionHeader>Priority Order</SectionHeader>
                        <FormInput
                            type="number"
                            value={
                                activeNode.priority !== undefined
                                    ? activeNode.priority
                                    : 10
                            }
                            onChange={(e) =>
                                handleChange(
                                    "priority",
                                    parseInt(e.target.value) || 0
                                )
                            }
                            placeholder="10"
                        />
                        <p className="text-xs theme-text-muted">
                            Smaller numbers will appear first. Default: 10
                        </p>
                    </div>
                )}

                {/* Settings Section - Restricted Access (Areas Only) - Lower visual weight */}
                {selection.type === "area" && (
                    <div className="space-y-3 pt-5 mt-2 border-t-2 border-dashed theme-border bg-slate-50/50 dark:bg-slate-900/30 -mx-6 px-6 pb-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider theme-text-muted">
                            <span className="material-symbols-outlined text-[14px]">
                                settings
                            </span>
                            Settings
                        </div>

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
                                            e.target.checked
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
                                    Restricted Access
                                </div>
                                <p className="text-[10px] theme-text-muted leading-snug">
                                    If checked, only authorized personnel can
                                    view this item in the public tour.
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
                            Danger Zone
                        </h4>
                        <button
                            onClick={handleDeleteClick}
                            className="w-full flex items-center justify-center gap-2 h-10 bg-red-500/10 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white font-bold text-xs rounded-lg border border-red-200 dark:border-red-500/30 hover:border-red-600 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                delete
                            </span>
                            Delete{" "}
                            {selection.type === "area" ? "Area" : "Scene"}
                        </button>
                        <p className="text-[10px] text-red-500/70 dark:text-red-400/50 text-center mt-2">
                            This action cannot be undone.
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
                title={`Delete ${
                    selection.type === "area" ? "Area" : "Scene"
                }?`}
                message={
                    deletionImpact ? (
                        <div className="space-y-4">
                            <p className="text-sm theme-text-secondary">
                                You are about to delete{" "}
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
                                            Cascade Deletion Warning
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
                                                ? "s"
                                                : ""}{" "}
                                            will be deleted
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
                                                ? "s"
                                                : ""}{" "}
                                            will be deleted
                                        </span>
                                    </div>
                                </div>

                                {deletionImpact.area_names &&
                                    deletionImpact.area_names.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-amber-500/20">
                                            <p className="text-xs font-bold text-slate-400 mb-2">
                                                Affected child areas:
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
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                            </div>

                            <p className="text-xs theme-text-muted bg-gray-200 dark:bg-slate-800/50 p-3 rounded border theme-border-subtle">
                                <span className="font-bold theme-text">
                                    Warning:
                                </span>{" "}
                                This action cannot be undone. All data and files
                                will be permanently removed.
                            </p>
                        </div>
                    ) : (
                        `Are you sure you want to delete "${
                            activeNode.name
                        }"? This will also delete all related ${
                            selection.type === "area"
                                ? "scenes and links"
                                : "links"
                        }. This action cannot be undone.`
                    )
                }
                confirmText={deletionImpact ? "Delete All" : "Delete"}
                cancelText="Cancel"
                variant="danger"
            />

            {/* Map Picker Modal - For Scene GPS Location */}
            {selection.type === "scene" && (
                <MapPickerModal
                    isOpen={showMapPicker}
                    onClose={() => setShowMapPicker(false)}
                    initialLat={activeNode.lat || -0.9492}
                    initialLng={activeNode.lng || 100.3705}
                    onConfirm={(coords) => {
                        // Send both lat and lng together in one update
                        onUpdate(selection.id, selection.type, {
                            lat: coords.lat,
                            lng: coords.lng,
                        });
                    }}
                />
            )}
        </aside>
    );
}

import React, { useState, useEffect } from "react";
import axios from "axios";

export default function LinkTargetModal({
    isOpen,
    onClose,
    onConfirm,
    mode,
    currentSceneId,
    currentAreaId,
    hierarchy,
    excludedTargetIds = [],
}) {
    const [targets, setTargets] = useState([]);
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && hierarchy) {
            deriveTargets();
            setSelectedTarget(null);
        }
    }, [isOpen, mode, currentAreaId, currentSceneId, hierarchy]);

    const deriveTargets = async () => {
        let candidates = [];

        // First, find the current scene's parent area if currentAreaId is not provided
        let effectiveAreaId = currentAreaId;
        if (!effectiveAreaId || effectiveAreaId === "current") {
            effectiveAreaId = findParentAreaId(hierarchy, currentSceneId);
        }

        if (mode === "navigasi") {
            // Find current area in hierarchy and list its scenes (excluding current AND excluded targets)
            const area = findAreaById(hierarchy, effectiveAreaId);

            if (area && area.scenes) {
                candidates = area.scenes
                    .filter(
                        (scene) =>
                            scene.id !== currentSceneId &&
                            !excludedTargetIds.includes(scene.id),
                    )
                    .map((s) => ({ id: s.id, name: s.name, type: "scene" }));
            }
            setTargets(candidates);
        } else if (mode === "gateway") {
            // Fetch ALL gateway scenes from API (no ownership filter)
            setLoading(true);
            try {
                const response = await axios.get(
                    "/admin/visual-editor/api/gateway-scenes",
                );
                candidates = response.data
                    .filter(
                        (s) =>
                            s.id !== currentSceneId &&
                            !excludedTargetIds.includes(s.id),
                    )
                    .map((s) => ({
                        id: s.id,
                        name: `${s.name} (${s.area_name})`,
                        type: "scene",
                        areaName: s.area_name,
                    }));
                setTargets(candidates);
            } catch (error) {
                console.error("Failed to fetch gateway scenes:", error);
                setTargets([]);
            } finally {
                setLoading(false);
            }
        }
    };

    // Helper: Find parent area ID for a given scene
    const findParentAreaId = (nodes, sceneId) => {
        for (const node of nodes) {
            if (node.type === "area") {
                // Check if this area contains the scene
                if (node.scenes && node.scenes.some((s) => s.id === sceneId)) {
                    return node.id;
                }
                // Check children
                if (node.children) {
                    const found = findParentAreaId(node.children, sceneId);
                    if (found) return found;
                }
            }
        }
        return null;
    };

    // Helper: Find area by ID
    const findAreaById = (nodes, areaId) => {
        for (const node of nodes) {
            if (node.type === "area" && node.id === areaId) {
                return node;
            }
            if (node.children) {
                const found = findAreaById(node.children, areaId);
                if (found) return found;
            }
        }
        return null;
    };

    if (!isOpen) return null;

    return (
        <div className="theme-modal-backdrop backdrop-blur-sm">
            <div
                id="modal-link-target"
                className="theme-modal w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="theme-modal-header flex justify-between items-center">
                    <h3 className="text-lg font-bold theme-text">
                        {mode === "navigasi"
                            ? "Pilih Scene Tujuan"
                            : "Pilih Scene Gerbang"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="theme-text-subtle hover:text-action-primary"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="p-8 text-center theme-text-muted flex flex-col items-center gap-3">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-primary rounded-full animate-spin"></div>
                            <span>Memuat scene gerbang...</span>
                        </div>
                    ) : targets.length === 0 ? (
                        <div className="p-8 text-center theme-text-muted">
                            {mode === "navigasi"
                                ? "Tidak ada scene lain di area ini."
                                : "Tidak ada scene gerbang ditemukan di area lain."}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {targets.map((target) => (
                                <button
                                    key={target.id}
                                    onClick={() => setSelectedTarget(target.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                                        selectedTarget === target.id
                                            ? "theme-sidebar-item-active"
                                            : "theme-surface theme-border theme-sidebar-item hover:bg-slate-50 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-xl opacity-70">
                                        {mode === "gateway"
                                            ? "door_open"
                                            : "image"}
                                    </span>
                                    <span className="font-medium truncate">
                                        {target.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="theme-modal-footer flex justify-end gap-2">
                    <button onClick={onClose} className="theme-btn-secondary">
                        Batal
                    </button>
                    <button
                        onClick={() =>
                            selectedTarget && onConfirm(selectedTarget)
                        }
                        disabled={!selectedTarget}
                        id="select_target_scene_saved"
                        className="theme-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Buat Tautan
                    </button>
                </div>
            </div>
        </div>
    );
}

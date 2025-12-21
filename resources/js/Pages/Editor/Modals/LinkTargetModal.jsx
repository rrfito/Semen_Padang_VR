import React, { useState, useEffect } from "react";

export default function LinkTargetModal({
    isOpen,
    onClose,
    onConfirm,
    mode,
    currentSceneId,
    currentAreaId,
    hierarchy,
}) {
    const [targets, setTargets] = useState([]);
    const [selectedTarget, setSelectedTarget] = useState(null);

    useEffect(() => {
        if (isOpen && hierarchy) {
            deriveTargets();
            setSelectedTarget(null);
        }
    }, [isOpen, mode, currentAreaId, currentSceneId, hierarchy]);

    const deriveTargets = () => {
        let candidates = [];

        // First, find the current scene's parent area if currentAreaId is not provided
        let effectiveAreaId = currentAreaId;
        if (!effectiveAreaId || effectiveAreaId === "current") {
            effectiveAreaId = findParentAreaId(hierarchy, currentSceneId);
        }

        console.log("LinkTargetModal deriveTargets:", {
            mode,
            currentSceneId,
            currentAreaId,
            effectiveAreaId,
            hierarchyLength: hierarchy?.length,
        });

        if (mode === "navigasi") {
            // Find current area in hierarchy and list its scenes (excluding current)
            const area = findAreaById(hierarchy, effectiveAreaId);
            console.log("Found area for navigasi:", area);

            if (area && area.scenes) {
                candidates = area.scenes
                    .filter((scene) => scene.id !== currentSceneId)
                    .map((s) => ({ id: s.id, name: s.name, type: "scene" }));
            }
        } else if (mode === "gateway") {
            // Portal: List SCENES from OTHER areas where can_be_gateway = true
            const collectGatewayScenes = (nodes, excludeAreaId) => {
                let acc = [];
                nodes.forEach((node) => {
                    if (node.type === "area") {
                        // Collect gateway scenes from this area (if it's not the current area)
                        if (node.id !== excludeAreaId && node.scenes) {
                            const gatewayScenes = node.scenes
                                .filter((s) => s.can_be_gateway === true)
                                .map((s) => ({
                                    id: s.id,
                                    name: `${s.name} (${node.name})`, // Include area name for clarity
                                    type: "scene",
                                    areaName: node.name,
                                }));
                            acc = acc.concat(gatewayScenes);
                        }
                        // Recurse into children
                        if (node.children) {
                            acc = acc.concat(
                                collectGatewayScenes(
                                    node.children,
                                    excludeAreaId
                                )
                            );
                        }
                    }
                });
                return acc;
            };
            candidates = collectGatewayScenes(hierarchy || [], effectiveAreaId);
        }

        console.log("Derived candidates:", candidates);
        setTargets(candidates);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0f172a]">
                    <h3 className="text-lg font-bold text-white">
                        {mode === "navigasi"
                            ? "Select Target Scene"
                            : "Select Gateway Scene"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2">
                    {targets.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            {mode === "navigasi"
                                ? "No other scenes found in this area."
                                : "No gateway scenes found in other areas."}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {targets.map((target) => (
                                <button
                                    key={target.id}
                                    onClick={() => setSelectedTarget(target.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                                        selectedTarget === target.id
                                            ? "bg-primary text-white shadow-lg"
                                            : "text-slate-300 hover:bg-white/5 hover:text-white"
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
                <div className="p-4 border-t border-white/10 bg-[#0f172a] flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() =>
                            selectedTarget && onConfirm(selectedTarget)
                        }
                        disabled={!selectedTarget}
                        className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white transition-all font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Link
                    </button>
                </div>
            </div>
        </div>
    );
}

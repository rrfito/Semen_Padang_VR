import React, { useState, useEffect, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import axios from "axios";

// Partials
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import PropertiesPanel from "./Partials/PropertiesPanel";

// Views
import WelcomeView from "./Views/WelcomeView";
import AreaOverviewView from "./Views/AreaOverviewView";
import SceneContainerView from "./Views/SceneContainerView";
import SceneView from "./Views/SceneView";

// Modals
import AutoLinkModal from "./Modals/AutoLinkModal";
import CreateAreaModal from "./Modals/CreateAreaModal";
import LinkTargetModal from "./Modals/LinkTargetModal";

// Theme
import { ThemeProvider } from "@/Contexts/ThemeContext";

export default function VisualEditor({ hierarchy: initialHierarchy }) {
    // --- STATE ---
    const [hierarchy, setHierarchy] = useState(initialHierarchy || []);
    const [selection, setSelection] = useState(null); // { type, id, ...node }

    // Initialize expandedIds from localStorage
    const [expandedIds, setExpandedIds] = useState(() => {
        try {
            const saved = localStorage.getItem("editor_expanded_ids");
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse expandedIds from localStorage:", e);
            return [];
        }
    });

    // Persist expandedIds
    useEffect(() => {
        localStorage.setItem(
            "editor_expanded_ids",
            JSON.stringify(expandedIds)
        );
    }, [expandedIds]);

    // Scene Cache (Lazy Loading) - Map<SceneID, DetailedScene>
    const [sceneCache, setSceneCache] = useState({});

    // UI State
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Modals
    const [autoLinkModal, setAutoLinkModal] = useState({
        isOpen: false,
        area: null, // null = universal, or pass area object for recursive
    });
    const [createAreaModal, setCreateAreaModal] = useState({
        isOpen: false,
        parentArea: null,
    });
    // Link Target Modal State
    const [linkTargetModal, setLinkTargetModal] = useState({
        isOpen: false,
        data: null,
    });

    // --- INITIALIZATION ---
    useEffect(() => {
        // Parse URL 'focus' param
        const params = new URLSearchParams(window.location.search);
        const focus = params.get("focus");
        if (focus && hierarchy && hierarchy.length > 0) {
            const [type, id] = focus.split(":");
            const targetId = parseInt(id);
            // Find node in hierarchy
            const found = findNode(hierarchy, targetId, type);
            if (found) {
                setSelection(found);
                expandToNode(found.id);
            }
        }
    }, [hierarchy]);

    // --- HELPERS ---
    const findNode = (nodes, id, type) => {
        if (!nodes || !Array.isArray(nodes)) return null;
        for (const node of nodes) {
            if (node.id === id && node.type === type) return node;
            if (node.children && Array.isArray(node.children)) {
                const found = findNode(node.children, id, type);
                if (found) return found;
            }
            if (node.scenes && Array.isArray(node.scenes)) {
                // Check Scenes too if we are looking for scene
                const found = node.scenes.find(
                    (s) => s.id === id && type === "scene"
                );
                if (found)
                    return { ...found, type: "scene", parentId: node.id }; // Add context
            }
        }
        return null;
    };

    const expandToNode = (id) => {
        // Simple logic: expand all parents (Need parent pointers or separate path finding)
        // For now, simpler approach: just ensure we set selection
        // TODO: Implement robust tree expansion to selection
    };

    // --- ACTIONS ---

    const handleSelect = async (node) => {
        setSelection(node);

        // URL Update (Shallow)
        const url = new URL(window.location);
        url.searchParams.set("focus", `${node.type}:${node.id}`);
        window.history.replaceState({}, "", url);

        // Logic: specific handling
        if (node.type === "scene") {
            if (!sceneCache[node.id]) {
                setIsLoadingDetails(true);
                try {
                    const { data } = await axios.get(
                        route("admin.editor.scene.details", node.id)
                    );
                    setSceneCache((prev) => ({ ...prev, [node.id]: data }));
                } catch (error) {
                    console.error("Failed to load scene details", error);
                } finally {
                    setIsLoadingDetails(false);
                }
            }
        }
    };

    const handleToggleExpand = (id) => {
        setExpandedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleUpdateNode = (id, type, changes) => {
        // 1. Update Hierarchy State (for Sidebar/Nav)
        const updateTree = (nodes) => {
            return nodes.map((node) => {
                if (node.id === id && node.type === type) {
                    return { ...node, ...changes };
                }
                if (node.children) {
                    node.children = updateTree(node.children);
                }
                if (node.scenes) {
                    node.scenes = node.scenes.map((s) => {
                        if (s.id === id && type === "scene")
                            return { ...s, ...changes };
                        return s;
                    });
                }
                return node;
            });
        };

        setHierarchy((prevHierarchy) => {
            const newHierarchy = updateTree(prevHierarchy);
            return newHierarchy;
        });

        // 2. Sync Selection State (CRITICAL FIX)
        // If the updated node is the currently selected one, we MUST update selection state too
        // otherwise the View receiving 'selection' prop will be stale.
        if (selection && selection.id === id && selection.type === type) {
            setSelection((prev) => ({ ...prev, ...changes }));
        }

        // 3. If Scene, Update Cache
        if (type === "scene" && sceneCache[id]) {
            setSceneCache((prev) => ({
                ...prev,
                [id]: { ...prev[id], ...changes },
            }));
        }

        // 4. Flag Dirty
        setIsDirty(true);

        // 5. AUTO-SAVE for Areas and Scenes (Debounced)
        if (type === "area") {
            // Clear previous timeout if exists
            if (window.areaSaveTimeout) {
                clearTimeout(window.areaSaveTimeout);
            }

            // Set new timeout for auto-save
            window.areaSaveTimeout = setTimeout(async () => {
                try {
                    const url = `/admin/visual-editor/api/area/${id}`;
                    const response = await axios.patch(url, changes);
                    console.log("[Area Save] Area auto-saved successfully:", {
                        areaId: id,
                        changes,
                        backendResponse: response.data,
                    });

                    // Re-sync hierarchy with backend response to ensure consistency
                    if (response.data.area) {
                        const syncedArea = response.data.area;
                        setHierarchy((prev) => {
                            const updateWithBackendData = (nodes) => {
                                return nodes.map((node) => {
                                    if (
                                        node.id === syncedArea.id &&
                                        node.type === "area"
                                    ) {
                                        return { ...node, ...syncedArea };
                                    }
                                    if (node.children) {
                                        return {
                                            ...node,
                                            children: updateWithBackendData(
                                                node.children
                                            ),
                                        };
                                    }
                                    return node;
                                });
                            };
                            return updateWithBackendData(prev);
                        });
                    }

                    setIsDirty(false); // Mark as saved
                } catch (error) {
                    console.error(
                        "[Area Save] Failed to auto-save area:",
                        error
                    );
                    alert("Failed to save changes. Please try again.");
                }
            }, 1000); // 1 second debounce
        } else if (type === "scene") {
            // Auto-save for scenes
            if (window.sceneSaveTimeout) {
                clearTimeout(window.sceneSaveTimeout);
            }

            window.sceneSaveTimeout = setTimeout(async () => {
                try {
                    const url = `/admin/visual-editor/api/scene/${id}`;
                    const response = await axios.patch(url, changes);
                    console.log("[Scene Save] Scene auto-saved successfully:", {
                        sceneId: id,
                        changes,
                        backendResponse: response.data,
                    });

                    setIsDirty(false);
                } catch (error) {
                    console.error(
                        "[Scene Save] Failed to auto-save scene:",
                        error
                    );
                    alert("Failed to save scene changes. Please try again.");
                }
            }, 1000); // 1 second debounce
        }
    };

    // --- AREA CREATION ACTIONS ---
    const handleOpenCreateArea = () => {
        // Determine parent from selection
        let parentArea = null;
        if (selection) {
            if (selection.type === "area") {
                parentArea = selection;
            } else if (selection.type === "scene") {
                // If scene selected, find its parent area
                // NOTE: 'findNode' adds 'parentId' to scene object, but that's just an ID.
                // We need the Area object for the modal (name, level).
                // Let's traverse hierarchy to find the Area object by ID.
                const parentId = selection.parentId;
                parentArea = findNode(hierarchy, parentId, "area");
            }
        }
        setCreateAreaModal({ isOpen: true, parentArea });
    };

    const handleCreateArea = async (data) => {
        try {
            // Expect partial reload or new ID back.
            // Route: admin.editor.subarea.create
            const res = await axios.post(
                route("admin.editor.subarea.create"),
                data
            );

            // Update Hierarchy: We should ideally merge the new node.
            // Simplest is to reload page or refetch hierarchy.
            // To keep SPA feel, we push to state if we know where.

            // For now, let's just complete the flow and maybe reload for safety,
            // OR implement a specialized tree inserter.

            // Let's assume response returns the new Area object.
            // Controller returns 'sub_area'
            const newArea = res.data.sub_area || res.data.area;

            if (!newArea) throw new Error("Server returned invalid area data");

            if (!data.parent_id) {
                // ADD TO ROOT
                setHierarchy((prev) => [...prev, newArea]);
            } else {
                // ADD TO CHILD
                const addToParent = (nodes) => {
                    return nodes.map((node) => {
                        if (
                            node.id === data.parent_id &&
                            node.type === "area"
                        ) {
                            return {
                                ...node,
                                children: [...(node.children || []), newArea],
                            };
                        }
                        if (node.children) {
                            return {
                                ...node,
                                children: addToParent(node.children),
                            };
                        }
                        return node;
                    });
                };
                setHierarchy(addToParent(hierarchy));
                // Auto-expand parent
                if (!expandedIds.includes(data.parent_id)) {
                    setExpandedIds((prev) => [...prev, data.parent_id]);
                }
            }

            // Modal will close itself if needed (via handleSubmit with keepOpen=false)
            // Don't close here anymore

            // Auto-select the new area (Redirect view)
            handleSelect(newArea);

            // alert("Area created successfully!"); // Removed alert for smoother flow
        } catch (e) {
            console.error(e);
            alert("Failed to create area. Please try again.");
            throw e; // Modal will catch this
        }
    };

    // --- SCENE ACTIONS ---

    const handleUploadScenes = async (files, areaId = null) => {
        const targetAreaId = areaId || selection?.id;
        if (!targetAreaId) {
            alert("Please select an area first");
            return;
        }

        try {
            const formData = new FormData();
            Array.from(files).forEach((file) =>
                formData.append("images[]", file)
            );
            formData.append("area_id", targetAreaId);

            const response = await axios.post(
                `/admin/visual-editor/api/scenes/bulk-upload`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            // Refresh area data to show new scenes
            const updatedArea = await axios.get(
                `/admin/visual-editor/api/area/${targetAreaId}`
            );

            console.log("📊 API Response:", updatedArea.data);
            console.log("🎬 Scenes received:", updatedArea.data.scenes);
            if (updatedArea.data.scenes?.length > 0) {
                console.log("🔍 First scene data:", updatedArea.data.scenes[0]);
            }

            // Update hierarchy with new scenes AND area data
            setHierarchy((prev) => {
                const updateScenes = (nodes) => {
                    return nodes.map((node) => {
                        if (node.id === targetAreaId && node.type === "area") {
                            // Merge updated area data including new scenes
                            return {
                                ...node,
                                ...updatedArea.data.area,
                                scenes: updatedArea.data.scenes || [],
                            };
                        }
                        if (node.children) {
                            return {
                                ...node,
                                children: updateScenes(node.children),
                            };
                        }
                        return node;
                    });
                };
                return updateScenes(prev);
            });

            alert(
                `${response.data.scenes.length} scene(s) uploaded successfully!`
            );
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload scenes. Please try again.");
        }
    };

    const handleAddLink = (sourceId, linkData) => {
        // Update cache locally
        const scene = sceneCache[sourceId];
        if (!scene) return;

        const newLinks = [
            ...(scene.links || []),
            { ...linkData, id: "temp_" + Date.now() },
        ];

        handleUpdateNode(sourceId, "scene", { links: newLinks });
    };

    const handleDeleteLink = (linkId) => {
        // Only if currently selected is scene
        if (selection?.type === "scene") {
            const scene = sceneCache[selection.id];
            if (!scene) return;
            const newLinks = scene.links.filter((l) => l.id !== linkId);
            handleUpdateNode(selection.id, "scene", { links: newLinks });
        }
    };

    // --- GLOBAL SAVE ---
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.post(route("admin.editor.sync"), {
                // Determine diffs. For now, sending dummy to validate connection.
                // We need a proper diffing utility here.
                updates: [],
            });
            setIsDirty(false);
            alert("Save successful (Prototype)");
        } catch (error) {
            alert("Save failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAutoLink = async (mode) => {
        if (!autoLinkModal.areaId) return;
        try {
            const res = await axios.post(route("admin.editor.autolink"), {
                area_id: autoLinkModal.areaId,
                mode,
            });
            alert(`Auto-linked ${res.data.count} connections!`);
            setAutoLinkModal({ isOpen: false, areaId: null, areaName: "" });
            // Reload details if current view is affected?
        } catch (e) {
            alert("Auto-link failed");
        }
    };

    // --- DELETE ACTION ---
    const handleDeleteNode = async (id, type) => {
        if (
            !confirm(
                `Are you sure you want to delete this ${type}? This action cannot be undone.`
            )
        ) {
            return;
        }

        try {
            if (type === "area") {
                await axios.delete(route("admin.editor.area.destroy", id));
                // Remove from local state
                // 1. If it's root
                setHierarchy((prev) => prev.filter((n) => n.id !== id));
                // 2. If it's child (Recursive filter)
                const removeFromTree = (nodes) => {
                    return nodes.filter((n) => {
                        if (n.id === id && n.type === "area") return false;
                        if (n.children) {
                            n.children = removeFromTree(n.children);
                        }
                        return true;
                    });
                };
                setHierarchy((prev) => removeFromTree(prev));
            } else if (type === "scene") {
                await axios.delete(route("admin.editor.scene.destroy", id));
                // Update Parent Area scene list
                const removeFromScenes = (nodes) => {
                    return nodes.map((n) => {
                        if (n.scenes) {
                            n.scenes = n.scenes.filter((s) => s.id !== id);
                        }
                        if (n.children) {
                            n.children = removeFromScenes(n.children);
                        }
                        return n;
                    });
                };
                setHierarchy((prev) => removeFromScenes(prev));

                // Also remove from cache
                setSceneCache((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }

            setSelection(null);
            alert(
                `${type === "area" ? "Area" : "Scene"} deleted successfully.`
            );
        } catch (error) {
            console.error(error);
            alert("Failed to delete item.");
        }
    };

    // --- RENDER HELPERS ---
    const getCurrentBreadcrumbs = () => {
        if (!selection) return [];
        // TODO: Traverse up tree to build crumbs
        return [{ name: selection.name }];
    };

    const renderMainView = () => {
        if (!selection)
            return <WelcomeView onCreateArea={handleOpenCreateArea} />;

        if (selection.type === "area") {
            // ROBUST CONTENT-AWARE LOGIC
            // 1. If it has children (Sub-Areas), it MUST be a Group View
            const hasChildren =
                selection.children && selection.children.length > 0;
            if (hasChildren) {
                return (
                    <AreaOverviewView
                        area={selection}
                        allAreas={hierarchy}
                        onUpdate={(id, type, data) =>
                            handleUpdateNode(id, type, data)
                        }
                        onCreateChild={(parentId) => {
                            const parentArea = findNode(
                                hierarchy,
                                parentId,
                                "area"
                            );
                            setCreateAreaModal({ isOpen: true, parentArea });
                        }}
                        onUploadScene={(areaId) => {
                            const input =
                                document.getElementById("scene-upload-input");
                            if (input) {
                                input.dataset.areaId = areaId;
                                input.click();
                            }
                        }}
                        onAutoLink={(area) =>
                            setAutoLinkModal({ isOpen: true, area })
                        }
                    />
                );
            }

            // 2. If it has Scenes, it MUST be a Scene View
            const hasScenes = selection.scenes && selection.scenes.length > 0;
            if (hasScenes) {
                return (
                    <SceneContainerView
                        area={selection}
                        scenes={selection.scenes}
                        onSelectScene={handleSelect}
                        onUpload={handleUploadScenes}
                        onAutoLink={(area) =>
                            setAutoLinkModal({ isOpen: true, area })
                        }
                    />
                );
            }

            // 3. Fallback for Empty Areas based on Configuration
            // Level 3 is always leaf → Scene View
            // is_container = false → Scene View
            if (selection.level === 3 || !selection.is_container) {
                return (
                    <SceneContainerView
                        area={selection}
                        scenes={[]}
                        onSelectScene={handleSelect}
                        onUpload={handleUploadScenes}
                    />
                );
            }

            // Default Fallback (Level 1, Level 2 Group, etc) -> Overview
            return (
                <AreaOverviewView
                    area={selection}
                    allAreas={hierarchy}
                    onUpdate={(id, type, data) =>
                        handleUpdateNode(id, type, data)
                    }
                    onCreateChild={(parentId) => {
                        const parentArea = findNode(
                            hierarchy,
                            parentId,
                            "area"
                        );
                        setCreateAreaModal({ isOpen: true, parentArea });
                    }}
                    onUploadScene={(areaId) => {
                        const input =
                            document.getElementById("scene-upload-input");
                        if (input) {
                            input.dataset.areaId = areaId;
                            input.click();
                        }
                    }}
                />
            );
        }

        if (selection.type === "scene") {
            const details = sceneCache[selection.id];

            // If loading or no details yet, show a minimal loading state that looks like SceneView
            if (isLoadingDetails || !details) {
                return (
                    <main className="flex-1 relative flex flex-col bg-[#05090c] overflow-hidden items-center justify-center h-full w-full">
                        <div className="text-white/50 flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span className="text-sm">Memuat Scene...</span>
                        </div>
                    </main>
                );
            }

            return (
                <SceneView
                    scene={details}
                    onUpdateScene={(update) =>
                        handleUpdateNode(selection.id, "scene", update)
                    }
                    onAddLink={(data) => {
                        setLinkTargetModal({
                            isOpen: true,
                            data: data,
                        });
                    }}
                    onDeleteLink={handleDeleteLink}
                />
            );
        }
    };

    // --- LINK CREATION HANDLER ---
    const handleConfirmLink = async (targetId) => {
        if (!linkTargetModal.data || !selection) return;

        const { yaw, pitch, type } = linkTargetModal.data;
        const currentSceneId = selection.id;

        const payload = {
            target_id: targetId,
            yaw: yaw,
            pitch: pitch || 0,
            type: type,
        };

        console.log("Creating link with payload:", payload);
        console.log(
            "POST URL:",
            `/admin/visual-editor/api/scene/${currentSceneId}/link`
        );

        try {
            const response = await axios.post(
                `/admin/visual-editor/api/scene/${currentSceneId}/link`,
                payload
            );

            if (response.data.success) {
                // Update scene cache with new data (this triggers re-render with new hotspot)
                setSceneCache((prev) => ({
                    ...prev,
                    [response.data.scene.id]: response.data.scene,
                }));
                // No need to call handleSelect - sceneCache update will trigger re-render
                console.log("Link created successfully");
            } else {
                alert("Failed to create link: " + response.data.message);
            }
        } catch (error) {
            console.error("Error creating link:", error);
            // Show validation errors if available
            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors)
                    .flat()
                    .join(", ");
                alert("Validation error: " + errorMessages);
            } else if (error.response?.data?.message) {
                alert("Error: " + error.response.data.message);
            } else {
                alert("Error creating link: " + error.message);
            }
        } finally {
            setLinkTargetModal({ isOpen: false, data: null });
        }
    };

    return (
        <ThemeProvider defaultTheme="light">
            <div className="flex flex-col h-screen w-screen theme-surface theme-text font-sans overflow-hidden">
                <Head title="Visual Editor" />

                {/* HEADER */}
                <Header
                    breadcrumbs={getCurrentBreadcrumbs()}
                    isDirty={isDirty}
                    isSaving={isSaving}
                    onSave={handleSave}
                />

                {/* BODY */}
                <div className="flex-1 flex overflow-hidden">
                    {/* SIDEBAR */}
                    <Sidebar
                        hierarchy={hierarchy}
                        selection={selection}
                        onSelect={handleSelect}
                        onToggleExpand={handleToggleExpand}
                        expandedIds={expandedIds}
                        onCreateArea={handleOpenCreateArea}
                        onAutoLink={(area) =>
                            setAutoLinkModal({ isOpen: true, area })
                        }
                    />

                    {/* MAIN CONTENT */}
                    <div className="flex-1 flex relative">
                        {renderMainView()}
                    </div>

                    {/* RIGHT PANEL - PROPERTIES */}
                    <PropertiesPanel
                        selection={selection}
                        activeNode={
                            selection
                                ? selection.type === "scene"
                                    ? sceneCache[selection.id]
                                    : selection
                                : null
                        }
                        onUpdate={handleUpdateNode}
                        onDelete={handleDeleteNode}
                    />
                </div>

                {/* MODALS */}
                <AutoLinkModal
                    isOpen={autoLinkModal.isOpen}
                    onClose={() =>
                        setAutoLinkModal({ ...autoLinkModal, isOpen: false })
                    }
                    area={autoLinkModal.area}
                />

                <CreateAreaModal
                    isOpen={createAreaModal.isOpen}
                    onClose={() =>
                        setCreateAreaModal({
                            ...createAreaModal,
                            isOpen: false,
                        })
                    }
                    parentArea={createAreaModal.parentArea}
                    onConfirm={handleCreateArea}
                />

                {/* Hidden file input for scene uploads */}
                <input
                    id="scene-upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const areaIdStr = e.target.dataset.areaId;
                            const areaId = parseInt(areaIdStr);

                            console.log("Scene Upload Debug:", {
                                areaIdStr,
                                areaId,
                                isValid: !isNaN(areaId),
                                filesCount: e.target.files.length,
                            });

                            if (!areaId || isNaN(areaId)) {
                                alert(
                                    "Error: No area selected. Please select an area first."
                                );
                                return;
                            }

                            handleUploadScenes(e.target.files, areaId);
                            e.target.value = ""; // Reset input
                        }
                    }}
                />
                {/* Link Target Modal */}
                <LinkTargetModal
                    isOpen={linkTargetModal.isOpen}
                    onClose={() =>
                        setLinkTargetModal({
                            ...linkTargetModal,
                            isOpen: false,
                        })
                    }
                    onConfirm={handleConfirmLink}
                    mode={linkTargetModal.data?.type || "navigasi"}
                    currentSceneId={selection?.id}
                    currentAreaId={selection?.parentId || null}
                    hierarchy={hierarchy}
                />
            </div>
        </ThemeProvider>
    );
}

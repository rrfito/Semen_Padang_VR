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
import PendingChangesModal from "./Modals/PendingChangesModal";

// Components
import NotificationModal from "@/Components/Editor/NotificationModal";

// Theme
import { ThemeProvider } from "@/Contexts/ThemeContext";

export default function VisualEditor({
    hierarchy: initialHierarchy,
    modifiedNodes,
}) {
    // --- HELPER: Inject Status ---
    const enrichHierarchyWithStatus = (nodes) => {
        if (!nodes) return [];
        return nodes.map((node) => {
            let status = "live";
            if (!node.published_id) {
                status = "new";
            } else if (
                modifiedNodes?.areas?.includes(node.id) ||
                modifiedNodes?.scenes?.includes(node.id)
            ) {
                status = "modified";
            }

            // Recurse children
            const children = enrichHierarchyWithStatus(node.children);

            // Recurse scenes
            const scenes = node.scenes?.map((scene) => {
                let sceneStatus = "live";
                if (!scene.published_id) {
                    sceneStatus = "new";
                } else if (modifiedNodes?.scenes?.includes(scene.id)) {
                    sceneStatus = "modified";
                }
                return { ...scene, status: sceneStatus };
            });

            return { ...node, status, children, scenes };
        });
    };

    // --- STATE ---
    const [hierarchy, setHierarchy] = useState(
        enrichHierarchyWithStatus(initialHierarchy) || []
    );

    // Sync state with props when Inertia reloads data
    useEffect(() => {
        setHierarchy(enrichHierarchyWithStatus(initialHierarchy) || []);
    }, [initialHierarchy]);
    const [selection, setSelection] = useState(null); // { type, id, ...node }
    const [isUploading, setIsUploading] = useState(false);

    // Visibility State (Toggle Status)
    const [showStatusLabels, setShowStatusLabels] = useState(true);

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
    const [pendingCount, setPendingCount] = useState(0);
    const [showPendingChanges, setShowPendingChanges] = useState(false);

    // Modals
    const [autoLinkModal, setAutoLinkModal] = useState({
        isOpen: false,
        area: null, // null = universal, or pass area object for recursive
    });
    const [createAreaModal, setCreateAreaModal] = useState({
        isOpen: false,
        parentArea: null,
    });
    const [linkTargetModal, setLinkTargetModal] = useState({
        isOpen: false,
        data: null,
    });

    // Notification State
    const [notification, setNotification] = useState({
        isOpen: false,
        title: "",
        message: "",
        variant: "info",
        autoClose: 5000,
    });

    const showNotification = (
        title,
        message,
        variant = "info",
        autoClose = 5000
    ) => {
        setNotification({
            isOpen: true,
            title,
            message,
            variant,
            autoClose,
        });
    };

    const fetchPendingCount = async () => {
        try {
            const { data } = await axios.get(
                route("admin.editor.pending-changes")
            );
            setPendingCount(data.summary.total_changes || 0);
        } catch (error) {
            console.error("Failed to fetch pending count", error);
        }
    };

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
        fetchPendingCount(); // Initial fetch
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
                    // Update field + Recalculate Status
                    // If it was 'live' (has published_id), change to 'modified'.
                    // If it was 'new' (no published_id), keep 'new'.
                    const currentStatus = node.status || "live";
                    let newStatus = currentStatus;

                    if (currentStatus === "live") {
                        newStatus = "modified";
                    }

                    return { ...node, ...changes, status: newStatus };
                }
                if (node.children) {
                    node.children = updateTree(node.children);
                }
                if (node.scenes) {
                    node.scenes = node.scenes.map((s) => {
                        if (s.id === id && type === "scene") {
                            const currentStatus = s.status || "live";
                            let newStatus = currentStatus;
                            if (currentStatus === "live")
                                newStatus = "modified";
                            return { ...s, ...changes, status: newStatus };
                        }
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
            setSelection((prev) => {
                const currentStatus = prev.status || "live";
                let newStatus = currentStatus;
                if (currentStatus === "live") newStatus = "modified";
                return { ...prev, ...changes, status: newStatus };
            });
        }

        // 3. If Scene, Update Cache
        if (type === "scene" && sceneCache[id]) {
            setSceneCache((prev) => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    ...changes,
                    // Cache logic for status is tricky, let's just merge changes.
                    // The hierarchy status is the source of truth for labels.
                },
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
                                        // Preserve existing status (calculated locally as 'modified' or 'new')
                                        // Backend doesn't send status.
                                        return {
                                            ...node,
                                            ...syncedArea,
                                            status: node.status,
                                        };
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
                    fetchPendingCount(); // Refresh counter immediately
                } catch (error) {
                    console.error(
                        "[Area Save] Failed to auto-save area:",
                        error
                    );
                    showNotification(
                        "Auto-Save Failed",
                        "Failed to save changes. Please try again.",
                        "error"
                    );
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
                    fetchPendingCount(); // Refresh counter immediately
                } catch (error) {
                    console.error(
                        "[Scene Save] Failed to auto-save scene:",
                        error
                    );
                    showNotification(
                        "Auto-Save Failed",
                        "Failed to save scene changes. Please try again.",
                        "error"
                    );
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

            // Inject Status for New Area
            const formattedNewArea = { ...newArea, status: "new" };

            if (!data.parent_id) {
                // ADD TO ROOT
                setHierarchy((prev) => [...prev, formattedNewArea]);
                fetchPendingCount();
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
                                children: [
                                    ...(node.children || []),
                                    formattedNewArea,
                                ],
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

            // Notification removed for smoother flow equivalent to previous commented out code
        } catch (e) {
            console.error(e);
            showNotification(
                "Creation Failed",
                "Failed to create area. Please try again.",
                "error"
            );
            throw e; // Modal will catch this
        }
    };

    // --- SCENE ACTIONS ---

    const handleUploadScenes = async (files, areaId = null) => {
        const targetAreaId = areaId || selection?.id;
        if (!targetAreaId) {
            showNotification(
                "Selection Required",
                "Please select an area first",
                "warning"
            );
            return;
        }

        setIsUploading(true);
        showNotification(
            "Uploading...",
            "Processing images and extracting GPS data. Please wait.",
            "info",
            0 // Disable auto-close for persistent loading state
        );

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
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        showNotification(
                            "Uploading...",
                            percentCompleted < 100
                                ? `Sending data: ${percentCompleted}%`
                                : "Data sent! Now reading GPS metadata (this may take a moment)...",
                            "info",
                            0 // Keep persistent
                        );
                    },
                }
            );

            // Backend returns 'scenes' with JPG paths initially.
            // Viewer will load JPGs immediately.
            // Background job will update DB to WebP later.
            // URL change (WebP) will bust cache naturally.

            const uploadedScenes = response.data.scenes || [];

            setHierarchy((prev) => {
                const updateScenes = (nodes) => {
                    return nodes.map((node) => {
                        if (node.id === targetAreaId && node.type === "area") {
                            // Enrich new scenes
                            const newEnrichedScenes = uploadedScenes.map(
                                (scene) => ({
                                    ...scene,
                                    status: "new",
                                })
                            );

                            // Merge with existing scenes
                            const existingScenes = node.scenes || [];
                            const mergedScenes = [
                                ...existingScenes,
                                ...newEnrichedScenes,
                            ];

                            return {
                                ...node,
                                scenes: mergedScenes,
                                status: !node.published_id ? "new" : "modified",
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

            showNotification(
                "Upload Successful",
                `${uploadedScenes.length} scenes uploaded! GPS data extracted. Processing WebP in background...`,
                "success"
            );
            fetchPendingCount();
        } catch (error) {
            // Detailed Error Notification
            console.error("Upload failed:", error);
            let errorTitle = "Upload Failed";
            let errorMessage = "Failed to upload scenes.";

            if (error.response) {
                if (error.response.status === 413) {
                    errorTitle = "File Too Large";
                    errorMessage = "Total upload size exceeds server limit.";
                } else if (error.response.status === 422) {
                    errorTitle = "Validation Error";
                    if (error.response.data.errors) {
                        const details = Object.values(
                            error.response.data.errors
                        )
                            .flat()
                            .join("\n");
                        errorMessage = details;
                    } else {
                        errorMessage =
                            error.response.data.message || "Invalid files.";
                    }
                } else {
                    errorMessage +=
                        ": " + (error.response.data.message || error.message);
                }
            }
            showNotification(errorTitle, errorMessage, "error");
        } finally {
            setIsUploading(false);
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

    const handleDeleteLink = async (linkId) => {
        // Only if currently selected is scene
        if (selection?.type !== "scene") return;

        const currentSceneId = selection.id;

        try {
            const response = await axios.delete(
                `/admin/visual-editor/api/scene/${currentSceneId}/link/${linkId}`
            );

            if (response.data.success) {
                // Update scene cache with response data (ensures sync with DB)
                setSceneCache((prev) => ({
                    ...prev,
                    [response.data.scene.id]: response.data.scene,
                }));
                console.log("Link deleted successfully");
                fetchPendingCount();
            } else {
                showNotification(
                    "Delete Failed",
                    "Failed to delete link: " + response.data.message,
                    "error"
                );
            }
        } catch (error) {
            console.error("Error deleting link:", error);
            showNotification(
                "Delete Failed",
                "Error deleting link: " +
                    (error.response?.data?.message || error.message),
                "error"
            );
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
            showNotification(
                "Save Successful",
                "Changes saved successfully.",
                "success"
            );
        } catch (error) {
            showNotification("Save Failed", "Failed to save changes.", "error");
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
            showNotification(
                "Auto-Link Complete",
                `Auto-linked ${res.data.count} connections!`,
                "success"
            );
            setAutoLinkModal({ isOpen: false, areaId: null, areaName: "" });
            // Reload details if current view is affected?
            fetchPendingCount();
        } catch (e) {
            showNotification(
                "Auto-Link Failed",
                "An error occurred while creating links.",
                "error"
            );
        }
    };

    // --- DELETE ACTION ---
    const handleDeleteNode = async (id, type) => {
        // CONFIRMATION REMOVED: Managed by ConfirmModal in PropertiesPanel
        // if (
        //     !confirm(
        //         `Are you sure you want to delete this ${type}? This action cannot be undone.`
        //     )
        // ) {
        //     return;
        // }

        const previousHierarchy = [...hierarchy];
        const previousSceneCache = { ...sceneCache };

        // 1. OPTIMISTIC UPDATE (Remove immediately)
        // 1. OPTIMISTIC UPDATE (Remove immediately)
        if (type === "area") {
            // Recursive filter
            const removeFromTree = (nodes) => {
                if (!Array.isArray(nodes)) return [];
                return nodes
                    .filter((n) => !(n.id == id && n.type === "area")) // Loose equality for safety
                    .map((n) => {
                        if (n.children && n.children.length > 0) {
                            return {
                                ...n,
                                children: removeFromTree(n.children),
                            }; // Immutable update
                        }
                        return n;
                    });
            };
            setHierarchy((prev) => removeFromTree(prev));
        } else if (type === "scene") {
            // Update Parent Area scene list
            const removeFromScenes = (nodes) => {
                if (!Array.isArray(nodes)) return [];
                return nodes.map((n) => {
                    if (n.scenes) {
                        n.scenes = n.scenes.filter((s) => s.id != id);
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

        // 2. BACKGROUND API CALL
        try {
            if (type === "area") {
                await axios.delete(route("admin.editor.area.destroy", id));
            } else if (type === "scene") {
                await axios.delete(route("admin.editor.scene.destroy", id));
            }

            // Success - Silent (or Toast)
            console.log(`${type} deleted successfully.`);
            fetchPendingCount();
        } catch (error) {
            console.error("Delete failed, reverting...", error);
            showNotification(
                "Delete Failed",
                "Failed to delete item: " +
                    (error.response?.data?.message || error.message),
                "error"
            );
            // Revert state
            setHierarchy(previousHierarchy);
            setSceneCache(previousSceneCache);
        }
    };

    // --- RENDER HELPERS ---
    const findPath = (nodes, targetId, targetType, currentPath = []) => {
        if (!nodes) return null;
        for (const node of nodes) {
            // Check current node (Area)
            if (node.id === targetId && node.type === targetType) {
                return [...currentPath, node];
            }

            // Check children (Sub-Areas)
            if (node.children) {
                const found = findPath(node.children, targetId, targetType, [
                    ...currentPath,
                    node,
                ]);
                if (found) return found;
            }

            // Check scenes (if target is scene)
            if (targetType === "scene" && node.scenes) {
                const foundScene = node.scenes.find((s) => s.id === targetId);
                if (foundScene) {
                    return [...currentPath, node, foundScene];
                }
            }
        }
        return null;
    };

    const getCurrentBreadcrumbs = () => {
        if (!selection) return [{ name: "Home" }];

        const path = findPath(hierarchy, selection.id, selection.type);
        if (path) {
            return path.map((node) => ({ name: node.name }));
        }

        // Fallback if not found (shouldn't happen if hierarchy is sync)
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
                        // Audit Mode Props
                        showStatusLabels={showStatusLabels}
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
                        // Audit Mode Props
                        showStatusLabels={showStatusLabels}
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
                    onUpdateLink={handleUpdateLink}
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
                fetchPendingCount();
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

    // --- LINK UPDATE HANDLER ---
    const handleUpdateLink = async (linkId, updates) => {
        if (!selection || selection.type !== "scene") return;

        const currentSceneId = selection.id;

        try {
            const response = await axios.patch(
                `/admin/visual-editor/api/scene/${currentSceneId}/link/${linkId}`,
                updates
            );

            if (response.data.success) {
                // Update scene cache with new data
                setSceneCache((prev) => ({
                    ...prev,
                    [response.data.scene.id]: response.data.scene,
                }));
                console.log("Link updated successfully");
                fetchPendingCount();
            } else {
                alert("Failed to update link: " + response.data.message);
            }
        } catch (error) {
            console.error("Error updating link:", error);
            alert(
                "Error updating link: " +
                    (error.response?.data?.message || error.message)
            );
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
                    pendingCount={pendingCount}
                    onOpenReview={() => setShowPendingChanges(true)}
                    // Pass current root ID for discard logic
                    rootId={hierarchy?.length > 0 ? hierarchy[0].id : null}
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
                        setHierarchy={setHierarchy}
                        // Audit Mode Props
                        showStatusLabels={showStatusLabels}
                        toggleStatusLabels={() =>
                            setShowStatusLabels((prev) => !prev)
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
                        // Audit Mode Props
                        showStatusLabels={showStatusLabels}
                    />
                </div>

                {/* MODALS */}
                <NotificationModal
                    isOpen={notification.isOpen}
                    onClose={() =>
                        setNotification({ ...notification, isOpen: false })
                    }
                    title={notification.title}
                    message={notification.message}
                    variant={notification.variant}
                    autoClose={notification.autoClose}
                />
                <AutoLinkModal
                    isOpen={autoLinkModal.isOpen}
                    onClose={() =>
                        setAutoLinkModal({ ...autoLinkModal, isOpen: false })
                    }
                    area={autoLinkModal.area}
                    onSuccess={() => {
                        // Reload hierarchy data from server without full page refresh
                        router.reload({
                            only: ["hierarchy"],
                            onSuccess: () => {
                                fetchPendingCount();
                                console.log("Hierarchy reloaded via SPA");
                            },
                        });
                    }}
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
                    accept=".jpg,.jpeg,.png"
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
                    excludedTargetIds={
                        selection &&
                        selection.type === "scene" &&
                        sceneCache[selection.id]?.links
                            ? sceneCache[selection.id].links.map(
                                  (l) => l.target_scene_id
                              )
                            : []
                    }
                />

                <PendingChangesModal
                    isOpen={showPendingChanges}
                    onClose={() => setShowPendingChanges(false)}
                    rootId={hierarchy?.length > 0 ? hierarchy[0].id : null}
                    onPublished={() => {
                        fetchPendingCount();
                        // Ideally reload page or reset state?
                        // Reloading is safest to clear drafts local state
                        window.location.reload();
                    }}
                />
            </div>
        </ThemeProvider>
    );
}

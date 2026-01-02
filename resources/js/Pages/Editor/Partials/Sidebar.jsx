import React, { useState } from "react";
import axios from "axios";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function Sidebar({
    hierarchy,
    selection,
    onSelect,
    onToggleExpand,
    expandedIds,
    onCreateArea,
    onAutoLink,
    setHierarchy, // Needed for optimistic update
    showStatusLabels,
    toggleStatusLabels,
}) {
    const [searchQuery, setSearchQuery] = useState("");

    // --- DND SENSORS ---
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start drag (prevents accidental clicks)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --- SEARCH LOGIC ---

    // Flatten hierarchy for searching
    // Returns: [{ node: object, pathIds: [id, id], type: 'area'|'scene', pathNames: ['Root', 'Sub'] }]
    const flattenHierarchy = (nodes, parentPath = [], parentNames = []) => {
        let results = [];
        if (!nodes) return results;

        nodes.forEach((node) => {
            const currentPathIds = [...parentPath, node.id];
            const currentPathNames = [...parentNames, node.name];

            // Add Area
            results.push({
                node: { ...node, type: "area" },
                id: node.id,
                type: "area",
                pathIds: parentPath, // Path to reach this node (excluding self)
                pathNames: parentNames,
            });

            // Add Scenes
            if (node.scenes) {
                node.scenes.forEach((scene) => {
                    results.push({
                        node: { ...scene, type: "scene" },
                        id: scene.id,
                        type: "scene",
                        pathIds: currentPathIds, // Scene is child of current Area
                        pathNames: currentPathNames,
                    });
                });
            }

            // Recurse Children
            if (node.children) {
                results = results.concat(
                    flattenHierarchy(
                        node.children,
                        currentPathIds,
                        currentPathNames
                    )
                );
            }
        });
        return results;
    };

    const searchResults = React.useMemo(() => {
        if (!searchQuery.trim()) return [];
        const flat = flattenHierarchy(hierarchy);
        const lowerQuery = searchQuery.toLowerCase();
        return flat.filter((item) =>
            item.node.name.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery, hierarchy]);

    const handleResultClick = (result) => {
        // 1. Expand all parents
        result.pathIds.forEach((parentId) => {
            if (!expandedIds.includes(parentId)) {
                onToggleExpand(parentId);
            }
        });

        // 2. Select the node
        onSelect(result.node);

        // 3. Clear search to show tree
        setSearchQuery("");
    };

    // --- DND LOGIC ---
    const getDndId = (type, id) => `${type}-${id}`;

    // Find generic helper
    const findNodeGroup = (nodes, childId, childType) => {
        // Check root level
        const currentLevelIds = nodes.map((n) => getDndId("area", n.id));
        const targetDndId = getDndId(childType, childId);

        if (currentLevelIds.includes(targetDndId) && childType === "area") {
            return { list: nodes, parent: null };
        }

        for (let node of nodes) {
            // Check Scenes
            if (childType === "scene" && node.scenes) {
                const sceneIds = node.scenes.map((s) =>
                    getDndId("scene", s.id)
                );
                if (sceneIds.includes(targetDndId)) {
                    return { list: node.scenes, parent: node };
                }
            }

            // Check Children Areas
            if (node.children) {
                // First check if target is in this children list
                const childrenIds = node.children.map((c) =>
                    getDndId("area", c.id)
                );
                if (childrenIds.includes(targetDndId) && childType === "area") {
                    return { list: node.children, parent: node };
                }

                // Recurse
                const found = findNodeGroup(node.children, childId, childType);
                if (found) return found;
            }
        }
        return null;
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) return;
        if (active.id === over.id) return;

        // Parse IDs (format: type-id)
        const [activeType, activeIdStr] = active.id.split("-");
        const [overType, overIdStr] = over.id.split("-");
        const activeId = parseInt(activeIdStr);

        // Allow reorder only if TYPES match
        if (activeType !== overType) return;

        // Find the group (list of siblings) this item belongs to
        // We assume they are siblings because SortableContext separates lists
        // But dragEnd event fires globally, so we must verify they are siblings
        // Actually, if we use separate SortableContexts, can we drag between them?
        // Yes, if we don't restrict it.
        // But we want to enforce siblings.

        // Logic:
        // 1. Find the parent group of 'active'.
        // 2. Check if 'over' is also in that group.
        // 3. If yes, reorder.

        // Note: For now, optimistic update is tricky because setHierarchy is passed from parent but not fully exposed in this file snippet as a prop (I added it to props above).
        // If setHierarchy is not passed, we can't do optimistic UI.
        // Assuming setHierarchy is passed (I added it to instructions).

        // console.log("Drag End:", { active: active.id, over: over.id });

        // Find group
        // This is expensive but fine for drag end
        // Trigger generic reorder

        try {
            const url = `/admin/visual-editor/api/${activeType}/${activeId}/reorder`;

            // Calculate indexes
            const group = findNodeGroup(hierarchy, activeId, activeType);
            if (!group || !group.list) return;

            const oldIndex = group.list.findIndex((n) => n.id === activeId);
            const targetIndex = group.list.findIndex(
                (n) => n.id === parseInt(overIdStr)
            );

            if (targetIndex === -1) return; // Not siblings

            const newIndexVal = targetIndex; // This is what backend expects (insertion index)

            // OPTIMISTIC UPDATE
            const previousHierarchy = [...hierarchy]; // Shallow copy for revert (deep copy better if complex, but sufficient for top-level replacement)
            // Actually, we need a deep copy strategy or structural sharing to update nested state

            // Helper to recursively update the tree
            const updateTreeRec = (nodes) => {
                // Check if this list contains our items (by checking first item's parent or just ID match?)
                // Since we found 'group' earlier, we know where they are.
                // BUT 'group.list' is a reference to the node's children array.
                // We need to return a NEW array with the moved item.

                // We can't easily match 'nodes' reference because of React state immutability.
                // We need to traverse and match IDs.

                // Check if this 'nodes' array contains the activeId
                if (
                    nodes.some(
                        (n) =>
                            n.id === activeId &&
                            activeType === "area" &&
                            n.type !== "scene"
                    )
                ) {
                    // Check if it also contains overId to be sure it's the right list (siblings)
                    // If activeType is area, nodes should be areas.
                    // If we are moving areas.
                    if (activeType === "area") {
                        const idx1 = nodes.findIndex((n) => n.id === activeId);
                        const idx2 = nodes.findIndex(
                            (n) => n.id === parseInt(overIdStr)
                        );
                        if (idx1 !== -1 && idx2 !== -1) {
                            return arrayMove(nodes, idx1, idx2);
                        }
                    }
                }

                // If scenes
                // Scenes are inside a node, not the 'nodes' array itself (unless nodes IS a scenes array? No, handleDragEnd logic)

                return nodes.map((node) => {
                    const newNode = { ...node };

                    // Handle Area Children
                    if (node.children) {
                        newNode.children = updateTreeRec(node.children);
                    }

                    // Handle Scenes
                    if (node.scenes) {
                        if (activeType === "scene") {
                            const idx1 = node.scenes.findIndex(
                                (s) => s.id === activeId
                            );
                            const idx2 = node.scenes.findIndex(
                                (s) => s.id === parseInt(overIdStr)
                            );
                            if (idx1 !== -1 && idx2 !== -1) {
                                newNode.scenes = arrayMove(
                                    node.scenes,
                                    idx1,
                                    idx2
                                );
                            }
                        }
                    }
                    return newNode;
                });
            };

            // Apply Optimistic State
            // Special case: Root nodes (hierarchy itself)
            let newHierarchy;
            if (activeType === "area" && group.parent === null) {
                // Root level move
                const idx1 = hierarchy.findIndex((n) => n.id === activeId);
                const idx2 = hierarchy.findIndex(
                    (n) => n.id === parseInt(overIdStr)
                );
                if (idx1 !== -1 && idx2 !== -1) {
                    newHierarchy = arrayMove(hierarchy, idx1, idx2);
                } else {
                    newHierarchy = hierarchy;
                }
            } else {
                // Nested
                newHierarchy = updateTreeRec(hierarchy);
            }

            if (setHierarchy) {
                setHierarchy(newHierarchy);
            }

            // Call API
            await axios.post(url, { new_index: newIndexVal });

            // No reload - success
            // Optionally fetchPendingCount() here if parent has it? (Usually in VisualEditor, passed as prop? No, but UI is updated)
        } catch (error) {
            console.error("Reorder failed, reverting...", error);
            // Revert State
            if (setHierarchy) {
                // We need to structurally revert.
                // Simple way: We don't have previous deep copy.
                // Ideally we should have kept a deep copy or just reload.
                alert("Gagal mengurutkan ulang di server. Memuat ulang...");
                window.location.reload();
            }
        }
    };

    // Recursive Item Component
    const HierarchyItem = ({ node, level }) => {
        const isExpanded = expandedIds.includes(node.id);
        const isSelected =
            selection?.type === node.type && selection?.id === node.id;
        const hasChildren =
            (node.children && node.children.length > 0) ||
            (node.scenes && node.scenes.length > 0);

        // Visibility Logic
        // NEW/MODIFIED: Always show
        // LIVE: Show if Audit Mode OR Selected OR Hovered
        const showLive =
            node.status === "live" || (!node.status && node.published_id);
        const isLiveVisible = showLive && (showStatusLabels || isSelected); // Hover handled by CSS group-hover

        // DND HOOK
        const dndId = getDndId(node.type, node.id);
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: dndId });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
            zIndex: isDragging ? 999 : "auto",
        };

        const handleToggle = (e) => {
            e.stopPropagation();
            onToggleExpand(node.id);
        };

        const handleClick = () => {
            onSelect(node);
        };

        // Icon Logic based on Level/Type
        const getIcon = () => {
            if (node.type === "scene") return "360";
            if (level === 0) return "domain"; // Root
            if (level === 1) {
                // Level 2: Use is_container to determine icon
                return node.is_container ? "layers" : "meeting_room";
            }
            return "meeting_room"; // L2+
        };

        const getIconColorClass = () => {
            // NO red for selected - keep category-based colors
            if (node.type === "scene") return "text-purple-500"; // Scenes - purple
            if (level === 0) return "text-amber-500"; // Level 1 - amber
            // Level 2: blue if container (has children), teal if leaf
            if (level === 1) {
                return node.is_container ? "text-blue-500" : "text-teal-500";
            }
            return "text-teal-500"; // Level 3+ - teal
        };

        return (
            <div className="group/item" ref={setNodeRef} style={style}>
                <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group/row
                    ${
                        isSelected
                            ? "theme-sidebar-item-active"
                            : "theme-sidebar-item border-l-2 border-l-transparent"
                    }`}
                    onClick={handleClick}
                    {...attributes}
                    {...listeners} // Handle drag on entire row
                >
                    {/* Expand/Collapse or Dot */}
                    <div
                        onClick={handleToggle}
                        className="w-5 h-5 flex items-center justify-center cursor-pointer"
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking expand
                    >
                        {hasChildren ? (
                            <span
                                className={`material-symbols-outlined ${
                                    isSelected
                                        ? "text-text-light dark:text-text-dark"
                                        : "text-slate-400"
                                } text-[20px] transition-transform ${
                                    isExpanded ? "rotate-90" : ""
                                }`}
                            >
                                arrow_right
                            </span>
                        ) : // Dot for leaf items
                        node.type === "scene" ? null : (
                            <div className="w-1.5 h-1.5 rounded-full theme-text-subtle"></div>
                        )}
                    </div>

                    {/* Node Icon */}
                    <span
                        className={`material-symbols-outlined text-[20px] ${getIconColorClass()}`}
                    >
                        {getIcon()}
                    </span>

                    {/* Label*/}
                    <span
                        className={`text-sm truncate flex-1 ${
                            isSelected ? "font-bold" : "font-medium"
                        }`}
                    >
                        {node.name}
                    </span>

                    {/* STATUS BADGE */}
                    {showStatusLabels && (
                        <>
                            {node.status === "new" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    NEW
                                </span>
                            )}
                            {node.status === "modified" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    MOD
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Children Container */}
                {isExpanded && hasChildren && (
                    <div className="pl-4 ml-2.5 border-l border-border-light dark:border-border-dark space-y-1 my-1">
                        {/* Nested Sortable Contexts */}

                        {/* Sub Areas */}
                        {node.children && node.children.length > 0 && (
                            <SortableContext
                                items={node.children.map((c) =>
                                    getDndId("area", c.id)
                                )}
                                strategy={verticalListSortingStrategy}
                            >
                                {node.children.map((child) => (
                                    <HierarchyItem
                                        key={`area-${child.id}`}
                                        node={{ ...child, type: "area" }}
                                        level={level + 1}
                                    />
                                ))}
                            </SortableContext>
                        )}

                        {/* Scenes */}
                        {node.scenes && node.scenes.length > 0 && (
                            <SortableContext
                                items={node.scenes.map((s) =>
                                    getDndId("scene", s.id)
                                )}
                                strategy={verticalListSortingStrategy}
                            >
                                {node.scenes.map((scene) => (
                                    <HierarchyItem
                                        key={`scene-${scene.id}`}
                                        node={{ ...scene, type: "scene" }}
                                        level={level + 1}
                                    />
                                ))}
                            </SortableContext>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-80 flex flex-col border-r theme-border theme-sidebar z-10 font-sans">
            {/* User Provided Header (Search + Buttons) */}
            <div className="p-4 border-b theme-border space-y-3 shrink-0">
                <div className="flex gap-2">
                    <label className="relative flex items-center flex-1">
                        <span className="absolute left-3 theme-text-muted material-symbols-outlined text-[20px]">
                            search
                        </span>
                        <input
                            className="w-full theme-input text-sm theme-text rounded-lg pl-10 pr-4 py-2.5 border theme-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 theme-text-muted hover:text-red-500"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    close
                                </span>
                            </button>
                        )}
                    </label>
                    {/* TOGGLE STATUS LABELS */}
                    <button
                        onClick={toggleStatusLabels}
                        className={`w-10 flex items-center justify-center rounded-lg border transition-all ${
                            showStatusLabels
                                ? "bg-primary/20 text-primary border-primary/50"
                                : "theme-bg-secondary theme-text-muted border-transparent hover:border-border-light dark:hover:border-border-dark"
                        }`}
                        title={
                            showStatusLabels
                                ? "Sembunyikan Label Status"
                                : "Tampilkan Label Status"
                        }
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {showStatusLabels ? "visibility" : "visibility_off"}
                        </span>
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onCreateArea}
                        disabled={selection?.type === "scene"}
                        className="flex-1 theme-btn-action-primary"
                        title={
                            selection?.type === "scene"
                                ? "Tidak dapat menambahkan area ke scene (Pilih area atau root terlebih dahulu)"
                                : "Buat Area Baru"
                        }
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            create_new_folder
                        </span>
                        <span>Buat Area Baru</span>
                    </button>
                </div>
                <button
                    onClick={() => onAutoLink?.(selection)}
                    disabled={!selection || selection?.type === "scene"}
                    className="w-full theme-btn-action-primary"
                    title={
                        !selection
                            ? "Pilih area terlebih dahulu"
                            : selection?.type === "scene"
                            ? "Tidak dapat menautkan otomatis scene (Pilih area)"
                            : "Tautkan otomatis scene di area ini dan turunannya"
                    }
                >
                    <span className="material-symbols-outlined text-[18px]">
                        link
                    </span>
                    <span>Buat Link Otomatis</span>
                </button>
            </div>

            {/* Tree Section Header or Search Results Header */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-[#111a22] border-b theme-border flex items-center justify-between shrink-0 sticky top-0 z-10">
                <div>
                    <h3 className="theme-section-header">
                        {searchQuery
                            ? `Hasil Pencarian (${searchResults.length})`
                            : "Hierarki Area"}
                    </h3>
                    {!searchQuery && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[10px]">
                                lightbulb
                            </span>
                            Tip: Tarik item untuk mengurutkan ulang
                        </p>
                    )}
                </div>
                <span className="material-symbols-outlined theme-text-muted text-[16px]">
                    {searchQuery ? "search" : "folder"}
                </span>
            </div>

            {/* Content: Tree or Search Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {searchQuery ? (
                    // SEARCH RESULTS MODE
                    searchResults.length > 0 ? (
                        <div className="space-y-1">
                            {searchResults.map((result) => (
                                <div
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleResultClick(result)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors theme-sidebar-item hover:bg-black/5 dark:hover:bg-white/5"
                                >
                                    {/* Icon */}
                                    <span
                                        className={`material-symbols-outlined text-[20px] shrink-0 ${
                                            result.type === "scene"
                                                ? "text-purple-500"
                                                : result.pathIds.length === 0
                                                ? "text-amber-500"
                                                : result.pathIds.length === 1
                                                ? result.node.is_container
                                                    ? "text-blue-500"
                                                    : "text-teal-500"
                                                : "text-teal-500"
                                        }`}
                                    >
                                        {result.type === "scene"
                                            ? "360"
                                            : result.pathIds.length === 0
                                            ? "domain"
                                            : result.pathIds.length === 1
                                            ? result.node.is_container
                                                ? "layers"
                                                : "meeting_room"
                                            : "meeting_room"}
                                    </span>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {result.node.name}
                                        </div>
                                        <div className="text-[10px] theme-text-muted truncate flex items-center gap-1">
                                            {result.pathNames.length > 0
                                                ? result.pathNames.join(" > ")
                                                : "Root"}
                                        </div>
                                    </div>

                                    <span className="material-symbols-outlined theme-text-subtle text-[16px]">
                                        arrow_forward
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center theme-text-muted text-sm">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block mx-auto">
                                search_off
                            </span>
                            Tidak ada hasil untuk "{searchQuery}"
                        </div>
                    )
                ) : // HIERARCHY TREE MODE
                hierarchy && hierarchy.length > 0 ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={hierarchy.map((h) => getDndId("area", h.id))}
                            strategy={verticalListSortingStrategy}
                        >
                            {hierarchy.map((rootArea) => (
                                <HierarchyItem
                                    key={`root-${rootArea.id}`}
                                    node={rootArea}
                                    level={0}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                ) : (
                    <div className="p-8 text-center">
                        <div className="theme-text-muted text-xs mb-2">
                            Tidak ada area ditemukan
                        </div>
                        <button
                            onClick={onCreateArea}
                            className="text-[10px] font-bold text-action-primary border border-action-primary/30 rounded px-3 py-1 hover:bg-action-primary/10 transition-colors"
                        >
                            Buat Area Utama
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

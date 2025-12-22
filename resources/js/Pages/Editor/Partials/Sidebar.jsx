import React, { useState } from "react";
import { FaPlus, FaFolder } from "react-icons/fa"; // Assuming react-icons available, else fallback to material symbols

export default function Sidebar({
    hierarchy,
    selection,
    onSelect,
    onToggleExpand,
    expandedIds,
    onCreateArea,
    onAutoLink,
}) {
    // Recursive Item Component
    const HierarchyItem = ({ node, level }) => {
        const isExpanded = expandedIds.includes(node.id);
        const isSelected =
            selection?.type === node.type && selection?.id === node.id;
        const hasChildren =
            (node.children && node.children.length > 0) ||
            (node.scenes && node.scenes.length > 0);

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
            if (level === 1) return "layers"; // L1
            return "meeting_room"; // L2+
        };

        const getIconColorClass = () => {
            if (isSelected && node.type === "area") return "text-primary";
            if (node.type === "scene") return "text-purple-500"; // Scenes - purple
            if (level === 0) return "text-amber-500"; // Level 1 - amber
            if (level === 1) return "text-blue-500"; // Level 2 - blue
            return "text-teal-500"; // Level 3+ - teal
        };

        // Indentation via nested padding/margins mimicking the HTML structure
        // The HTML uses nested divs with border-l. We can replicate this visually or recursively.
        // For simplicity and matching the "border-l" look, we render children in a container with border-l.

        return (
            <div className="group">
                <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
                    ${
                        isSelected
                            ? "theme-sidebar-item-active border"
                            : "theme-sidebar-item border border-transparent"
                    }`}
                    onClick={handleClick}
                >
                    {/* Expand/Collapse or Dot */}
                    <div
                        onClick={handleToggle}
                        className="w-5 h-5 flex items-center justify-center cursor-pointer"
                    >
                        {hasChildren ? (
                            <span
                                className={`material-symbols-outlined ${
                                    isSelected
                                        ? "text-primary"
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

                    {/* Label */}
                    <span
                        className={`text-sm truncate flex-1 ${
                            isSelected ? "font-bold" : "font-medium"
                        }`}
                    >
                        {node.name}
                    </span>

                    {/* LIVE badge for Root */}
                    {level === 0 && isSelected && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-500">
                            LIVE
                        </span>
                    )}
                </div>

                {/* Children Container - The crucial border-l for hierarchy visual */}
                {isExpanded && hasChildren && (
                    <div className="pl-4 ml-2.5 border-l border-border-light dark:border-border-dark space-y-1 my-1">
                        {/* Sub Areas */}
                        {node.children &&
                            node.children.map((child) => (
                                <HierarchyItem
                                    key={`area-${child.id}`}
                                    node={{ ...child, type: "area" }}
                                    level={level + 1}
                                />
                            ))}
                        {/* Scenes */}
                        {node.scenes &&
                            node.scenes.map((scene) => (
                                <HierarchyItem
                                    key={`scene-${scene.id}`}
                                    node={{ ...scene, type: "scene" }}
                                    level={level + 1}
                                />
                            ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-80 flex flex-col border-r theme-border theme-sidebar z-10 font-sans">
            {/* User Provided Header (Search + Buttons) */}
            <div className="p-4 border-b theme-border space-y-3 shrink-0">
                <label className="relative flex items-center w-full">
                    <span className="absolute left-3 theme-text-muted material-symbols-outlined text-[20px]">
                        search
                    </span>
                    <input
                        className="w-full theme-input text-sm theme-text rounded-lg pl-10 pr-4 py-2.5 border theme-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        placeholder="Filter scenes..."
                    />
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={onCreateArea}
                        disabled={selection?.type === "scene"}
                        className="flex-1 theme-btn-action"
                        title={
                            selection?.type === "scene"
                                ? "Cannot add area to a scene (Select an area or root first)"
                                : "Add New Area"
                        }
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            create_new_folder
                        </span>
                        <span>Create New Area</span>
                    </button>
                </div>
                <button
                    onClick={() => onAutoLink?.(selection)}
                    disabled={!selection || selection?.type === "scene"}
                    className="w-full theme-btn-action"
                    title={
                        !selection
                            ? "Select an area first"
                            : selection?.type === "scene"
                            ? "Cannot auto-link a scene (Select an area)"
                            : "Auto-link scenes in this area and its descendants"
                    }
                >
                    <span className="material-symbols-outlined text-[18px]">
                        link
                    </span>
                    <span>Create Auto Link Scene</span>
                </button>
            </div>

            {/* Tree Section Header */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-[#111a22] border-b theme-border flex items-center justify-between shrink-0 sticky top-0 z-10">
                <h3 className="theme-section-header">Areas Hierarchy</h3>
                <span className="material-symbols-outlined theme-text-muted text-[16px]">
                    folder
                </span>
            </div>

            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {hierarchy && hierarchy.length > 0 ? (
                    hierarchy.map((rootArea) => (
                        <HierarchyItem
                            key={`root-${rootArea.id}`}
                            node={rootArea}
                            level={0}
                        />
                    ))
                ) : (
                    <div className="p-8 text-center">
                        <div className="theme-text-muted text-xs mb-2">
                            No areas found
                        </div>
                        <button
                            onClick={onCreateArea}
                            className="text-[10px] font-bold text-primary border border-primary/30 rounded px-3 py-1 hover:bg-primary/10 transition-colors"
                        >
                            Create Root Area
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

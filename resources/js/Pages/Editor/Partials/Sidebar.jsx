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
            if (level === 0) return "text-amber-500";
            return "text-slate-400"; // Default slate for others
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
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-slate-100 dark:hover:bg-[#233648] text-slate-600 dark:text-[#92adc9] border border-transparent"
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
                        ) : // Dot for leaf items roughly matches "meeting_room" indentation in HTML #2 example
                        // actually HTML #2 uses dot for leaf areas? No, looks like arrow_right is used if it's a folder.
                        // If it is a scene, HTML #3 uses "360" icon directly without arrow.
                        node.type === "scene" ? null : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
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
        <aside className="w-80 flex flex-col border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark z-10 font-sans">
            {/* User Provided Header (Search + Buttons) */}
            <div className="p-4 border-b border-border-light dark:border-border-dark space-y-3 shrink-0">
                <label className="relative flex items-center w-full">
                    <span className="absolute left-3 text-slate-400 material-symbols-outlined text-[20px]">
                        search
                    </span>
                    <input
                        className="w-full bg-slate-100 dark:bg-[#111a22] text-sm text-slate-900 dark:text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 border-none focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        placeholder="Filter scenes..."
                    />
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={onCreateArea}
                        disabled={selection?.type === "scene"}
                        className="flex-1 flex items-center justify-center gap-2 h-9 bg-slate-100 dark:bg-[#233648] hover:bg-slate-200 dark:hover:bg-[#2f455a] text-slate-700 dark:text-white text-xs font-bold rounded-lg transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                            selection?.type === "scene"
                                ? "Cannot add area to a scene (Select an area or root first)"
                                : "Add New Area"
                        }
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            create_new_folder
                        </span>
                        <span>Area</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 h-9 bg-slate-100 dark:bg-[#233648] hover:bg-slate-200 dark:hover:bg-[#2f455a] text-slate-700 dark:text-white text-xs font-bold rounded-lg transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-500">
                        <span className="material-symbols-outlined text-[18px]">
                            add_photo_alternate
                        </span>
                        <span>Add Scene</span>
                    </button>
                </div>
                <button
                    onClick={() => onAutoLink?.(selection)}
                    disabled={!selection || selection?.type === "scene"}
                    className="w-full flex items-center justify-center gap-2 h-9 bg-slate-100 dark:bg-[#233648] hover:bg-slate-200 dark:hover:bg-[#2f455a] text-slate-700 dark:text-white text-xs font-bold rounded-lg transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <span>Auto Link Scene</span>
                </button>
            </div>

            {/* Tree Section Header */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-[#15202b] border-b border-border-light dark:border-border-dark flex items-center justify-between shrink-0 sticky top-0 z-10">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Areas Hierarchy
                </h3>
                <span className="material-symbols-outlined text-slate-400 text-[16px]">
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
                        <div className="text-slate-600 text-xs mb-2">
                            No areas found
                        </div>
                        <button
                            onClick={onCreateArea}
                            className="text-[10px] font-bold text-blue-500 border border-blue-500/30 rounded px-3 py-1 hover:bg-blue-500/10 transition-colors"
                        >
                            Create Root Area
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

import React, { useState } from "react";
import {
    FaSearch,
    FaChevronDown,
    FaChevronRight,
    FaChevronLeft,
    FaUserCircle,
    FaSignOutAlt,
    FaSignInAlt,
    FaCamera,
} from "react-icons/fa";
import { Link, router } from "@inertiajs/react";
import { APP_DEFAULTS } from "@/Config/AppDefaults";

export default function Sidebar({
    menuData,
    onSelectLocation,
    user,
    isOpen,
    onToggle,
    // New optional prop for tracking expansion in tour
    onNodeExpand,
}) {
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState({});
    const [selectedId, setSelectedId] = useState(null); // Track single selected item

    const toggleExpand = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
        // Do NOT set selection when expanding
    };

    const handleSelect = (item, type) => {
        setSelectedId(item.id); // Set selection
        onSelectLocation(item, type); // Call parent handler
    };

    const handleItemClick = (area) => {
        const firstScene = area.scenes?.[0];
        if (firstScene) {
            onSelectLocation(area);
        } else {
            alert("Area ini belum ada fotonya.");
        }
    };

    const handleSceneClick = (scene) => {
        router.visit(route("tour.show", { scene: scene.id }));
    };

    // --- LOGIKA FILTER SEARCH ---
    const safeMenuData = Array.isArray(menuData) ? menuData : [];
    const filteredData = safeMenuData
        .map((root) => {
            const validChildren = (root.children || [])
                .map((sub) => {
                    const validGrandChildren = (sub.children || []).filter(
                        (cucu) =>
                            cucu.name
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );

                    // Check scenes match
                    const matchingScenes = (sub.scenes || []).filter((s) =>
                        s.name.toLowerCase().includes(search.toLowerCase())
                    );

                    const isSubMatch = sub.name
                        .toLowerCase()
                        .includes(search.toLowerCase());

                    // Should show SUB if: Name matches, OR has valid children, OR has matching scenes
                    // If search is empty, show everything.

                    if (
                        search &&
                        !isSubMatch &&
                        validGrandChildren.length === 0 &&
                        matchingScenes.length === 0
                    ) {
                        return null;
                    }

                    return {
                        ...sub,
                        children: validGrandChildren,
                        scenes: sub.scenes,
                    }; // Keep all scenes if parent matches? Or Filter?
                })
                .filter(Boolean);

            const isRootMatch = root.name
                .toLowerCase()
                .includes(search.toLowerCase());

            if (search && !isRootMatch && validChildren.length === 0) {
                return null;
            }

            return { ...root, children: validChildren };
        })
        .filter(Boolean);

    return (
        <aside
            className={`
            h-full md:absolute z-[1000] flex flex-col font-sans relative transition-all duration-300 ease-in-out
            w-full md:w-80
            ${
                isOpen
                    ? "md:left-5 md:top-5 md:h-[95vh] md:rounded-xl"
                    : "md:left-0 md:top-0 md:h-full md:rounded-none"
            }
        `}
        >
            {/* TOGGLE BUTTON */}
            <button
                onClick={onToggle}
                className={`
                    hidden md:flex absolute top-1/2 transform -translate-y-1/2 w-8 h-16 bg-white border-y border-r border-gray-200 rounded-r-xl items-center justify-center shadow-md text-gray-500 hover:text-[#D32F2F] hover:bg-gray-50 transition-all duration-300 z-[10]
                    -right-8
                `}
                title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
            >
                {isOpen ? (
                    <FaChevronLeft size={14} />
                ) : (
                    <FaChevronRight size={14} />
                )}
            </button>

            {/* CONTENT WRAPPER */}
            <div
                className={`
                flex flex-col h-full overflow-hidden transition-opacity duration-200 bg-white md:rounded-xl shadow-2xl border border-gray-100 relative z-[20]
                ${isOpen ? "opacity-100" : "opacity-0 invisible"}
            `}
            >
                {/* BRANDING */}
                <div className="p-6 border-b border-gray-100 bg-white shrink-0">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <img
                            src={APP_DEFAULTS.LOGO_URL}
                            alt={`${APP_DEFAULTS.NAME} Logo`}
                            className="h-10 w-auto object-contain"
                        />
                        <div className="flex flex-col">
                            <span className="leading-none tracking-tight">
                                {APP_DEFAULTS.NAME}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium tracking-widest mt-1">
                                {APP_DEFAULTS.TAGLINE.toUpperCase()}
                            </span>
                        </div>
                    </h1>
                </div>

                {/* SEARCH */}
                <div id="sidebar-tools" className="p-4 bg-gray-50/50 shrink-0">
                    <div className="relative group">
                        <FaSearch className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#D32F2F] transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari lokasi..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] outline-none transition-all shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* LIST UTAMA */}
                <div
                    id="sidebar-tree"
                    className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar"
                >
                    {filteredData.map((root) => (
                        <div key={root.id}>
                            {/* LEVEL 1: ROOT */}
                            {(() => {
                                const hasChildren =
                                    root.children && root.children.length > 0;
                                const isFolder = root.is_parent || hasChildren;
                                const isSelected = selectedId === root.id;

                                return (
                                    <div
                                        id={`sidebar-item-${root.id}`}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                            isSelected
                                                ? "bg-red-50 text-[#D32F2F] border border-red-200"
                                                : "hover:bg-gray-50 text-gray-700 border border-transparent"
                                        }`}
                                        onClick={() => {
                                            // Select the item
                                            handleSelect(
                                                root,
                                                isFolder
                                                    ? "grandparent"
                                                    : "child"
                                            );
                                        }}
                                    >
                                        {/* Expand button or dot */}
                                        <div className="flex items-center gap-2 flex-1">
                                            <div
                                                id={`sidebar-arrow-${root.id}`}
                                                onClick={(e) => {
                                                    if (isFolder) {
                                                        e.stopPropagation();
                                                        toggleExpand(root.id);
                                                        // Notify parent for Tour Logic
                                                        if (onNodeExpand)
                                                            onNodeExpand(
                                                                root.id
                                                            );
                                                    }
                                                }}
                                                className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded transition-colors"
                                            >
                                                {isFolder ? (
                                                    <FaChevronDown
                                                        size={12}
                                                        className={`transition-transform ${
                                                            expanded[root.id]
                                                                ? "rotate-90"
                                                                : ""
                                                        } ${
                                                            isSelected
                                                                ? "text-[#D32F2F]"
                                                                : "text-gray-400"
                                                        }`}
                                                    />
                                                ) : (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold">
                                                {root.name}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* CHILDREN */}
                            {(expanded[root.id] || search) && (
                                <div className="ml-7 border-l border-gray-200">
                                    {/* Sub Areas (LEVEL 2) */}
                                    {root.children?.map((sub) => {
                                        const hasSubChildren =
                                            sub.children &&
                                            sub.children.length > 0;
                                        const isFolder =
                                            sub.is_parent || hasSubChildren;
                                        const isSelected =
                                            selectedId === sub.id;

                                        return (
                                            <div
                                                key={sub.id}
                                                className="relative"
                                            >
                                                <div
                                                    id={`sidebar-item-${sub.id}`}
                                                    className={`flex items-center gap-2 py-2 px-3 cursor-pointer rounded-r-lg transition-colors ${
                                                        isSelected
                                                            ? "bg-red-50 text-[#D32F2F]"
                                                            : "hover:bg-gray-50 text-gray-700"
                                                    }`}
                                                    onClick={() => {
                                                        // Select the item
                                                        handleSelect(
                                                            sub,
                                                            isFolder
                                                                ? "parent"
                                                                : "child"
                                                        );
                                                    }}
                                                >
                                                    <div
                                                        onClick={(e) => {
                                                            if (isFolder) {
                                                                e.stopPropagation();
                                                                toggleExpand(
                                                                    sub.id
                                                                );
                                                            }
                                                        }}
                                                        className="w-5 h-5 flex items-center justify-center cursor-pointer"
                                                    >
                                                        {isFolder ? (
                                                            <FaChevronDown
                                                                size={12}
                                                                className={`transition-transform ${
                                                                    expanded[
                                                                        sub.id
                                                                    ]
                                                                        ? "rotate-90"
                                                                        : ""
                                                                } ${
                                                                    isSelected
                                                                        ? "text-[#D32F2F]"
                                                                        : "text-gray-400"
                                                                }`}
                                                            />
                                                        ) : (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        {sub.name}
                                                    </span>
                                                </div>

                                                {/* Expanded Content (Sub-Children) */}
                                                {expanded[sub.id] && (
                                                    <div className="ml-7 border-l border-gray-200">
                                                        {/* Level 3 Areas (CHILD) */}
                                                        {sub.children?.map(
                                                            (cucu) => {
                                                                const isSelected =
                                                                    selectedId ===
                                                                    cucu.id;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            cucu.id
                                                                        }
                                                                        id={`sidebar-item-${cucu.id}`}
                                                                        onClick={() =>
                                                                            handleSelect(
                                                                                cucu,
                                                                                "child"
                                                                            )
                                                                        }
                                                                        className={`flex items-center gap-2 py-2 px-3 cursor-pointer rounded-r-lg transition-colors ${
                                                                            isSelected
                                                                                ? "bg-red-50 text-[#D32F2F]"
                                                                                : "hover:bg-gray-50 text-gray-700"
                                                                        }`}
                                                                    >
                                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                                                        </div>
                                                                        <span className="text-sm">
                                                                            {
                                                                                cucu.name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* USER SECTION */}
                <div
                    id="user-section"
                    className="p-4 border-t border-gray-100 bg-gray-50 shrink-0"
                >
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#D32F2F]">
                                    <FaUserCircle size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">
                                        {user.name}
                                    </span>
                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="p-2 text-gray-400 hover:text-[#D32F2F] hover:bg-white rounded-lg transition-all shadow-sm"
                                title="Keluar"
                            >
                                <FaSignOutAlt size={18} />
                            </Link>
                        </div>
                    ) : (
                        <Link
                            href={route("login")}
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#D32F2F] text-white rounded-lg text-sm font-bold hover:bg-[#b71c1c] transition-colors shadow-lg shadow-red-200"
                        >
                            <FaSignInAlt />
                            Masuk
                        </Link>
                    )}
                </div>
            </div>
        </aside>
    );
}

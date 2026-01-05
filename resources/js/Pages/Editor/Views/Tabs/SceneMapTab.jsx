import React, {
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback,
} from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Tooltip,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import { MAP_CONFIG } from "@/Config/MapConfig";

// --- UTILITIES ---

// --- UTILITIES ---

/**
 * Generates a deterministic HSL color from a string ID
 * Uses Golden Angle approximation to ensure distinct colors even for similar strings.
 */
const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use Golden Angle (approx 137.508 degrees) to scatter colors
    // This prevents similar strings (which produce close hash values) from having similar colors
    // adjacent integer hashes will result in hues ~137.5 degrees apart.
    const goldenAngle = 137.508;
    const h = (Math.abs(hash) * goldenAngle) % 360;

    // High saturation (75%) and slightly darker lightness (45%) for good contrast on map
    return `hsl(${h}, 75%, 45%)`;
};

// --- COMPONENTS ---

const createColoredIcon = (color, isActive = false, isHovered = false) => {
    const size = isActive || isHovered ? 40 : 30;
    const center = size / 2;
    const radius = isActive || isHovered ? size / 2 - 2 : size / 2 - 5;

    // SVG Marker with dynamic color and state
    const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="white" stroke-width="3" />
        ${
            isActive
                ? `<circle cx="${center}" cy="${center}" r="${
                      radius * 0.4
                  }" fill="white" />`
                : ""
        }
    </svg>`;

    return L.divIcon({
        className: "custom-div-icon",
        html: svg,
        iconSize: [size, size],
        iconAnchor: [center, center],
    });
};

function MapDraggableMarker({
    item,
    onDragEnd,
    isActive,
    isHovered,
    onClick,
    onHover,
}) {
    const markerRef = useRef(null);

    // Update marker icon when state changes without remounting
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setIcon(
                createColoredIcon(item.color, isActive, isHovered)
            );
            if (isActive || isHovered) {
                markerRef.current.setZIndexOffset(1000);
            } else {
                markerRef.current.setZIndexOffset(0);
            }
        }
    }, [item.color, isActive, isHovered]);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    onDragEnd(item.id, marker.getLatLng());
                }
            },
            click() {
                onClick(item);
            },
            mouseover() {
                onHover(item.id);
            },
            mouseout() {
                onHover(null);
            },
        }),
        [item, onDragEnd, onClick, onHover]
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[item.lat, item.lng]}
            ref={markerRef}
            icon={createColoredIcon(item.color, isActive, isHovered)}
        >
            <Tooltip
                direction="top"
                offset={[0, -20]}
                opacity={1}
                permanent={isActive || isHovered}
            >
                <div className="font-bold text-xs whitespace-nowrap">
                    {item.name}
                </div>
            </Tooltip>
        </Marker>
    );
}

// Handler for Map movements based on selection
function MapEffect({ activeScene }) {
    const map = useMap();
    useEffect(() => {
        if (activeScene && activeScene.lat && activeScene.lng) {
            // User requested "Max Zoom" for visibility
            // 20 is typically max zoom for satellite tiles
            map.flyTo([activeScene.lat, activeScene.lng], MAP_CONFIG.MAX_ZOOM, {
                animate: true,
                duration: 1.5,
            });
        }
    }, [activeScene, map]);
    return null;
}

// Handler for Initial Focus on Mount
function MapInitialFocus({ mappedScenes, area, onSetInitialActive }) {
    const map = useMap();
    const hasFocused = useRef(false);

    useEffect(() => {
        if (hasFocused.current) return;

        // Priority 1: First Mapped Scene (Max Zoom)
        if (mappedScenes && mappedScenes.length > 0) {
            const firstScene = mappedScenes[0];
            // Highlight it
            onSetInitialActive(firstScene);
            // Fly to it instantly or smooth? Instant is better for initial load.
            // Using setView for instant, zoom 19 (Safe Max)
            map.setView([firstScene.lat, firstScene.lng], MAP_CONFIG.MAX_ZOOM);
            hasFocused.current = true;
        }
        // Priority 2: Area GPS (High Zoom)
        else if (area.lat && area.lng) {
            map.setView([area.lat, area.lng], 18);
            hasFocused.current = true;
        }
        // Priority 3: Default (Standard Zoom)
        else {
            map.setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);
            hasFocused.current = true;
        }
    }, [mappedScenes, area, map, onSetInitialActive]);

    return null;
}

// --- DROP ZONE COMPONENT ---
function MapDropZone({ onDrop }) {
    const map = useMap();

    useEffect(() => {
        const container = map.getContainer();

        const handleDragOver = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        };

        const handleDrop = (e) => {
            e.preventDefault();
            const sceneId = e.dataTransfer.getData("scene_id");
            if (!sceneId) return;

            // Convert Pixel to LatLng
            const { clientX, clientY } = e;
            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            const latlng = map.containerPointToLatLng([x, y]);
            onDrop(parseInt(sceneId), latlng);
        };

        container.addEventListener("dragover", handleDragOver);
        container.addEventListener("drop", handleDrop);

        return () => {
            container.removeEventListener("dragover", handleDragOver);
            container.removeEventListener("drop", handleDrop);
        };
    }, [map, onDrop]);

    return null;
}

export default function SceneMapTab({ area, allScenes = [], onUpdateScene }) {
    // State
    const [isFilterExpanded, setIsFilterExpanded] = useState(true);
    const [activeScene, setActiveScene] = useState(null);
    const [hoveredSceneId, setHoveredSceneId] = useState(null);
    const listRef = useRef(null);

    // 1. Prepare Data: Sub-Area Map with Dynamic Colors
    const subAreaMap = useMemo(() => {
        const map = {};
        const children = area.children || [];
        children.forEach((child) => {
            // FILTER: Only show NON-CONTAINER areas (Leaf Nodes) in the list
            if (!child.is_container) {
                map[child.id] = {
                    name: child.name,
                    color: stringToColor(child.name + child.id), // Deterministic Color
                    visible: true,
                };
            }
        });
        return map;
    }, [area.children]);

    const [visibility, setVisibility] = useState({});

    // Initialize visibility when map changes
    useEffect(() => {
        setVisibility(
            Object.keys(subAreaMap).reduce((acc, id) => {
                acc[id] = true;
                return acc;
            }, {})
        );
    }, [subAreaMap]);

    const toggleVisibility = (id) => {
        setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // 2. Filter Scenes and Group by Area
    const { scenesByArea, unmappedScenes } = useMemo(() => {
        const byArea = {};
        const unmapped = [];

        allScenes.forEach((scene) => {
            const subAreaId = scene.parentId || scene.area_id;

            let subAreaInfo = subAreaMap[subAreaId];

            // Fallback for scenes in containers or root
            if (!subAreaInfo) {
                subAreaInfo = {
                    name: "Area Lain",
                    color: "#9ca3af", // grey-400
                    visible: true,
                };
            }

            const hasGPS =
                scene.lat &&
                scene.lng &&
                (parseFloat(scene.lat) !== 0 || parseFloat(scene.lng) !== 0);

            const sceneObj = {
                ...scene,
                color: subAreaInfo.color,
                subAreaName: subAreaInfo.name,
                subAreaId: subAreaId,
            };

            if (hasGPS) {
                if (visibility[subAreaId] !== false) {
                    // Group by Sub Area ID
                    if (!byArea[subAreaId]) {
                        byArea[subAreaId] = {
                            color: subAreaInfo.color,
                            scenes: [],
                        };
                    }
                    byArea[subAreaId].scenes.push(sceneObj);
                }
            } else {
                unmapped.push(sceneObj);
            }
        });

        return { scenesByArea: byArea, unmappedScenes: unmapped };
    }, [allScenes, subAreaMap, visibility]);

    // --- ACTIONS ---
    const handleDragScene = useCallback(
        (sceneId, latlng) => {
            onUpdateScene(sceneId, "scene", {
                lat: latlng.lat,
                lng: latlng.lng,
            });
        },
        [onUpdateScene]
    );

    const handleDropFromTray = useCallback(
        (sceneId, latlng) => {
            onUpdateScene(sceneId, "scene", {
                lat: latlng.lat,
                lng: latlng.lng,
            });
        },
        [onUpdateScene]
    );

    const handleDragStart = (e, scene) => {
        e.dataTransfer.setData("scene_id", scene.id);
        e.dataTransfer.effectAllowed = "move";
    };

    // Scroll to active item in list
    useEffect(() => {
        if (activeScene && listRef.current) {
            const item = listRef.current.querySelector(
                `[data-scene-id="${activeScene.id}"]`
            );
            if (item) {
                item.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    }, [activeScene]);

    return (
        <div className="flex h-full w-full relative group">
            {/* MAP CANVAS */}
            <div className="flex-1 relative z-0">
                <MapContainer
                    center={
                        area.lat
                            ? [area.lat, area.lng]
                            : MAP_CONFIG.DEFAULT_CENTER
                    }
                    zoom={MAP_CONFIG.MAX_ZOOM}
                    style={{ height: "100%", width: "100%" }}
                    className="z-0"
                    zoomControl={false}
                >
                    <TileLayer url={MAP_CONFIG.TILES.SATELLITE.URL} />
                    <MapDropZone onDrop={handleDropFromTray} />
                    <MapInitialFocus
                        mappedScenes={Object.values(scenesByArea).flatMap(
                            (g) => g.scenes
                        )}
                        area={area}
                        onSetInitialActive={setActiveScene}
                    />
                    <MapEffect activeScene={activeScene} />

                    {/* RENDER MARKERS DIRECTLY (NO CLUSTER) */}
                    {Object.entries(scenesByArea).map(
                        ([areaId, { scenes }]) => (
                            <React.Fragment key={areaId}>
                                {scenes.map((scene) => (
                                    <MapDraggableMarker
                                        key={scene.id}
                                        item={scene}
                                        isActive={activeScene?.id === scene.id}
                                        isHovered={hoveredSceneId === scene.id}
                                        onDragEnd={handleDragScene}
                                        onClick={setActiveScene}
                                        onHover={setHoveredSceneId}
                                    />
                                ))}
                            </React.Fragment>
                        )
                    )}
                </MapContainer>

                {/* COLLAPSIBLE LEGEND (Top Right) */}
                <div
                    className={`absolute top-4 right-4 z-[400] bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-xl rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out flex flex-col ${
                        isFilterExpanded ? "w-60" : "w-auto h-auto"
                    }`}
                >
                    {/* Header / Toggle */}
                    <div
                        className="p-3 flex items-center justify-between cursor-pointer border-b border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-t-lg"
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    >
                        {isFilterExpanded && (
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
                                <span className="material-symbols-outlined text-[14px]">
                                    filter_alt
                                </span>
                                Filter Ruangan
                            </h4>
                        )}
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <span className="material-symbols-outlined text-[18px]">
                                {isFilterExpanded
                                    ? "expand_less"
                                    : "filter_alt"}
                            </span>
                        </button>
                    </div>

                    {/* Content */}
                    {isFilterExpanded && (
                        <div className="overflow-y-auto custom-scrollbar p-1.5 space-y-0.5 max-h-[180px]">
                            {Object.entries(subAreaMap).length === 0 && (
                                <div className="p-3 text-center text-[10px] text-slate-400">
                                    Tidak ada ruangan untuk difilter.
                                </div>
                            )}

                            {Object.entries(subAreaMap).map(
                                ([id, { name, color }]) => (
                                    <div
                                        key={id}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded group transition-all"
                                        onClick={() => toggleVisibility(id)}
                                    >
                                        <div
                                            className={`flex-none w-4 h-4 rounded-full border border-white shadow-sm flex items-center justify-center transition-all ${
                                                visibility[id] !== false
                                                    ? "opacity-100 scale-100"
                                                    : "opacity-30 scale-75 grayscale"
                                            }`}
                                            style={{ backgroundColor: color }}
                                        >
                                            {visibility[id] !== false && (
                                                <span className="material-symbols-outlined text-[10px] text-white font-bold">
                                                    check
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            className={`text-xs truncate flex-1 font-medium ${
                                                visibility[id] !== false
                                                    ? "text-slate-700 dark:text-slate-200"
                                                    : "text-slate-400 decoration-slate-400 line-through"
                                            }`}
                                            title={name}
                                        >
                                            {name}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* UNMAPPED TRAY (Left Sidebar) */}
            {unmappedScenes.length > 0 && (
                <div
                    ref={listRef}
                    className="w-72 theme-border  theme-canvas flex flex-col z-10 shadow-2xl transition-all"
                >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 theme-border  theme-canvas">
                        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">
                                warning
                            </span>
                            Belum Ada GPS
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Drag & Drop scene ke peta.
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {unmappedScenes.map((scene) => (
                            <div
                                key={scene.id}
                                data-scene-id={scene.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, scene)}
                                onClick={() => setActiveScene(scene)}
                                onMouseEnter={() => setHoveredSceneId(scene.id)}
                                onMouseLeave={() => setHoveredSceneId(null)}
                                className={`
                                    p-2 rounded border cursor-move group shadow-sm transition-all flex items-center gap-3 relative
                                    ${
                                        activeScene?.id === scene.id
                                            ? "bg-primary/5 border-primary ring-1 ring-primary"
                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-md"
                                    }
                                `}
                            >
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                                    style={{ backgroundColor: scene.color }}
                                />

                                <img
                                    src={
                                        scene.image_url ||
                                        "/images/placeholder-360.jpg"
                                    }
                                    alt=""
                                    className="w-12 h-12 object-cover rounded bg-slate-200"
                                />
                                <div className="flex-1 min-w-0 pl-1">
                                    <div
                                        className={`text-xs font-bold truncate ${
                                            activeScene?.id === scene.id
                                                ? "text-primary"
                                                : "text-slate-700 dark:text-slate-300"
                                        }`}
                                    >
                                        {scene.name || "Untitled"}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                                        <span
                                            className="w-2 h-2 rounded-full inline-block"
                                            style={{
                                                backgroundColor: scene.color,
                                            }}
                                        ></span>
                                        {scene.subAreaName}
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 text-sm opacity-0 group-hover:opacity-100">
                                    drag_indicator
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Tooltip,
    useMapEvents,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import { MAP_CONFIG } from "@/Config/MapConfig";
import SceneMapTab from "./Tabs/SceneMapTab";

// Fix Leaflet Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Component to handle map clicks and marker updates
function LocationPicker({ isActive, onPick }) {
    useMapEvents({
        click(e) {
            if (isActive) {
                onPick(e.latlng);
            }
        },
    });
    return null;
}

// Component to center map when area changes
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

export default function AreaOverviewView({
    area,
    allAreas = [],
    onUpdate,
    onCreateChild,
    onUploadScene,
}) {
    const isLevel1 = area.level === 1;

    // Default Map Center (Semen Padang)
    const mapCenterLat = MAP_CONFIG.DEFAULT_CENTER[0];
    const mapCenterLng = MAP_CONFIG.DEFAULT_CENTER[1];

    // Current Area Location (Check if set)
    // We treat 0,0 or null as "Not Set"
    const hasLocation =
        area.lat &&
        area.lng &&
        (parseFloat(area.lat) !== 0 || parseFloat(area.lng) !== 0);
    const currentLat = hasLocation ? parseFloat(area.lat) : null;
    const currentLng = hasLocation ? parseFloat(area.lng) : null;

    // --- STATE & HOOKS (MUST BE TOP LEVEL) ---
    // 1. Picking Mode State
    const [isPickingMode, setIsPickingMode] = useState(false);
    const [tempLocation, setTempLocation] = useState(null);
    const [isLocationExpanded, setIsLocationExpanded] = useState(false); // New state for collapsible card

    // 2. Tabs State
    const [activeTab, setActiveTab] = useState("area_map"); // area_map, scene_map

    // 3. Helper to get ALL SCENES (Recursive/Flat)
    const allChildScenes = React.useMemo(() => {
        if (!area.children) return [];
        let scenes = [];
        area.children.forEach((child) => {
            if (child.scenes) {
                const childScenes = child.scenes.map((s) => ({
                    ...s,
                    parentId: child.id,
                }));
                scenes = [...scenes, ...childScenes];
            }
        });
        return scenes;
    }, [area.children]);

    // 4. Map Event Handler - ONLY set temp location, don't save yet
    const handleLocationSelect = (latlng) => {
        setTempLocation(latlng);
    };

    // 5. Save button handler - actually save to database
    const handleSaveLocation = () => {
        if (tempLocation && onUpdate) {
            onUpdate(area.id, "area", {
                lat: tempLocation.lat,
                lng: tempLocation.lng,
                latitude: tempLocation.lat,
                longitude: tempLocation.lng,
            });
            setTempLocation(null);
            setIsPickingMode(false);
        }
    };

    const handleInputChange = (field, value) => {
        if (onUpdate) {
            onUpdate(area.id, "area", {
                [field]: value,
            });
        }
    };

    // Custom Icons - Using unpkg CDN for reliability
    const normalIcon = new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });

    const activeIcon = new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [35, 57], // Larger
        iconAnchor: [17, 57], // Adjusted anchor
        popupAnchor: [1, -34],
        shadowSize: [50, 50],
        className: "active-marker-icon", // Add class for custom styling
    });

    // Hide all Leaflet UI controls and style active markers
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
            .leaflet-control-zoom,
            .leaflet-control-attribution {
                display: none !important;
            }
            .active-marker-icon {
                filter: hue-rotate(120deg) saturate(3) brightness(0.9);
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // Reset picking mode and temp location when changing areas
    useEffect(() => {
        setIsPickingMode(false);
        setTempLocation(null);
    }, [area.id]);

    if (isLevel1) {
        return (
            <div className="flex-1 relative flex flex-col theme-canvas overflow-hidden font-display">
                {/* HEADER & TABS */}
                <div className="flex-none px-6 pt-6 border-b theme-border z-20 theme-canvas">
                    <div className="flex items-start justify-between mb-6">
                        {/* LEFT: Title & Info */}
                        <div className="flex-1 pr-8">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-action-primary/20 text-action-primary uppercase tracking-wider">
                                    Area Utama
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold theme-text mb-1">
                                {area.name}
                            </h2>
                            <p className="theme-text-secondary text-sm max-w-xl">
                                Kelola Posisi Area utama serta Scene yang ada di
                                dalam Area ini.
                            </p>
                        </div>
                    </div>

                    {/* Tabs (Compact) */}
                    <div className="flex w-full justify-start gap-6 border-b border-transparent">
                        <button
                            onClick={() => setActiveTab("area_map")}
                            className={`text-sm font-bold pb-3 px-1 border-b-2 transition-all ${
                                activeTab === "area_map"
                                    ? "border-action-primary text-action-primary"
                                    : "border-transparent theme-text-secondary hover:text-action-primary"
                            }`}
                        >
                            Peta Area
                        </button>
                        <button
                            onClick={() => setActiveTab("scene_map")}
                            className={`text-sm font-bold pb-3 px-1 border-b-2 transition-all ${
                                activeTab === "scene_map"
                                    ? "border-action-primary text-action-primary"
                                    : "border-transparent theme-text-secondary hover:text-action-primary"
                            }`}
                        >
                            Peta Scene
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 relative">
                    {/* 1. PETA AREA (Existing MapContainer) */}
                    {activeTab === "area_map" && (
                        <div className="absolute inset-0 z-0">
                            <MapContainer
                                center={
                                    hasLocation
                                        ? [currentLat, currentLng]
                                        : [mapCenterLat, mapCenterLng]
                                }
                                zoom={hasLocation ? 16 : 14}
                                style={{ height: "100%", width: "100%" }}
                                className="opacity-90"
                                zoomControl={false}
                                attributionControl={false}
                            >
                                {/* Satellite Base Layer */}
                                <TileLayer
                                    url={MAP_CONFIG.TILES.SATELLITE.URL}
                                />

                                <LocationPicker
                                    isActive={isPickingMode}
                                    onPick={handleLocationSelect}
                                />

                                {/* Only center map if we have a location AND not picking (to avoid jumping while picking) */}
                                {hasLocation && !isPickingMode && (
                                    <MapUpdater
                                        center={[currentLat, currentLng]}
                                    />
                                )}

                                {/* Temp marker when picking */}
                                {tempLocation && (
                                    <Marker
                                        position={[
                                            tempLocation.lat,
                                            tempLocation.lng,
                                        ]}
                                        icon={activeIcon}
                                        zIndexOffset={2000}
                                    >
                                        <Tooltip
                                            permanent
                                            direction="right"
                                            offset={[15, -20]}
                                        >
                                            Lokasi Sementara
                                        </Tooltip>
                                    </Marker>
                                )}

                                {/* Render All Level 1 Markers */}
                                {allAreas
                                    .filter((a) => {
                                        // Only show Level 1 areas that have valid coordinates
                                        const isLevel1 =
                                            a.level === 1 || !a.parent_id;
                                        const hasCoords =
                                            a.lat != null && a.lng != null;
                                        return isLevel1 && hasCoords;
                                    })
                                    .map((node) => {
                                        const nodeLat = parseFloat(
                                            node.lat || node.latitude
                                        );
                                        const nodeLng = parseFloat(
                                            node.lng || node.longitude
                                        );
                                        const isActive = node.id === area.id;

                                        // Skip if invalid coords
                                        if (!nodeLat || !nodeLng) return null;

                                        return (
                                            <Marker
                                                key={node.id}
                                                position={[nodeLat, nodeLng]}
                                                icon={
                                                    isActive
                                                        ? activeIcon
                                                        : normalIcon
                                                }
                                                zIndexOffset={
                                                    isActive ? 1000 : 0
                                                }
                                            >
                                                {isActive && (
                                                    <Tooltip
                                                        direction="right"
                                                        offset={[15, -20]}
                                                        opacity={1}
                                                        permanent
                                                        className="custom-tooltip"
                                                    >
                                                        <span
                                                            style={{
                                                                fontWeight:
                                                                    "bold",
                                                                fontSize:
                                                                    "12px",
                                                                color: "#dc2626",
                                                            }}
                                                        >
                                                            {node.name}
                                                        </span>
                                                    </Tooltip>
                                                )}
                                                <Popup>{node.name}</Popup>
                                            </Marker>
                                        );
                                    })}
                            </MapContainer>

                            {/* COLLAPSIBLE MAP CONTROL (Top Right) */}
                            <div className="absolute top-4 right-4 z-[400] bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-xl rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out overflow-hidden flex flex-col items-end">
                                {/* Toggle Header */}
                                <div
                                    className="px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    onClick={() =>
                                        setIsLocationExpanded(
                                            !isLocationExpanded
                                        )
                                    }
                                >
                                    <div className="flex flex-col items-end">
                                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                            Koordinat Area
                                        </div>
                                        {hasLocation ? (
                                            <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                                                {currentLat.toFixed(6)},{" "}
                                                {currentLng.toFixed(6)}
                                            </div>
                                        ) : (
                                            <div className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">
                                                    warning
                                                </span>
                                                Belum Diatur
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className={`p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 transition-transform duration-300 ${
                                            isLocationExpanded
                                                ? "rotate-90"
                                                : ""
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            chevron_right
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <div
                                    className={`w-64 transition-all duration-300 ease-in-out ${
                                        isLocationExpanded
                                            ? "max-h-60 opacity-100 border-t border-slate-200 dark:border-slate-700"
                                            : "max-h-0 opacity-0"
                                    }`}
                                >
                                    <div className="p-4 space-y-4">
                                        {/* Inputs */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                                    Latitude
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    value={currentLat || ""}
                                                    placeholder="0.0"
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "lat",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full text-xs font-mono p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                                    Longitude
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    value={currentLng || ""}
                                                    placeholder="0.0"
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "lng",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full text-xs font-mono p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {!isPickingMode ? (
                                            <button
                                                onClick={() =>
                                                    setIsPickingMode(true)
                                                }
                                                className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">
                                                    edit_location
                                                </span>
                                                Pilih di Peta
                                            </button>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => {
                                                        setIsPickingMode(false);
                                                        setTempLocation(null);
                                                    }}
                                                    className="py-2 px-3 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        close
                                                    </span>
                                                    Batal
                                                </button>
                                                <button
                                                    onClick={handleSaveLocation}
                                                    disabled={!tempLocation}
                                                    className="py-2 px-3 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        save
                                                    </span>
                                                    Simpan
                                                </button>
                                            </div>
                                        )}

                                        {isPickingMode && (
                                            <div className="text-[10px] text-center text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded border border-dashed border-slate-200 dark:border-slate-700">
                                                Klik pada peta untuk menandai
                                                lokasi baru.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. PETA SCENE (New) */}
                    {activeTab === "scene_map" && (
                        <div className="absolute inset-0 bg-slate-100 dark:bg-black">
                            <SceneMapTab
                                area={area}
                                allScenes={allChildScenes}
                                onUpdateScene={onUpdate}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Level 2 (Sub-Area Grid View) - As requested, keeping this simple (User manual edits)
    return (
        <div className="flex-1 relative flex flex-col theme-view-canvas overflow-hidden group/canvas font-display">
            {/* Background - Clean, no grid */}
            <div className="absolute inset-0 theme-view-canvas">
                {/* Subtle watermark icon only */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] dark:opacity-[0.02] pointer-events-none overflow-hidden">
                    <span className="material-symbols-outlined text-[600px] theme-text-subtle">
                        layers
                    </span>
                </div>
            </div>

            {/* Content Content - Scrollable */}
            <div className="z-10 flex flex-col items-center justify-start w-full h-full overflow-y-auto custom-scrollbar p-10">
                {/* Header */}
                <div className="w-full max-w-5xl mb-8 flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-action-primary/20 text-action-primary uppercase tracking-wider">
                                Zona
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold theme-text mb-2">
                            {area.name}
                        </h2>
                        <p className="theme-text-secondary text-lg">
                            Kelola Ruangan di Zona ini.
                        </p>
                    </div>
                    <button
                        onClick={() => onCreateChild && onCreateChild(area.id)}
                        className="flex items-center gap-2 px-5 py-2.5 theme-btn-primary"
                    >
                        <span className="material-symbols-outlined">add</span>
                        <span>Tambah Ruangan</span>
                    </button>
                </div>

                {/* Info Alert */}
                <div className="w-full max-w-5xl mb-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500 mt-0.5">
                        info
                    </span>
                    <div>
                        <p className="text-sm theme-text-secondary">
                            Area ini adalah wadah untuk Ruangan, bukan scene.
                            Anda dapat membuat dan mengatur Ruangan untuk
                            membangun hierarki lokasi Anda.
                        </p>
                    </div>
                </div>

                {/* Grid */}
                <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {area.children &&
                        area.children.map((child) => (
                            <div
                                key={child.id}
                                className="theme-card p-5 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="size-10 rounded-lg bg-teal-100 dark:bg-slate-800 flex items-center justify-center text-teal-500 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">
                                            meeting_room
                                        </span>
                                    </div>
                                    <span className="material-symbols-outlined theme-text-subtle hover:text-primary transition-colors">
                                        more_vert
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold theme-text mb-1 group-hover:text-action-primary transition-colors">
                                    {child.name}
                                </h3>
                                <p className="text-sm theme-text-muted">
                                    Area Turunan • Level {(area.level || 2) + 1}
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-xs font-medium theme-text-subtle theme-icon-bg p-2 rounded">
                                    <span className="material-symbols-outlined text-[14px]">
                                        photo_camera
                                    </span>
                                    <span>{child.scenes_count || 0} Scene</span>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

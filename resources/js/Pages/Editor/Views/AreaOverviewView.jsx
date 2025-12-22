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
    const mapCenterLat = -0.9504728826755381;
    const mapCenterLng = 100.46354473026528;

    // Current Area Location (Check if set)
    // We treat 0,0 or null as "Not Set"
    const hasLocation =
        area.lat &&
        area.lng &&
        (parseFloat(area.lat) !== 0 || parseFloat(area.lng) !== 0);
    const currentLat = hasLocation ? parseFloat(area.lat) : null;
    const currentLng = hasLocation ? parseFloat(area.lng) : null;

    const [isPickingMode, setIsPickingMode] = useState(false);
    const [tempLocation, setTempLocation] = useState(null); // Temp state for picked location

    // Map Event Handler - ONLY set temp location, don't save yet
    const handleLocationSelect = (latlng) => {
        setTempLocation(latlng);
    };

    // Save button handler - actually save to database
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
            
            /* Make active marker appear red using CSS filter */
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
                {/* MAP CONTAINER - Full Screen */}
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
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />

                        {/* Labels Overlay */}
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png" />

                        <LocationPicker
                            isActive={isPickingMode}
                            onPick={handleLocationSelect}
                        />

                        {/* Only center map if we have a location AND not picking (to avoid jumping while picking) */}
                        {hasLocation && !isPickingMode && (
                            <MapUpdater center={[currentLat, currentLng]} />
                        )}

                        {/* Temp marker when picking */}
                        {tempLocation && (
                            <Marker
                                position={[tempLocation.lat, tempLocation.lng]}
                                icon={activeIcon}
                                zIndexOffset={2000}
                            >
                                <Tooltip
                                    permanent
                                    direction="right"
                                    offset={[15, -20]}
                                >
                                    Temp Location
                                </Tooltip>
                            </Marker>
                        )}

                        {/* Render All Level 1 Markers */}
                        {allAreas
                            .filter((a) => {
                                // Only show Level 1 areas that have valid coordinates
                                const isLevel1 = a.level === 1 || !a.parent_id;
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
                                            isActive ? activeIcon : normalIcon
                                        }
                                        zIndexOffset={isActive ? 1000 : 0}
                                    >
                                        {/* Permanent tooltip for active marker */}
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
                                                        fontWeight: "bold",
                                                        fontSize: "12px",
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
                </div>

                {/* OVERLAY: Select Location Button (Top Right) - FIXED z-index */}
                <div className="absolute top-6 right-6 z-10">
                    {!isPickingMode ? (
                        <button
                            onClick={() => setIsPickingMode(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold shadow-2xl theme-surface backdrop-blur border theme-border theme-text hover:bg-gray-200 dark:hover:bg-surface-dark transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                edit_location
                            </span>
                            <span>Select Location</span>
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIsPickingMode(false);
                                    setTempLocation(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold shadow-2xl bg-gray-300 dark:bg-slate-700/90 backdrop-blur border border-gray-400 dark:border-slate-600 theme-text dark:hover:bg-slate-700 transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    close
                                </span>
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={handleSaveLocation}
                                disabled={!tempLocation}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold shadow-2xl bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    save
                                </span>
                                <span>Save Location</span>
                            </button>
                        </div>
                    )}
                    {isPickingMode && (
                        <div className="absolute top-full mt-2 right-0 theme-surface backdrop-blur-md theme-text-secondary text-xs px-4 py-2 rounded-lg max-w-[200px] text-right border border-primary/30 shadow-xl">
                            Click on map to {hasLocation ? "move" : "place"}{" "}
                            marker
                        </div>
                    )}
                </div>

                {/* OVERLAY: Current Location Card (Bottom Left) - FIXED z-index */}
                <div className="absolute bottom-8 left-8 z-10 w-80">
                    <div className="theme-surface backdrop-blur border theme-border rounded-xl overflow-hidden shadow-2xl">
                        <div className="px-4 py-3 bg-gray-200 dark:bg-slate-800/80 border-b theme-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        isPickingMode
                                            ? "bg-primary animate-pulse"
                                            : hasLocation
                                            ? "bg-primary"
                                            : "bg-gray-400 dark:bg-slate-500"
                                    }`}
                                ></span>
                                <span className="text-xs font-bold theme-text-secondary uppercase tracking-wide">
                                    {hasLocation
                                        ? "Current Location"
                                        : "No Location Set"}
                                </span>
                            </div>
                            <span className="material-symbols-outlined theme-text-muted text-[16px]">
                                my_location
                            </span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold theme-text-muted mb-1 block">
                                    Latitude
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={currentLat || ""}
                                    placeholder="-"
                                    onChange={(e) =>
                                        handleInputChange("lat", e.target.value)
                                    }
                                    className="w-full theme-input border theme-border rounded px-2 py-1.5 text-sm theme-text font-mono focus:border-primary focus:ring-0 placeholder-gray-400 dark:placeholder-gray-600"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold theme-text-muted mb-1 block">
                                    Longitude
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={currentLng || ""}
                                    placeholder="-"
                                    onChange={(e) =>
                                        handleInputChange("lng", e.target.value)
                                    }
                                    className="w-full theme-input border theme-border rounded px-2 py-1.5 text-sm theme-text font-mono focus:border-primary focus:ring-0 placeholder-gray-400 dark:placeholder-gray-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Level 2 (Sub-Area Grid View) - and Fallback
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
                <div className="w-full max-w-5xl mb-8 flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl font-bold theme-text mb-2">
                            {area.name}
                        </h2>
                        <p className="theme-text-secondary text-lg">
                            Sub-Area Overview
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
                                    <div className="size-10 rounded-lg bg-amber-100 dark:bg-slate-800 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">
                                            meeting_room
                                        </span>
                                    </div>
                                    <span className="material-symbols-outlined theme-text-subtle hover:text-primary transition-colors">
                                        more_vert
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold theme-text mb-1 group-hover:text-primary transition-colors">
                                    {child.name}
                                </h3>
                                <p className="text-sm theme-text-muted">
                                    Child Area • Level 3
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-xs font-medium theme-text-subtle theme-icon-bg p-2 rounded">
                                    <span className="material-symbols-outlined text-[14px]">
                                        photo_camera
                                    </span>
                                    <span>
                                        {child.scenes_count || 0} Scenes
                                    </span>
                                </div>
                            </div>
                        ))}

                    <button
                        onClick={() => onCreateChild && onCreateChild(area.id)}
                        className="theme-dashed-card p-5 flex flex-col items-center justify-center gap-3 group h-full min-h-[160px]"
                    >
                        <div className="size-12 rounded-full theme-icon-bg theme-icon-bg-hover flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[24px]">
                                add
                            </span>
                        </div>
                        <span className="text-sm font-bold theme-text-muted group-hover:text-primary transition-colors">
                            Create Child Area
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

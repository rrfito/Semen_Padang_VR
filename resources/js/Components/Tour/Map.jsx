import React, { useEffect } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Tooltip,
    useMap,
    useMapEvents,
    Polyline,
    CircleMarker,
    LayersControl,
} from "react-leaflet";
import MapLayerControl from "./MapLayerControl";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Icon Leaflet di React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
let RedIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    className: "marker-red",
});

L.Marker.prototype.options.icon = DefaultIcon;

// Komponen Helper untuk FlyTo (Animasi Pindah)
function MapUpdater({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            // Use provided zoom if available, otherwise default to current or 18
            const targetZoom = zoom || 18;
            map.flyTo(center, targetZoom, { duration: 1.5 });
        }
    }, [center, zoom]);
    return null;
}

// Helper untuk track zoom level
function ZoomHandler({ setZoom }) {
    const map = useMapEvents({
        zoomend: () => {
            setZoom(map.getZoom());
        },
    });
    return null;
}

export default function Map({
    markers,
    center,
    zoom,
    markerColorOverride,
    onMarkerClick,
    selectedArea,
    showPolyline,
    isSidebarOpen,
}) {
    const [currentLayer, setCurrentLayer] = React.useState("satellite");
    const [isMobile, setIsMobile] = React.useState(false);
    const [zoomLevel, setZoomLevel] = React.useState(15); // Default zoom

    // Detect Mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={center}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
            >
                <ZoomHandler setZoom={setZoomLevel} />

                {/* Mobile: Standard Leaflet Layer Control */}
                {isMobile ? (
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer
                            checked={currentLayer === "satellite"}
                            name="Satelit"
                        >
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                                maxZoom={19}
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer
                            checked={currentLayer === "clean"}
                            name="Peta Bersih"
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>
                ) : (
                    // Desktop: Logic managed by custom state 'currentLayer'
                    <>
                        {currentLayer === "satellite" ? (
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                                maxZoom={19}
                            />
                        ) : (
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                        )}
                    </>
                )}

                <MapUpdater center={center} zoom={zoom} />

                {/* 1. Render Path Nodes & Polyline jika aktif */}
                {showPolyline &&
                    selectedArea &&
                    (() => {
                        console.log(
                            "[POLYLINE DEBUG] showPolyline:",
                            showPolyline
                        );
                        console.log(
                            "[POLYLINE DEBUG] selectedArea:",
                            selectedArea
                        );

                        // Get polyline-ready scenes from either container or leaf area
                        let polylineScenes = [];

                        // Container area: use all_child_scenes
                        if (
                            selectedArea.all_child_scenes &&
                            selectedArea.all_child_scenes.length > 0
                        ) {
                            polylineScenes = selectedArea.all_child_scenes;
                            console.log(
                                "[POLYLINE DEBUG] Using all_child_scenes:",
                                polylineScenes
                            );
                        }
                        // Leaf area: use scenes with GPS coordinates
                        else if (
                            selectedArea.scenes &&
                            selectedArea.scenes.length > 0
                        ) {
                            console.log(
                                "[POLYLINE DEBUG] Leaf area scenes:",
                                selectedArea.scenes
                            );
                            polylineScenes = selectedArea.scenes
                                .filter(
                                    (s) =>
                                        s.lat &&
                                        s.lng &&
                                        (s.lat !== 0 || s.lng !== 0)
                                )
                                .map((s) => ({
                                    id: s.id,
                                    name: s.name,
                                    lat: parseFloat(s.lat),
                                    lng: parseFloat(s.lng),
                                }));
                            console.log(
                                "[POLYLINE DEBUG] Filtered polylineScenes:",
                                polylineScenes
                            );
                        }

                        console.log(
                            "[POLYLINE DEBUG] Final polylineScenes count:",
                            polylineScenes.length
                        );

                        // Only render if we have at least 2 points for a line
                        if (polylineScenes.length < 2) {
                            console.log(
                                "[POLYLINE DEBUG] Not enough scenes for polyline (need >= 2)"
                            );
                            return null;
                        }

                        console.log(
                            "[POLYLINE DEBUG] Rendering polyline with",
                            polylineScenes.length,
                            "scenes"
                        );

                        return (
                            <>
                                {/* Garis Penghubung */}
                                <Polyline
                                    positions={polylineScenes.map((p) => [
                                        p.lat,
                                        p.lng,
                                    ])}
                                    pathOptions={{
                                        color: "#3b82f6",
                                        weight: 4,
                                        opacity: 0.6,
                                        dashArray: "10, 10",
                                    }}
                                />

                                {/* Titik-titik Node */}
                                {polylineScenes.map((node) => (
                                    <CircleMarker
                                        key={`node-${node.id}`}
                                        center={[node.lat, node.lng]}
                                        radius={6}
                                        pathOptions={{
                                            color: "#fff",
                                            fillColor: "#3b82f6",
                                            fillOpacity: 1,
                                            weight: 2,
                                        }}
                                    >
                                        <Popup closeButton={false}>
                                            <div className="text-center p-1">
                                                <div className="font-bold text-xs mb-1">
                                                    {node.name}
                                                </div>
                                                <a
                                                    href={route(
                                                        "tour.show",
                                                        node.id
                                                    )}
                                                    className="inline-block bg-blue-600 !text-white text-[10px] px-2 py-1 rounded hover:bg-blue-700 transition"
                                                >
                                                    Lihat
                                                </a>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </>
                        );
                    })()}

                {/* 2. Render Markers (Areas) */}
                {markers.map((marker) => {
                    // LOGIC: Sembunyikan marker utama jika ini adalah area yang dipilih DAN showPolyline aktif
                    const isHidden =
                        showPolyline &&
                        selectedArea &&
                        selectedArea.id === marker.id;
                    if (isHidden) return null;

                    // Determine Icon
                    let iconToUse = DefaultIcon;

                    // Note: 'marker.color' comes from database/props (e.g. permanent color)
                    // 'markerColorOverride' comes from transient user selection (Grandparent vs Parent)

                    if (
                        selectedArea &&
                        selectedArea.id === marker.id &&
                        markerColorOverride
                    ) {
                        // If this is the selected area, respect the override (Red for GP, Blue for Parent)
                        if (markerColorOverride === "red") {
                            iconToUse = RedIcon;
                        } else {
                            iconToUse = DefaultIcon; // Blue/Default
                        }
                    } else if (marker.color === "red") {
                        // Fallback to database color if defined
                        iconToUse = RedIcon;
                    }

                    return (
                        <Marker
                            key={marker.id}
                            position={[marker.lat, marker.lng]}
                            icon={iconToUse}
                            eventHandlers={{
                                click: () => onMarkerClick(marker),
                            }}
                        >
                            {/* Tampilkan label HANYA jika zoom level cukup dekat (>= 16) agar tidak berantakan */}
                            {zoomLevel >= 16 && (
                                <Tooltip
                                    permanent
                                    direction="right"
                                    offset={[10, 0]}
                                    className="map-label-transparent"
                                >
                                    {marker.name}
                                </Tooltip>
                            )}
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Control Desktop Only */}
            {!isMobile && (
                <MapLayerControl
                    currentLayer={currentLayer}
                    onChangeLayer={setCurrentLayer}
                    isSidebarOpen={isSidebarOpen}
                />
            )}
        </div>
    );
}

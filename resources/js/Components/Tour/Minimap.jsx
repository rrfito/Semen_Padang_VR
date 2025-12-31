import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMap,
    LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaMap } from "react-icons/fa";
import { renderToStaticMarkup } from "react-dom/server";
import { FaPersonWalking } from "react-icons/fa6";
import { MAP_CONFIG } from "@/Config/MapConfig";

const { STYLES, TILES } = MAP_CONFIG;

// Create custom icon using react-icons
const createIcon = () => {
    const iconMarkup = renderToStaticMarkup(
        <div
            style={{
                color: "#ff5722",
                fontSize: "24px",
                filter: "drop-shadow(0 0 2px white)",
            }}
        >
            <FaPersonWalking />
        </div>
    );

    return L.divIcon({
        html: iconMarkup,
        className: "custom-marker-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 24],
    });
};

const ManIcon = createIcon();

// Helper to update map center
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center)
            map.flyTo(center, 18, { duration: STYLES.ANIMATION_DURATION });
    }, [center]);
    return null;
}

export default function Minimap({ lat, lng }) {
    const [isOpen, setIsOpen] = useState(true);
    const position = [lat, lng];

    // If no valid coordinates, don't render
    if (!lat || !lng) return null;

    return (
        <div
            className={`absolute bottom-4 right-4 z-[1000] transition-all duration-300 ease-in-out ${
                isOpen ? "w-64 h-64" : "w-12 h-12"
            }`}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-0 right-0 z-[1001] bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100 transition"
                title={isOpen ? "Minimize Map" : "Show Map"}
            >
                <FaMap className="text-gray-700" />
            </button>

            {/* Map Container */}
            <div
                className={`w-full h-full rounded-xl overflow-hidden shadow-2xl border-4 border-white transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
                <MapContainer
                    center={position}
                    zoom={18}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <LayersControl position="topleft">
                        <LayersControl.BaseLayer name="Peta Bersih">
                            <TileLayer
                                url={TILES.CLEAN.URL}
                                attribution={TILES.CLEAN.ATTRIBUTION}
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer checked name="Satelit">
                            <TileLayer
                                url={TILES.SATELLITE.URL}
                                attribution={TILES.SATELLITE.ATTRIBUTION}
                                maxZoom={19}
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>
                    <MapUpdater center={position} />
                    <Marker position={position} icon={ManIcon} />
                </MapContainer>
            </div>
        </div>
    );
}

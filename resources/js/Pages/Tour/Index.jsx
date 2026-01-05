import React, { useState } from "react";
import { Head } from "@inertiajs/react";
import Sidebar from "@/Components/Tour/Sidebar";
import SecondarySidebar from "@/Components/Tour/SecondarySidebar";
import Map from "@/Components/Tour/Map";
import { FaBars } from "react-icons/fa";
import { MAP_CONFIG } from "@/Config/MapConfig";

export default function Index({ menuData, markers, user }) {
    // Default Center: Pabrik Indarung
    const [mapCenter, setMapCenter] = useState(MAP_CONFIG.DEFAULT_CENTER);
    const [selectedArea, setSelectedArea] = useState(null);
    const [showPolyline, setShowPolyline] = useState(false);

    // UI State for Map
    const [mapZoom, setMapZoom] = useState(MAP_CONFIG.MIN_ZOOM);
    const [markerColor, setMarkerColor] = useState(null); // 'red' | 'blue' | null (default)

    // Sidebar State
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

    // Saat user klik lokasi di sidebar utama, peta terbang ke sana
    // Type: 'grandparent' | 'parent' | 'child' | undefined
    const handleSelectLocation = (item, type) => {
        // Fallback for direct map clicks or legacy calls
        const targetType = type || "child";

        // console.log("[SIDEBAR CLICK] item:", item);
        // console.log("[SIDEBAR CLICK] Looking for marker with id:", item.id);
        // console.log("[SIDEBAR CLICK] markers array:", markers);

        const target = markers.find((m) => m.id === item.id);

        // console.log("[SIDEBAR CLICK] Found target:", target);

        if (target) {
            // Area has coordinates - fly to it on map
            setMapCenter([target.lat, target.lng]);
            setSelectedArea(target);
            setShowPolyline(false); // Reset polyline saat ganti area
            setIsMobileSidebarOpen(false); // Tutup sidebar di mobile setelah pilih

            // Sequential Logic
            if (targetType === "grandparent") {
                setMapZoom(MAP_CONFIG.MAX_ZOOM);
                setMarkerColor("red");
            }
        } else {
            // Area doesn't have coordinates (e.g. container areas)
            // Still show SecondarySidebar, but don't fly map
            // console.log("[SIDEBAR CLICK] No marker found, using menuData item");
            setSelectedArea(item); // Use original item
            setShowPolyline(false);
            setIsMobileSidebarOpen(false);
            // console.log("Area selected (no map coordinates):", item.name);
        }
    };

    const handleMarkerClick = (marker) => {
        setSelectedArea(marker);
        setShowPolyline(false);
        setMapCenter([marker.lat, marker.lng]);
        setMarkerColor("blue"); // Clicking marker directly usually implies drilling down effectively
    };

    const handleCloseSecondary = () => {
        setSelectedArea(null);
        setShowPolyline(false);
        setMarkerColor(null); // Reset color
    };

    return (
        <div className="h-screen w-screen flex bg-gray-100 overflow-hidden relative font-sans">
            <Head title="Peta Lokasi" />

            {/* Mobile Toggle Button (Only visible on mobile) */}
            <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="absolute top-4 left-4 z-[1100] p-3 bg-white text-gray-800 rounded-full shadow-lg md:hidden hover:bg-gray-50 transition-colors"
            >
                <FaBars size={20} />
            </button>

            {/* Sidebar Container */}
            {/* Mobile: Fixed overlay. Desktop: Relative/Static but collapsible */}
            {/* Sidebar Container - FIXED OVERLAY FOR ALL DEVICES */}
            <div
                className={`
                fixed inset-y-0 left-0 z-[1000] transform transition-transform duration-300 ease-in-out
                ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                ${
                    isDesktopSidebarOpen
                        ? "md:translate-x-0"
                        : "md:-translate-x-full"
                }
                w-80 h-full
            `}
            >
                {/* Shadow Wrapper: Only visible when sidebar is open */}
                <div
                    className={`w-full h-full bg-transparent ${
                        isDesktopSidebarOpen || isMobileSidebarOpen
                            ? "shadow-2xl"
                            : ""
                    }`}
                >
                    <Sidebar
                        menuData={menuData}
                        onSelectLocation={handleSelectLocation}
                        user={user}
                        isOpen={isDesktopSidebarOpen}
                        onToggle={() =>
                            setIsDesktopSidebarOpen(!isDesktopSidebarOpen)
                        }
                    />
                </div>
            </div>

            {/* Overlay untuk menutup sidebar di mobile (sama seperti sebelumnya) */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[900] md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Secondary Sidebar (Right Overlay) */}
            <SecondarySidebar
                selectedArea={selectedArea}
                onClose={handleCloseSecondary}
                showPolyline={showPolyline}
                onTogglePolyline={() => setShowPolyline(!showPolyline)}
            />

            {/* Main Content: Map Always Full Screen */}
            <main className="absolute inset-0 w-full h-full z-0">
                <Map
                    markers={markers}
                    center={mapCenter}
                    zoom={mapZoom}
                    markerColorOverride={markerColor}
                    onMarkerClick={handleMarkerClick}
                    selectedArea={selectedArea}
                    showPolyline={showPolyline}
                    isSidebarOpen={isDesktopSidebarOpen} // Pass state ke Map
                />
            </main>
        </div>
    );
}

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_CONFIG } from "@/Config/MapConfig";

const { STYLES, TILES, MIN_ZOOM, MAX_ZOOM, MAX_BOUNDS, DEFAULT_CENTER } =
    MAP_CONFIG;

export default function MapPickerModal({
    isOpen,
    onClose,
    initialLat,
    initialLng,
    onConfirm,
}) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    // Use passed props, or fallback to Config Default
    const [selectedCoords, setSelectedCoords] = useState({
        lat: parseFloat(initialLat) || DEFAULT_CENTER[0],
        lng: parseFloat(initialLng) || DEFAULT_CENTER[1],
    });

    useEffect(() => {
        if (!isOpen) return;

        // Wait for portal to mount and ref to be available
        const timer = setTimeout(() => {
            if (!mapRef.current || mapInstanceRef.current) return;

            // Initialize map
            const map = L.map(mapRef.current, {
                minZoom: MIN_ZOOM,
                maxZoom: MAX_ZOOM,
                maxBounds: MAX_BOUNDS,
                maxBoundsViscosity: 1.0,
                attributionControl: false, // Hide Leaflet footer
                zoomControl: false, // Hide Zoom buttons
            }).setView([selectedCoords.lat, selectedCoords.lng], 18);

            L.tileLayer(TILES.SATELLITE.URL, {
                maxZoom: MAX_ZOOM,
            }).addTo(map);

            // Custom marker icon
            const markerIcon = L.divIcon({
                className: "custom-marker",
                html: `
                    <div style="width: 40px; height: 40px; position: relative;">
                        <div style="
                            width: 20px; 
                            height: 20px; 
                            background: #3b82f6; 
                            border: 3px solid white; 
                            border-radius: 50%; 
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                        "></div>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            });

            // Add draggable marker
            const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
                icon: markerIcon,
                draggable: true,
            }).addTo(map);

            // Update coordinates when marker is dragged
            marker.on("dragend", function (e) {
                const pos = e.target.getLatLng();
                setSelectedCoords({
                    lat: parseFloat(pos.lat),
                    lng: parseFloat(pos.lng),
                });
            });

            // Click to place marker
            map.on("click", function (e) {
                marker.setLatLng(e.latlng);
                setSelectedCoords({
                    lat: parseFloat(e.latlng.lat),
                    lng: parseFloat(e.latlng.lng),
                });
            });

            mapInstanceRef.current = map;
            markerRef.current = marker;
        }, 100); // Small delay to ensure DOM is ready inside Portal

        return () => clearTimeout(timer);
    }, [isOpen]); // Only run on open

    // Cleanup effect separate from initialization
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isOpen]);

    // Update marker when initial coords change
    useEffect(() => {
        if (mapInstanceRef.current && markerRef.current) {
            const lat = parseFloat(initialLat) || DEFAULT_CENTER[0];
            const lng = parseFloat(initialLng) || DEFAULT_CENTER[1];
            markerRef.current.setLatLng([lat, lng]);
            mapInstanceRef.current.setView(
                [lat, lng],
                mapInstanceRef.current.getZoom()
            );
            setSelectedCoords({ lat, lng });
        }
    }, [initialLat, initialLng, isOpen]);

    const handleConfirm = () => {
        onConfirm(selectedCoords);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <>
            {/* Backdrop in Portal - ensure high z-index at body level */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10049] transition-opacity"
                onClick={onClose}
            />

            {/* Modal in Portal */}
            <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
                <div
                    className="theme-modal w-full max-w-3xl pointer-events-auto overflow-hidden my-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="theme-modal-header">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-[24px]">
                                        explore
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold theme-text">
                                        Pilih Lokasi di Peta
                                    </h2>
                                    <p className="text-xs theme-text-muted mt-0.5">
                                        Klik atau seret penanda untuk mengatur
                                        koordinat
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 theme-text-secondary transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    close
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div className="relative">
                        <div ref={mapRef} className="w-full h-[500px]" />

                        {/* Coordinate Display Overlay */}
                        <div className="absolute top-4 left-4 z-[1000] bg-white/90 dark:bg-black/80 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 shadow-xl">
                            <div className="text-xs font-bold theme-text-secondary uppercase tracking-wider mb-1.5">
                                Koordinat Terpilih
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-mono">
                                    <span className="theme-text-muted">
                                        Lat:
                                    </span>
                                    <span className="theme-text font-bold">
                                        {selectedCoords.lat.toFixed(6)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-mono">
                                    <span className="theme-text-muted">
                                        Lng:
                                    </span>
                                    <span className="theme-text font-bold">
                                        {selectedCoords.lng.toFixed(6)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Instructions Overlay */}
                        <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 dark:bg-black/80 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 shadow-xl">
                            <div className="flex items-center gap-2 text-xs theme-text-muted">
                                <span className="material-symbols-outlined text-[16px] text-primary">
                                    info
                                </span>
                                <span>
                                    Klik di mana saja pada peta atau seret
                                    penanda
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="theme-modal-footer flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="theme-btn-danger px-6"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="theme-btn-primary flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                check
                            </span>
                            Konfirmasi Lokasi
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapPickerModal({ isOpen, onClose, initialLat = -0.9492, initialLng = 100.3705, onConfirm }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [selectedCoords, setSelectedCoords] = useState({ 
        lat: parseFloat(initialLat) || -0.9492, 
        lng: parseFloat(initialLng) || 100.3705 
    });

    useEffect(() => {
        if (!isOpen || !mapRef.current || mapInstanceRef.current) return;

        // Initialize map
        const map = L.map(mapRef.current).setView([selectedCoords.lat, selectedCoords.lng], 18);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        // Custom marker icon
        const markerIcon = L.divIcon({
            className: 'custom-marker',
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
            iconAnchor: [20, 20]
        });

        // Add draggable marker
        const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
            icon: markerIcon,
            draggable: true
        }).addTo(map);

        // Update coordinates when marker is dragged
        marker.on('dragend', function(e) {
            const pos = e.target.getLatLng();
            setSelectedCoords({ lat: parseFloat(pos.lat), lng: parseFloat(pos.lng) });
        });

        // Click to place marker
        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            setSelectedCoords({ lat: parseFloat(e.latlng.lat), lng: parseFloat(e.latlng.lng) });
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        // Cleanup
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
            const lat = parseFloat(initialLat) || -0.9492;
            const lng = parseFloat(initialLng) || 100.3705;
            markerRef.current.setLatLng([lat, lng]);
            mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
            setSelectedCoords({ lat, lng });
        }
    }, [initialLat, initialLng, isOpen]);

    const handleConfirm = () => {
        onConfirm(selectedCoords);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
                <div 
                    className="bg-surface-dark border border-border-dark rounded-2xl shadow-2xl w-full max-w-3xl pointer-events-auto overflow-hidden my-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border-dark bg-[#15202b]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-[24px]">explore</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Select Location on Map</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Click or drag the marker to set coordinates</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div className="relative">
                        <div ref={mapRef} className="w-full h-[500px]" />
                        
                        {/* Coordinate Display Overlay */}
                        <div className="absolute top-4 left-4 z-[1000] bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 shadow-xl">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Selected Coordinates
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-mono">
                                    <span className="text-slate-500">Lat:</span>
                                    <span className="text-white font-bold">{selectedCoords.lat.toFixed(6)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-mono">
                                    <span className="text-slate-500">Lng:</span>
                                    <span className="text-white font-bold">{selectedCoords.lng.toFixed(6)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Instructions Overlay */}
                        <div className="absolute bottom-4 right-4 z-[1000] bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 shadow-xl">
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                                <span>Click anywhere on the map or drag the marker</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-border-dark bg-[#111a22] flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 h-10 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-6 h-10 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

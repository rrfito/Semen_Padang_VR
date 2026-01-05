import React, { useState } from "react";

export default function MapLayerControl({
    currentLayer,
    onChangeLayer,
    isSidebarOpen,
}) {
    const isSatellite = currentLayer === "satellite";

    return (
        <div
            id="map-layer-control"
            className={`absolute bottom-6 z-[400] flex gap-3 font-sans transition-all duration-300 ease-in-out`}
            style={{ left: isSidebarOpen ? "370px" : "24px" }}
        >
            {/* Opsi Peta Bersih (Default/Street) */}
            <button
                onClick={() => onChangeLayer("clean")}
                className={`
                    relative group w-20 h-20 rounded-xl overflow-hidden shadow-lg border-2 transition-all duration-300
                    ${
                        !isSatellite
                            ? "border-blue-600 ring-2 ring-blue-400 scale-105"
                            : "border-white opacity-80 hover:opacity-100 hover:scale-105"
                    }
                `}
            >
                {/* Thumbnail Simulation: Light Map */}
                <div className="absolute inset-0 bg-gray-100">
                    <div className="absolute top-2 left-2 right-4 h-2 bg-gray-300 rounded"></div>
                    <div className="absolute top-6 left-2 right-8 h-2 bg-gray-300 rounded"></div>
                    <div className="absolute top-10 left-6 right-2 h-2 bg-amber-200 rounded"></div>
                    <div className="absolute bottom-4 left-4 right-4 h-8 bg-blue-100 rounded-full opacity-50"></div>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                    <span
                        className={`text-[10px] font-bold text-white uppercase tracking-wider ${
                            !isSatellite ? "text-blue-200" : ""
                        }`}
                    >
                        Peta
                    </span>
                </div>
            </button>

            {/* Opsi Satelit */}
            <button
                onClick={() => onChangeLayer("satellite")}
                className={`
                    relative group w-20 h-20 rounded-xl overflow-hidden shadow-lg border-2 transition-all duration-300
                    ${
                        isSatellite
                            ? "border-blue-600 ring-2 ring-blue-400 scale-105"
                            : "border-white opacity-80 hover:opacity-100 hover:scale-105"
                    }
                `}
            >
                {/* Thumbnail Simulation: Satellite */}
                <div className="absolute inset-0 bg-emerald-900">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-800 rounded-full -mr-4 -mt-4 opacity-70"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 bg-gray-700/50 rounded-full blur-sm"></div>
                    <div className="absolute inset-0 bg-[url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/12')] bg-cover opacity-60 mix-blend-overlay"></div>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                    <span
                        className={`text-[10px] font-bold text-white uppercase tracking-wider ${
                            isSatellite ? "text-blue-200" : ""
                        }`}
                    >
                        Satelit
                    </span>
                </div>
            </button>
        </div>
    );
}

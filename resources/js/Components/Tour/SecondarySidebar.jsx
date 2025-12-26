import React from "react";
import { Link } from "@inertiajs/react";
import {
    FaTimes,
    FaMapMarkedAlt,
    FaVrCardboard,
    FaCamera,
} from "react-icons/fa";

export default function SecondarySidebar({
    selectedArea,
    onClose,
    onTogglePolyline,
    showPolyline,
}) {
    if (!selectedArea) return null;

    // Determine area type based on level and is_container
    // Container View: Level 1 OR (Level 2 with is_container: true)
    // Leaf View: Level 3 OR (Level 2 with is_container: false)
    const isContainer =
        selectedArea.level === 1 ||
        (selectedArea.level === 2 && selectedArea.is_container === true);
    const isLeaf = !isContainer; // Opposite of container

    // Get appropriate label
    const getLabel = () => {
        if (selectedArea.level === 1) return "AREA UTAMA";
        if (selectedArea.level === 2 && isContainer) return "SUB AREA";
        return `${selectedArea.name.toUpperCase()} AREA`;
    };

    // Get scenes for display (only for leaf areas)
    const scenes = isLeaf ? selectedArea.scenes || [] : [];
    const sceneCount = scenes.length;

    // Helper: Truncate text by word count
    const truncateWords = (text, maxWords = 50) => {
        if (!text) return "";
        const words = text.trim().split(/\s+/);
        if (words.length <= maxWords) return text;
        return words.slice(0, maxWords).join(" ") + "...";
    };

    const description =
        selectedArea.description || "Tidak ada deskripsi untuk area ini.";
    const truncatedDescription = truncateWords(description, 60);

    return (
        <div
            className="
            fixed bottom-0 left-0 right-0 z-[1000] 
            md:absolute md:top-4 md:right-4 md:bottom-auto md:left-auto md:w-80 
            bg-white rounded-t-xl md:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up md:animate-fade-in-right border border-gray-100 font-sans
            max-h-[70vh] md:max-h-[100vh]
        "
        >
            {/* Header - Clean without image */}
            <div className="relative p-5 pb-3 border-b border-gray-100 shrink-0">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-[#D32F2F] transition-colors p-1"
                >
                    <FaTimes size={16} />
                </button>

                {/* Label Badge */}
                <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 text-[#D32F2F] text-[10px] font-bold uppercase tracking-wider mb-3">
                    {getLabel()}
                </div>

                {/* Title */}
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight pr-8">
                    {selectedArea.name}
                </h2>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 overflow-y-auto bg-white">
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {truncatedDescription}
                </p>

                {/* CONTAINER AREAS: Show path toggle button */}
                {isContainer && (
                    <div className="space-y-3">
                        <button
                            onClick={onTogglePolyline}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 ${
                                showPolyline
                                    ? "bg-red-50 border-red-200 text-[#D32F2F]"
                                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                        >
                            <div className="flex items-center gap-2 font-medium">
                                <FaMapMarkedAlt
                                    size={16}
                                    className={
                                        showPolyline
                                            ? "text-[#D32F2F]"
                                            : "text-gray-400"
                                    }
                                />
                                <span>Lihat Jalur Area</span>
                            </div>
                            <div
                                className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${
                                    showPolyline
                                        ? "bg-[#D32F2F]"
                                        : "bg-gray-300"
                                }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                                        showPolyline ? "translate-x-5" : ""
                                    }`}
                                />
                            </div>
                        </button>

                        {/* Info text */}
                        <p className="text-xs text-gray-500 text-center">
                            Area ini memiliki{" "}
                            {selectedArea.all_child_scenes?.length || 0} scene
                            di dalam sub-area
                        </p>
                    </div>
                )}

                {/* LEAF AREAS: Show scenes list and virtual tour button */}
                {isLeaf && (
                    <div className="space-y-4">
                        {/* Scenes Available Section */}
                        {sceneCount > 0 && (
                            <>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                                        Choose a scene to start
                                    </h3>
                                    <span className="text-xs font-semibold text-[#D32F2F] bg-red-50 px-2 py-0.5 rounded">
                                        {sceneCount} Scenes
                                    </span>
                                </div>

                                {/* Scene List - Max 3 visible with scroll */}
                                <div className="space-y-2 mb-4 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                                    {scenes.map((scene, index) => (
                                        <Link
                                            key={scene.id}
                                            href={route("tour.show", scene.id)}
                                            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-red-50 rounded-lg transition-all duration-200 group border border-transparent hover:border-red-200"
                                        >
                                            {/* Scene Thumbnail */}
                                            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow bg-gray-100">
                                                {scene.image_path ? (
                                                    <img
                                                        src={
                                                            scene.image_path &&
                                                            scene.image_path.startsWith(
                                                                "http"
                                                            )
                                                                ? scene.image_path
                                                                : `/storage/${scene.image_path}`
                                                        }
                                                        alt={scene.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display =
                                                                "none";
                                                            e.target.nextElementSibling.style.display =
                                                                "flex";
                                                        }}
                                                    />
                                                ) : null}
                                                {/* Fallback icon if no image or load error */}
                                                <div
                                                    className="w-full h-full flex items-center justify-center bg-white"
                                                    style={{
                                                        display:
                                                            scene.image_path
                                                                ? "none"
                                                                : "flex",
                                                    }}
                                                >
                                                    <FaCamera
                                                        className="text-gray-400 group-hover:text-[#D32F2F] transition-colors"
                                                        size={16}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm text-gray-800 group-hover:text-[#D32F2F] transition-colors truncate">
                                                    {scene.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    Scene {index + 1}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 text-gray-400 group-hover:text-[#D32F2F] transition-transform group-hover:translate-x-1">
                                                →
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Toggle Polyline for leaf areas with scenes */}
                        {sceneCount > 0 && (
                            <button
                                onClick={onTogglePolyline}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 ${
                                    showPolyline
                                        ? "bg-red-50 border-red-200 text-[#D32F2F]"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-center gap-2 font-medium">
                                    <FaMapMarkedAlt
                                        size={16}
                                        className={
                                            showPolyline
                                                ? "text-[#D32F2F]"
                                                : "text-gray-400"
                                        }
                                    />
                                    <span>Lihat Jalur Area</span>
                                </div>
                                <div
                                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${
                                        showPolyline
                                            ? "bg-[#D32F2F]"
                                            : "bg-gray-300"
                                    }`}
                                >
                                    <div
                                        className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                                            showPolyline ? "translate-x-5" : ""
                                        }`}
                                    />
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

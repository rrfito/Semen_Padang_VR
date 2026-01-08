import React, { useState, useMemo } from "react";
import SceneMapTab from "./Tabs/SceneMapTab";

export default function AreaOverviewView({
    area,
    allAreas = [],
    onUpdate,
    onCreateChild,
    onUploadScene,
    onSelectChild,
    showStatusLabels = true,
}) {
    const isLevel1 = area.level === 1;

    // State for Scene Map Modal
    const [showSceneMapModal, setShowSceneMapModal] = useState(false);

    // Helper to get ALL SCENES (Recursive/Flat) for Scene Map
    const allChildScenes = useMemo(() => {
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

    // ========== LEVEL 1: Child Area Grid ==========
    if (isLevel1) {
        return (
            <div className="flex-1 relative flex flex-col theme-view-canvas overflow-hidden group/canvas font-display">
                {/* Background */}
                <div className="absolute inset-0 theme-view-canvas">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] dark:opacity-[0.02] pointer-events-none overflow-hidden">
                        <span className="material-symbols-outlined text-[600px] theme-text-subtle">
                            domain
                        </span>
                    </div>
                </div>

                {/* Main Content Scrollable */}
                <div className="z-10 flex flex-col items-center justify-start w-full h-full overflow-y-auto custom-scrollbar p-10">
                    {/* Header */}
                    <div className="w-full max-w-6xl mb-8 flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-action-primary/20 text-action-primary uppercase tracking-wider">
                                    Area Utama
                                </span>
                            </div>
                            <h2 className="text-3xl font-bold theme-text mb-2">
                                {area.name}
                            </h2>
                            <p className="theme-text-secondary text-lg">
                                Kelola Area Zona atau Area Ruangan di dalam ini.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Scene Map Button */}
                            <button
                                onClick={() => setShowSceneMapModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 theme-btn-secondary"
                            >
                                <span className="material-symbols-outlined">
                                    map
                                </span>
                                <span>Peta Scene</span>
                            </button>
                            {/* Add Area Button */}
                            <button
                                onClick={() =>
                                    onCreateChild && onCreateChild(area.id)
                                }
                                className="flex items-center gap-2 px-5 py-2.5 theme-btn-primary"
                            >
                                <span className="material-symbols-outlined">
                                    add
                                </span>
                                <span>Tambah Area</span>
                            </button>
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="w-full max-w-6xl mb-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-500 mt-0.5">
                            info
                        </span>
                        <div>
                            <p className="text-sm theme-text-secondary">
                                Area utama ini berisi Sub-Area yaitu Area Zona
                                atau Area Ruangan. Klik kartu untuk memilih dan
                                mengedit Sub-Area tersebut, atau gunakan tombol
                                "Tambah Area" untuk membuat baru.
                            </p>
                        </div>
                    </div>

                    {/* Grid of Child Areas */}
                    {area.children && area.children.length > 0 ? (
                        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {area.children.map((child) => (
                                <div
                                    key={child.id}
                                    onClick={() =>
                                        onSelectChild && onSelectChild(child)
                                    }
                                    className="theme-card p-5 group cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className={`size-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                                                child.is_container
                                                    ? "bg-blue-100 dark:bg-slate-800 text-blue-500"
                                                    : "bg-teal-100 dark:bg-slate-800 text-teal-500"
                                            }`}
                                        >
                                            <span className="material-symbols-outlined">
                                                {child.is_container
                                                    ? "layers"
                                                    : "meeting_room"}
                                            </span>
                                        </div>
                                        {/* Status & Property Badges */}
                                        <div className="flex items-center gap-1.5">
                                            {/* Restricted Icon */}
                                            {child.is_restricted && (
                                                <span
                                                    className="size-6 rounded flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                                    title="Akses Terbatas"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        lock
                                                    </span>
                                                </span>
                                            )}
                                            {/* Hidden Icon */}
                                            {child.is_hidden && (
                                                <span
                                                    className="size-6 rounded flex items-center justify-center bg-purple-500/10 text-purple-500 border border-purple-500/20"
                                                    title="Disembunyikan"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        visibility_off
                                                    </span>
                                                </span>
                                            )}
                                            {/* Status Badge */}
                                            {showStatusLabels && (
                                                <>
                                                    {child.status === "new" && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                            BARU
                                                        </span>
                                                    )}
                                                    {child.status ===
                                                        "modified" && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                            DIUBAH
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold theme-text mb-1 group-hover:text-action-primary transition-colors">
                                        {child.name}
                                    </h3>
                                    <p className="text-sm theme-text-muted">
                                        {child.is_container
                                            ? "Area Zona"
                                            : "Area Ruangan"}{" "}
                                        • Level {child.level || 2}
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-xs font-medium theme-text-subtle theme-icon-bg p-2 rounded">
                                        <span className="material-symbols-outlined text-[14px]">
                                            {child.is_container
                                                ? "folder"
                                                : "photo_camera"}
                                        </span>
                                        <span>
                                            {child.is_container
                                                ? `${
                                                      child.children?.length ||
                                                      0
                                                  } Area Ruangan`
                                                : `${
                                                      child.scenes?.length ||
                                                      child.scenes_count ||
                                                      0
                                                  } Scene`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full max-w-6xl text-center py-16 px-8 bg-gray-100 dark:bg-slate-800/30 border-2 border-dashed theme-border rounded-xl">
                            <span className="material-symbols-outlined text-6xl theme-text-subtle mb-4 block">
                                add_location_alt
                            </span>
                            <h3 className="text-lg font-bold theme-text mb-2">
                                Belum Ada Sub-Area
                            </h3>
                            <p className="text-sm theme-text-muted mb-6 max-w-md mx-auto">
                                Area utama ini belum memiliki Sub-Area. Klik
                                tombol di bawah untuk membuat Sub-Area pertama.
                            </p>
                            <button
                                onClick={() =>
                                    onCreateChild && onCreateChild(area.id)
                                }
                                className="inline-flex items-center gap-2 px-6 py-3 theme-btn-primary"
                            >
                                <span className="material-symbols-outlined">
                                    add
                                </span>
                                <span>Buat Sub-Area Pertama</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Scene Map Modal */}
                {showSceneMapModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl w-[90vw] h-[85vh] max-w-6xl flex flex-col overflow-hidden border theme-border">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b theme-border bg-gray-50 dark:bg-[#111a22]">
                                <div>
                                    <h3 className="text-lg font-bold theme-text">
                                        Peta Scene
                                    </h3>
                                    <p className="text-sm theme-text-secondary">
                                        Lihat dan kelola posisi scene di{" "}
                                        {area.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSceneMapModal(false)}
                                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined theme-text">
                                        close
                                    </span>
                                </button>
                            </div>
                            {/* Modal Content */}
                            <div className="flex-1 relative">
                                <SceneMapTab
                                    area={area}
                                    allScenes={allChildScenes}
                                    onUpdateScene={onUpdate}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ========== LEVEL 2+: Zone Grid View (unchanged) ==========
    return (
        <div className="flex-1 relative flex flex-col theme-view-canvas overflow-hidden group/canvas font-display">
            {/* Background */}
            <div className="absolute inset-0 theme-view-canvas">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] dark:opacity-[0.02] pointer-events-none overflow-hidden">
                    <span className="material-symbols-outlined text-[600px] theme-text-subtle">
                        layers
                    </span>
                </div>
            </div>

            {/* Content Scrollable */}
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
                                onClick={() =>
                                    onSelectChild && onSelectChild(child)
                                }
                                className="theme-card p-5 group cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="size-10 rounded-lg bg-teal-100 dark:bg-slate-800 flex items-center justify-center text-teal-500 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">
                                            meeting_room
                                        </span>
                                    </div>
                                    {/* Status & Property Badges */}
                                    <div className="flex items-center gap-1.5">
                                        {/* Restricted Icon */}
                                        {child.is_restricted && (
                                            <span
                                                className="size-6 rounded flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                                title="Akses Terbatas"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">
                                                    lock
                                                </span>
                                            </span>
                                        )}
                                        {/* Hidden Icon */}
                                        {child.is_hidden && (
                                            <span
                                                className="size-6 rounded flex items-center justify-center bg-purple-500/10 text-purple-500 border border-purple-500/20"
                                                title="Disembunyikan"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">
                                                    visibility_off
                                                </span>
                                            </span>
                                        )}
                                        {/* Status Badge */}
                                        {showStatusLabels && (
                                            <>
                                                {child.status === "new" && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                        BARU
                                                    </span>
                                                )}
                                                {child.status ===
                                                    "modified" && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                        DIUBAH
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
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

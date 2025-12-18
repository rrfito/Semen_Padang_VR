import React, { useRef } from "react";

export default function SceneContainerView({
    area,
    scenes,
    onSelectScene,
    onUpload,
    onAutoLink,
}) {
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files?.length) {
            // FIX: handleUploadScenes expects (files, areaId) not (areaId, files)!
            onUpload(e.target.files, area.id);
        }
    };

    return (
        <div className="flex-1 relative flex flex-col bg-[#05090c] overflow-hidden group/canvas font-display">
            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
            />

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[#0c141d]">
                <svg
                    className="w-full h-full opacity-[0.03]"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern
                            height="40"
                            id="grid-pattern"
                            patternUnits="userSpaceOnUse"
                            width="40"
                        >
                            <path
                                d="M 40 0 L 0 0 0 40"
                                fill="none"
                                stroke="white"
                                strokeWidth="1"
                            ></path>
                        </pattern>
                    </defs>
                    <rect
                        fill="url(#grid-pattern)"
                        height="100%"
                        width="100%"
                    ></rect>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
                    <span className="material-symbols-outlined text-[600px] text-white">
                        photo_camera_back
                    </span>
                </div>
            </div>

            {/* Main Content Scrollable */}
            <div className="z-10 flex flex-col items-center justify-start w-full h-full overflow-y-auto custom-scrollbar p-10">
                {/* Header */}
                <div className="w-full max-w-6xl mb-8 flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-wider">
                                Level {area.level || 3} • Leaf Area
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 uppercase tracking-wider">
                                Indoor
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {area.name}
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Manage 360° scenes in this area.
                        </p>
                    </div>
                    <button
                        onClick={handleUploadClick}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all"
                    >
                        <span className="material-symbols-outlined">
                            add_a_photo
                        </span>
                        <span>Add Scene</span>
                    </button>
                </div>

                {/* Info Alert */}
                <div className="w-full max-w-6xl mb-8 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5">
                        info
                    </span>
                    <div>
                        <p className="text-sm text-slate-300">
                            This area is a container for scenes, not sub-areas.
                            You can upload and manage 360 panorama images
                            directly here.
                        </p>
                    </div>
                </div>

                {/* Grid */}
                <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {scenes.map((scene) => (
                        <div
                            key={scene.id}
                            onClick={() => onSelectScene(scene)}
                            className="bg-surface-dark border border-border-dark hover:border-primary/50 rounded-xl overflow-hidden group cursor-pointer transition-all shadow-lg hover:shadow-xl hover:shadow-primary/5 flex flex-col"
                        >
                            <div className="relative aspect-video bg-slate-800">
                                <div
                                    className="w-full h-full bg-cover bg-center opacity-70 group-hover:opacity-100 transition-opacity"
                                    style={{
                                        backgroundImage: `url('${(() => {
                                            const path =
                                                scene.path ||
                                                scene.url ||
                                                scene.image_path;
                                            return path?.startsWith("http")
                                                ? path
                                                : `/storage/${path}`;
                                        })()}')`,
                                    }} // Use original, WebP will load when ready
                                ></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <span
                                        className={`bg-black/60 backdrop-blur rounded px-2 py-0.5 text-[10px] font-bold uppercase border border-white/10 ${
                                            scene.is_published
                                                ? "text-green-400"
                                                : "text-amber-500"
                                        }`}
                                    >
                                        {scene.is_published ? "Live" : "Draft"}
                                    </span>
                                    {scene.can_be_gateway && (
                                        <span className="bg-purple-600/90 backdrop-blur rounded px-2 py-0.5 text-[10px] font-bold uppercase border border-purple-400 text-white shadow-lg">
                                            Gateway
                                        </span>
                                    )}
                                </div>
                                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                                    <span className="material-symbols-outlined text-white/80 text-[24px]">
                                        360
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate pr-2">
                                        {scene.name}
                                    </h3>
                                    <button className="text-slate-500 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">
                                            more_vert
                                        </span>
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-auto">
                                    ID: {scene.id}
                                </p>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleUploadClick}
                        className="border-2 border-dashed border-border-dark hover:border-primary/50 hover:bg-primary/5 rounded-xl p-5 flex flex-col items-center justify-center gap-3 transition-all group min-h-[220px]"
                    >
                        <div className="size-12 rounded-full bg-slate-800 group-hover:bg-primary/20 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[24px]">
                                add_a_photo
                            </span>
                        </div>
                        <span className="text-sm font-bold text-slate-400 group-hover:text-primary transition-colors">
                            Add Scene
                        </span>
                        <span className="text-xs text-slate-600">
                            Upload 360° Panorama
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

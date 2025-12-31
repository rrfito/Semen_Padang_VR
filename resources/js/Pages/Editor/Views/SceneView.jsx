import React, { useEffect, useRef, useState } from "react";
import Marzipano from "marzipano";
import ToolbarButton from "@/Components/Editor/ToolbarButton";
import { VIEWER_CONFIG } from "@/Config/ViewerConfig";

export default function SceneView({
    scene,
    onUpdateScene,
    onAddLink,
    onDeleteLink,
    onUpdateLink,
    onRefetchScene,
}) {
    const panoRef = useRef(null);
    const viewerRef = useRef(null);
    const currentSceneRef = useRef(null);
    const hotspotElementsRef = useRef([]);
    // --- NEW STATE: Add Mode ---
    const [isAdding, setIsAdding] = useState(false);
    // --- EDIT MODE STATE ---
    const [selectedHotspot, setSelectedHotspot] = useState(null);
    const [isRepositioning, setIsRepositioning] = useState(false);

    useEffect(() => {
        if (!scene || !scene.image_url) {
            console.warn("SceneView: Missing scene or image_url", scene);
            return;
        }

        // NEW: Check if image exists (Race Condition Fix)
        const checkImage = new Image();
        checkImage.onerror = () => {
            console.warn(
                "SceneView: Image load failed (404), triggering refetch..."
            );
            if (onRefetchScene) onRefetchScene();
        };
        checkImage.src = scene.image_url;
        // If image ok, continue to init

        let attempts = 0;
        const maxAttempts = 20;
        let timer = null;

        const tryInit = () => {
            attempts++;
            if (!panoRef.current) return;

            const { clientWidth, clientHeight } = panoRef.current;

            if (clientWidth === 0 || clientHeight === 0) {
                if (attempts < maxAttempts) {
                    timer = setTimeout(tryInit, 100);
                } else {
                    console.error(
                        "SceneView: Failed - Container has 0 dimensions."
                    );
                }
                return;
            }

            // console.log(
            //     `SceneView: Attempt ${attempts} - Dimensions: ${clientWidth}x${clientHeight}`
            // );
            // console.log("Marzipano namespace:", Marzipano);

            try {
                if (viewerRef.current) {
                    viewerRef.current.destroy();
                    viewerRef.current = null;
                }

                // Verify Marzipano.Viewer exists
                if (!Marzipano.Viewer) {
                    console.error(
                        "SceneView: Marzipano.Viewer is undefined!",
                        Marzipano
                    );
                    return;
                }

                // console.log("SceneView: Creating Viewer...");
                const viewer = new Marzipano.Viewer(panoRef.current, {
                    controls: VIEWER_CONFIG.CONTROLS,
                });

                // CRITICAL: Log domElement
                // CRITICAL: Log domElement
                // console.log(
                //     "SceneView: viewer.domElement():",
                //     viewer.domElement()
                // );

                if (!viewer.domElement()) {
                    console.error(
                        "SceneView: FATAL - viewer.domElement() is undefined!"
                    );
                    return;
                }

                const stage = viewer.stage();
                if (!stage || !stage.domElement()) {
                    console.error("SceneView: Stage/DOM missing", stage);
                    viewer.destroy();
                    return;
                }

                viewerRef.current = viewer;

                // Create View
                const geometry = new Marzipano.EquirectGeometry([
                    { width: VIEWER_CONFIG.LIMITS.MAX_RESOLUTION },
                ]);
                const limiter = Marzipano.RectilinearView.limit.traditional(
                    VIEWER_CONFIG.LIMITS.MAX_RESOLUTION,
                    (100 * Math.PI) / 180
                );

                const initialYaw = scene.heading
                    ? (scene.heading * Math.PI) / 180
                    : 0;

                const view = new Marzipano.RectilinearView(
                    { yaw: initialYaw, pitch: 0, fov: Math.PI / 4 },
                    limiter
                );

                const source = Marzipano.ImageUrlSource.fromString(
                    scene.image_url
                );

                const marzipanoScene = viewer.createScene({
                    source: source,
                    geometry: geometry,
                    view: view,
                    pinFirstLevel: true,
                });

                currentSceneRef.current = marzipanoScene;

                marzipanoScene.switchTo();

                if (scene.links) {
                    scene.links.forEach((link, index) => {
                        createHotspot(link);
                    });
                }
            } catch (err) {
                console.error("Marzipano Error:", err);
                if (err.stack) console.error(err.stack);
            }
        };

        timer = setTimeout(tryInit, 100);

        return () => {
            if (timer) clearTimeout(timer);
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
            hotspotElementsRef.current = [];
        };
    }, [scene?.id]);

    // Re-render hotspots when links change (for seamless hotspot creation)
    useEffect(() => {
        if (!currentSceneRef.current || !scene?.links) return;

        const container = currentSceneRef.current.hotspotContainer?.();
        if (!container) return; // Scene not fully initialized yet

        // Destroy existing hotspots individually
        const existingHotspots = container.listHotspots();
        existingHotspots.forEach((hotspot) => {
            container.destroyHotspot(hotspot);
        });
        hotspotElementsRef.current = [];

        // Re-create all hotspots
        scene.links.forEach((link) => {
            createHotspot(link);
        });

        // console.log(
        //     "SceneView: Hotspots re-rendered, count:",
        //     scene.links.length
        // );
    }, [JSON.stringify(scene?.links)]); // Watch entire links array for any changes

    const createHotspot = (link) => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("hotspot-wrapper", "cursor-pointer");
        // Use flex column to stack icon and tooltip
        wrapper.style.cssText =
            "transition: none; display: flex; flex-direction: column; align-items: center;";

        const isGateway = link.type === "gateway";
        const icon = document.createElement("div");
        // Center icon at coordinate: icon is 48px (gateway) or 44px (nav), offset by half
        const iconSize = isGateway ? 48 : 44;
        icon.style.cssText = `flex-shrink: 0; margin-left: -${
            iconSize / 2
        }px; margin-top: -${iconSize / 2}px;`;

        // Use same SVG icons as Viewer for consistency
        icon.innerHTML = isGateway
            ? `<div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); box-shadow: 0 4px 15px rgba(147, 51, 234, 0.5), 0 0 0 3px rgba(255,255,255,0.3);"><svg viewBox="0 0 24 24" fill="white" class="w-7 h-7"><path d="M6 2v20h12V2H6zm10 16H8V4h8v14zm-4-6h2v2h-2v-2z"/></svg></div>`
            : `<div class="w-11 h-11 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5), 0 0 0 3px rgba(255,255,255,0.3);"><svg viewBox="0 0 24 24" fill="white" class="w-6 h-6" style="transform: rotate(-90deg);"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg></div>`;

        const tooltip = document.createElement("div");
        tooltip.innerText = link.target_name || "Tidak Diketahui";
        tooltip.classList.add(
            "hotspot-tooltip",
            "bg-black/70",
            "text-white",
            "text-xs",
            "px-2",
            "py-1",
            "rounded",
            "mt-1",
            "opacity-0",
            "transition-opacity",
            "whitespace-nowrap"
        );
        wrapper.appendChild(icon);
        wrapper.appendChild(tooltip);
        wrapper.addEventListener("mouseenter", () =>
            tooltip.classList.remove("opacity-0")
        );
        wrapper.addEventListener("mouseleave", () =>
            tooltip.classList.add("opacity-0")
        );
        wrapper.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (confirm("Hapus tautan ini?")) {
                onDeleteLink(link.id);
            }
        });

        // Left-click to select hotspot for editing
        wrapper.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelectedHotspot(link);
            setIsAdding(false); // Exit add mode if active
        });

        // Store wrapper reference for visual selection indicator
        wrapper.dataset.linkId = link.id;
        hotspotElementsRef.current.push(wrapper);

        if (currentSceneRef.current) {
            currentSceneRef.current.hotspotContainer().createHotspot(wrapper, {
                yaw: link.yaw,
                pitch: link.pitch || 0,
            });
        }
    };

    // --- HANDLER: Trigger Add ---
    // --- HANDLER: Trigger Add ---
    const handleTriggerAdd = (type) => {
        if (!viewerRef.current) return;
        const view = viewerRef.current.view();
        const yaw = view.yaw();
        const pitch = view.pitch();

        // console.log(
        //     "SceneView - Adding link with yaw:",
        //     yaw,
        //     "pitch:",
        //     pitch,
        //     "type:",
        //     type
        // );

        // Pass 'type' (navigasi | gateway) along with coords
        onAddLink({ yaw, pitch, type });
        setIsAdding(false); // Reset mode after adding
    };

    return (
        <main className="flex-1 relative flex flex-col theme-view-canvas overflow-hidden group/canvas items-center justify-center h-full w-full">
            <div
                ref={panoRef}
                className="absolute inset-0 z-0 cursor-move"
            ></div>

            {/* --- ADD HOTSPOT OVERLAY (RADIAL MENU - FIXED CENTER) --- */}
            {isAdding && (
                <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                    {/* Darken overlay slightly to focus */}
                    <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

                    {/* Radial Container */}
                    {/* Center Anchor & Buttons Container */}
                    <div className="relative pointer-events-auto animate-in fade-in zoom-in duration-200 flex flex-col items-center gap-6">
                        {/* Center Icon (Target Style) - Visual Anchor */}
                        <div className="relative z-20 flex items-center justify-center">
                            {/* Uses style similar to Update Position mode */}
                            <div className="size-14 rounded-full bg-slate-700/80 backdrop-blur-md border-[3px] border-white/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                <span className="material-symbols-outlined text-3xl text-white font-bold drop-shadow-md">
                                    my_location
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons Row (Below Center) */}
                        <div className="flex items-center gap-4">
                            {/* Button: Navigation */}
                            <button
                                onClick={() => handleTriggerAdd("navigasi")}
                                className="bg-blue-500 hover:bg-blue-600 border-2 border-white/30 hover:border-white text-white size-12 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center group"
                                title="Tautan ke Scene di Area yang Sama"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    className="w-6 h-6"
                                    style={{ transform: "rotate(-90deg)" }}
                                >
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                                </svg>
                            </button>

                            {/* Button: Gateway */}
                            <button
                                onClick={() => handleTriggerAdd("gateway")}
                                className="bg-purple-500 hover:bg-purple-600 border-2 border-white/30 hover:border-white text-white size-12 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center group"
                                title="Tautan ke Area Berbeda (Gerbang)"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    className="w-6 h-6"
                                >
                                    <path d="M6 2v20h12V2H6zm10 16H8V4h8v14zm-4-6h2v2h-2v-2z" />
                                </svg>
                            </button>

                            {/* Button: Cancel */}
                            <button
                                onClick={() => setIsAdding(false)}
                                className="bg-red-500/80 hover:bg-red-600 border-2 border-white/30 hover:border-white text-white size-12 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center group"
                                title="Batal"
                            >
                                <span className="material-symbols-outlined text-2xl">
                                    close
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Helper Text */}
                    <div className="absolute bottom-1/4 text-white font-bold text-sm bg-black/50 px-3 py-1 rounded backdrop-blur-sm pointer-events-none">
                        Sejajarkan tengah ke target, lalu pilih tipe
                    </div>
                </div>
            )}

            {/* --- REPOSITIONING MODE OVERLAY --- */}
            {isRepositioning && selectedHotspot && (
                <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                    {/* Darken overlay */}
                    <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>

                    {/* Center Anchor */}
                    <div className="relative pointer-events-auto animate-in fade-in zoom-in duration-200">
                        <div className="relative z-20 flex items-center justify-center">
                            <div
                                className={`size-14 rounded-full backdrop-blur-md border-[3px] border-white/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
                                    selectedHotspot.type === "gateway"
                                        ? "bg-purple-600/80"
                                        : "bg-blue-600/80"
                                }`}
                            >
                                <span className="material-symbols-outlined text-3xl text-white font-bold drop-shadow-md">
                                    my_location
                                </span>
                            </div>
                        </div>

                        {/* Confirm Button (Top) */}
                        <button
                            onClick={() => {
                                if (!viewerRef.current) return;
                                const view = viewerRef.current.view();
                                onUpdateLink(selectedHotspot.id, {
                                    yaw: view.yaw(),
                                    pitch: view.pitch(),
                                });
                                setIsRepositioning(false);
                                setSelectedHotspot(null);
                            }}
                            className="absolute bg-emerald-500 hover:bg-emerald-600 border-2 border-white/30 hover:border-white text-white size-10 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center left-1/2 -translate-x-1/2 -top-[3.5rem]"
                            title="Konfirmasi posisi baru"
                        >
                            <span className="material-symbols-outlined text-xl">
                                check
                            </span>
                        </button>

                        {/* Cancel Button (Bottom) */}
                        <button
                            onClick={() => setIsRepositioning(false)}
                            className="absolute bg-red-500/80 hover:bg-red-600 border-2 border-white/30 text-white size-10 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center left-1/2 -translate-x-1/2 -bottom-[3.5rem]"
                            title="Batalkan penempatan ulang"
                        >
                            <span className="material-symbols-outlined text-xl">
                                close
                            </span>
                        </button>
                    </div>

                    {/* Helper Text */}
                    <div className="absolute bottom-1/4 text-white font-bold text-sm bg-black/50 px-3 py-1 rounded backdrop-blur-sm pointer-events-none">
                        Gerakkan kamera ke posisi baru, lalu konfirmasi
                    </div>
                </div>
            )}

            {/* --- EDIT HOTSPOT PANEL --- */}
            {selectedHotspot && !isAdding && !isRepositioning && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 theme-card backdrop-blur-md rounded-xl shadow-2xl p-3">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b theme-border">
                        <div
                            className={`size-8 rounded-full flex items-center justify-center ${
                                selectedHotspot.type === "gateway"
                                    ? "bg-purple-500"
                                    : "bg-blue-500"
                            }`}
                        >
                            {selectedHotspot.type === "gateway" ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    className="w-4 h-4"
                                >
                                    <path d="M6 2v20h12V2H6zm10 16H8V4h8v14zm-4-6h2v2h-2v-2z" />
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    className="w-4 h-4"
                                    style={{ transform: "rotate(-90deg)" }}
                                >
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold theme-text truncate">
                                {selectedHotspot.target_name}
                            </p>
                            <p className="text-xs theme-text-muted">
                                {selectedHotspot.type === "gateway"
                                    ? "Gerbang"
                                    : "Navigasi"}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedHotspot(null)}
                            className="theme-text-muted hover:theme-text transition-colors p-1"
                            title="Tutup"
                        >
                            <span className="material-symbols-outlined text-lg">
                                close
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Update Position - Enter repositioning mode */}
                        <button
                            onClick={() => setIsRepositioning(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-emerald-500 hover:bg-emerald-600 text-white"
                            title="Masuk mode penempatan ulang"
                        >
                            <span className="material-symbols-outlined text-sm">
                                my_location
                            </span>
                            <span>Perbarui Posisi</span>
                        </button>

                        {/* Toggle Type */}
                        <button
                            onClick={() => {
                                const newType =
                                    selectedHotspot.type === "gateway"
                                        ? "navigasi"
                                        : "gateway";
                                onUpdateLink(selectedHotspot.id, {
                                    type: newType,
                                });
                                setSelectedHotspot((prev) => ({
                                    ...prev,
                                    type: newType,
                                }));
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-indigo-500 hover:bg-indigo-600 text-white"
                            title="Beralih antara navigasi dan gerbang"
                        >
                            <span className="material-symbols-outlined text-sm">
                                swap_horiz
                            </span>
                            <span>
                                {selectedHotspot.type === "gateway"
                                    ? "Ke Nav"
                                    : "Ke Gerbang"}
                            </span>
                        </button>

                        {/* Delete */}
                        <button
                            onClick={() => {
                                if (confirm("Hapus hotspot ini?")) {
                                    onDeleteLink(selectedHotspot.id);
                                    setSelectedHotspot(null);
                                }
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors bg-red-500 hover:bg-red-600 text-white"
                            title="Hapus hotspot"
                        >
                            <span className="material-symbols-outlined text-sm">
                                delete
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-1 p-1.5 theme-toolbar">
                    <ToolbarButton
                        icon="near_me"
                        title="Pilih alat"
                        active={!isAdding}
                        onClick={() => setIsAdding(false)}
                    />

                    <div className="w-px h-6 theme-divider mx-1"></div>

                    {/* ADD HOTSPOT BUTTON */}
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`h-10 flex items-center gap-2 px-3 rounded-lg transition-all font-medium text-sm ${
                            isAdding
                                ? "bg-primary text-white"
                                : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-primary"
                        }`}
                        title="Tambah Tautan / Hotspot"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            add_location
                        </span>
                        <span>Tambah Hotspot</span>
                    </button>
                </div>
            </div>
        </main>
    );
}

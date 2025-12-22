import React, { useEffect, useRef, useState } from "react";
import Marzipano from "marzipano";
import ToolbarButton from "@/Components/Editor/ToolbarButton";

export default function SceneView({
    scene,
    onUpdateScene,
    onAddLink,
    onDeleteLink,
    onUpdateLink,
}) {
    const panoRef = useRef(null);
    const viewerRef = useRef(null);
    const currentSceneRef = useRef(null);
    const hotspotElementsRef = useRef([]);

    // --- NEW STATE: Add Mode ---
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (!scene || !scene.image_url) {
            console.warn("SceneView: Missing scene or image_url", scene);
            return;
        }

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

            console.log(
                `SceneView: Attempt ${attempts} - Dimensions: ${clientWidth}x${clientHeight}`
            );
            console.log("Marzipano namespace:", Marzipano);

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

                console.log("SceneView: Creating Viewer...");
                const viewer = new Marzipano.Viewer(panoRef.current);

                // CRITICAL: Log domElement
                console.log(
                    "SceneView: viewer.domElement():",
                    viewer.domElement()
                );

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
                    { width: 4000 },
                ]);
                const limiter = Marzipano.RectilinearView.limit.traditional(
                    1024,
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

        const container = currentSceneRef.current.hotspotContainer();

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

        console.log(
            "SceneView: Hotspots re-rendered, count:",
            scene.links.length
        );
    }, [scene?.links?.length, JSON.stringify(scene?.links?.map((l) => l.id))]);

    const createHotspot = (link) => {
        const wrapper = document.createElement("div");
        wrapper.classList.add(
            "hotspot-wrapper",
            "cursor-pointer",
            "hover:scale-110",
            "transition-transform"
        );

        const isGateway = link.type === "gateway";
        const icon = document.createElement("div");

        // Use same SVG icons as Viewer for consistency
        icon.innerHTML = isGateway
            ? `<div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); box-shadow: 0 4px 15px rgba(147, 51, 234, 0.5), 0 0 0 3px rgba(255,255,255,0.3);"><svg viewBox="0 0 24 24" fill="white" class="w-7 h-7"><path d="M6 2v20h12V2H6zm10 16H8V4h8v14zm-4-6h2v2h-2v-2z"/></svg></div>`
            : `<div class="w-11 h-11 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5), 0 0 0 3px rgba(255,255,255,0.3);"><svg viewBox="0 0 24 24" fill="white" class="w-6 h-6"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg></div>`;

        const tooltip = document.createElement("div");
        tooltip.innerText = link.target_name || "Unknown";
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
            "transition-opacity"
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
            if (confirm("Delete this link?")) {
                onDeleteLink(link.id);
            }
        });
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

        console.log(
            "SceneView - Adding link with yaw:",
            yaw,
            "pitch:",
            pitch,
            "type:",
            type
        );

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
                    <div className="relative pointer-events-auto animate-in fade-in zoom-in duration-200">
                        {/* Center Icon (Chevron) - Visual Anchor */}
                        <div className="relative z-20 flex items-center justify-center">
                            <div className="size-16 rounded-full bg-slate-700/80 backdrop-blur-md border-[3px] border-white/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                <span className="material-symbols-outlined text-4xl text-white font-bold drop-shadow-md">
                                    expand_less
                                </span>
                            </div>
                        </div>

                        {/* Button: CANCEL / DELETE (Left) */}
                        <button
                            onClick={() => setIsAdding(false)}
                            className="absolute bg-red-500 hover:bg-red-600 text-white size-12 rounded-full shadow-lg transition-all hover:scale-110 -left-[4.5rem] top-1/2 -translate-y-1/2 flex items-center justify-center group border-2 border-white/20"
                            title="Cancel"
                        >
                            <span className="material-symbols-outlined text-2xl font-bold">
                                delete
                            </span>
                        </button>

                        {/* Button: GATEWAY FALSE (Top Right) - Regular Navigation */}
                        <button
                            onClick={() => handleTriggerAdd("navigasi")}
                            className="absolute bg-blue-500 hover:bg-blue-600 border-2 border-white/20 hover:border-white text-white size-12 rounded-full shadow-lg transition-all hover:scale-110 -right-[3.5rem] -top-[3rem] flex items-center justify-center group"
                            title="Link to Scene in Same Area"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="white"
                                className="w-6 h-6"
                            >
                                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                            </svg>
                        </button>

                        {/* Button: GATEWAY TRUE (Bottom Right) - Portal */}
                        <button
                            onClick={() => handleTriggerAdd("gateway")}
                            className="absolute bg-purple-500 hover:bg-purple-600 border-2 border-white/20 hover:border-white text-white size-12 rounded-full shadow-lg transition-all hover:scale-110 -right-[3.5rem] -bottom-[3rem] flex items-center justify-center group"
                            title="Link to Different Area (Gateway)"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="white"
                                className="w-7 h-7"
                            >
                                <path d="M6 2v20h12V2H6zm10 16H8V4h8v14zm-4-6h2v2h-2v-2z" />
                            </svg>
                        </button>
                    </div>

                    {/* Helper Text */}
                    <div className="absolute bottom-1/4 text-white font-bold text-sm bg-black/50 px-3 py-1 rounded backdrop-blur-sm pointer-events-none">
                        Align center to target, then choose type
                    </div>
                </div>
            )}

            {/* Floating Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-1 p-1.5 theme-toolbar">
                    <ToolbarButton
                        icon="near_me"
                        title="Select tool"
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
                        title="Add Link / Hotspot"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            add_location
                        </span>
                        <span>Add Hotspot</span>
                    </button>
                </div>
            </div>
        </main>
    );
}

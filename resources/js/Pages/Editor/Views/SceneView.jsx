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

    const createHotspot = (link) => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("hotspot-wrapper");
        const icon = document.createElement("div");
        icon.classList.add("hotspot-icon");
        icon.innerHTML = `<span class="material-symbols-outlined text-3xl text-white drop-shadow-md cursor-pointer hover:scale-110 transition-transform">${
            link.type === "gateway" ? "door_open" : "arrow_circle_up"
        }</span>`;
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
            currentSceneRef.current
                .hotspotContainer()
                .createHotspot(wrapper, {
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
        <main className="flex-1 relative flex flex-col bg-[#05090c] overflow-hidden group/canvas items-center justify-center h-full w-full">
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
                            className="absolute bg-[#1e293b] hover:bg-primary border-2 border-white/20 hover:border-white text-white size-12 rounded-full shadow-lg transition-all hover:scale-110 -right-[3.5rem] -top-[3rem] flex items-center justify-center group"
                            title="Link to Scene in Same Area"
                        >
                            <span className="material-symbols-outlined text-2xl font-bold">
                                arrow_circle_up
                            </span>
                        </button>

                        {/* Button: GATEWAY TRUE (Bottom Right) - Portal */}
                        <button
                            onClick={() => handleTriggerAdd("gateway")}
                            className="absolute bg-[#1e293b] hover:bg-purple-600 border-2 border-white/20 hover:border-white text-white size-12 rounded-full shadow-lg transition-all hover:scale-110 -right-[3.5rem] -bottom-[3rem] flex items-center justify-center group"
                            title="Link to Different Area (Gateway)"
                        >
                            <span className="material-symbols-outlined text-2xl font-bold">
                                door_open
                            </span>
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
                <div className="flex items-center gap-1 p-1.5 bg-surface-dark/90 backdrop-blur-md border border-border-dark rounded-xl shadow-2xl">
                    <ToolbarButton
                        icon="near_me"
                        title="Select tool"
                        active={!isAdding}
                        onClick={() => setIsAdding(false)}
                    />

                    <div className="w-px h-6 bg-border-dark mx-1"></div>

                    {/* UPDATED ADD BUTTON */}
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`h-10 flex items-center gap-2 px-4 rounded-lg transition-all font-medium text-sm ${
                            isAdding
                                ? "bg-primary text-white shadow-sm"
                                : "text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                        title="Add Link / Hotspot"
                    >
                        <span className="material-symbols-outlined">
                            arrow_circle_up
                        </span>
                        <span>Add Hotspot</span>
                    </button>
                </div>
            </div>
        </main>
    );
}

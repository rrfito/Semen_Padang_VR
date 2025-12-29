import React, { useEffect, useRef } from "react";
import { Head, Link, router } from "@inertiajs/react";
import Marzipano from "marzipano";
import { FaArrowLeft } from "react-icons/fa";
import Minimap from "@/Components/Tour/Minimap";

export default function Viewer({ scene, initial_heading }) {
    const panoRef = useRef(null);

    useEffect(() => {
        if (!panoRef.current) return;

        // 1. Init Marzipano
        const viewer = new Marzipano.Viewer(panoRef.current, {
            controls: { mouseViewMode: "drag" },
        });

        // 2. Load Source
        const source = Marzipano.ImageUrlSource.fromString(scene.image_url);
        const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);

        // === HEADING PRESERVATION LOGIC ===
        // Ada 2 heading:
        // 1. scene.heading = Orientasi gambar 360° terhadap kompas (North = 0°)
        // 2. initial_heading = Arah pandang user yang ingin dipertahankan
        //
        // Rumus: initialYaw = (User Heading - Scene Heading)
        // Ini membuat view rotate untuk kompensasi orientasi gambar,
        // sehingga user tetap menghadap arah yang sama

        let initialYaw = 0;

        if (initial_heading !== null && initial_heading !== undefined) {
            // User datang dari scene lain dengan heading tertentu
            // Pertahankan arah pandang user
            const userHeading = parseFloat(initial_heading);
            initialYaw = ((userHeading - scene.heading) * Math.PI) / 180;
        } else {
            // First load atau refresh - gunakan scene heading sebagai default
            initialYaw = (scene.heading * Math.PI) / 180;
        }

        const view = new Marzipano.RectilinearView(
            {
                yaw: initialYaw,
                pitch: 0,
                fov: Math.PI / 4,
            },
            Marzipano.RectilinearView.limit.traditional(
                1024,
                (100 * Math.PI) / 180
            )
        );

        const marzipanoScene = viewer.createScene({ source, geometry, view });

        // 3. Render Hotspots
        // console.log("Viewer - Hotspots data from server:", scene.hotspots);

        // ROBUSTNESS: Ensure is array (handle null/undefined/object)
        const hotspotsList = Array.isArray(scene.hotspots)
            ? scene.hotspots
            : Object.values(scene.hotspots || {});

        hotspotsList.forEach((hotspot, index) => {
            // console.log(
            //     `Hotspot ${index}:`,
            //     hotspot.type,
            //     hotspot.text,
            //     "yaw:",
            //     hotspot.yaw,
            //     "pitch:",
            //     hotspot.pitch
            // );
            const el = document.createElement("div");
            const isGateway = hotspot.type === "gateway";

            el.className = isGateway ? "hotspot-gateway" : "hotspot-nav";

            // Floating Marker: Chevron for navigation, Door for gateway
            el.innerHTML = isGateway
                ? `<div class="gateway-btn">
                     <svg viewBox="0 0 24 24" fill="currentColor" class="gateway-icon">
                       <path d="M6 2v20h12V2H6zm10 16H8V4h8v14zm-4-6h2v2h-2v-2z"/>
                     </svg>
                   </div>
                   <div class="hotspot-label">${hotspot.text}</div>`
                : `<div class="nav-btn">
                     <svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon" style="transform: rotate(-90deg);">
                       <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
                     </svg>
                   </div>
                   <div class="hotspot-label">${hotspot.text}</div>`;

            // Handle Klik Navigasi
            el.addEventListener("click", () => {
                // Hitung Compass Heading dari Link ini
                // Rumus: Heading = (Link Yaw + Scene Heading)
                // FIX: Gunakan VIEW.yaw() (Arah mata user saat ini) bukan hotspot.yaw
                // Agar transisi seamless, kita kirim arah pandang user saat ini

                const currentYawRad = view.yaw();
                const currentYawDeg = (currentYawRad * 180) / Math.PI;

                // Scene Heading kita asumsikan 0 (North) karena sudah dipaksa di backend
                // Jadi Heading = View Yaw
                const targetHeading =
                    (currentYawDeg + scene.heading + 360) % 360;

                router.visit(
                    route("tour.show", {
                        scene: hotspot.target_id,
                        heading: targetHeading, // Kirim arah pandang user saat ini
                    }),
                    {
                        preserveScroll: true,
                    }
                );
            });

            // Hitung Posisi
            // Gunakan pitch dari database (manual link mendukung pitch, auto-link default 0)
            const pitch = hotspot.pitch || 0;
            const yaw = hotspot.yaw;

            // console.log(
            //     `Hotspot ${index} - Final position: yaw=${yaw}, pitch=${pitch}`
            // );

            marzipanoScene.hotspotContainer().createHotspot(el, { yaw, pitch });
        });

        marzipanoScene.switchTo();

        // --- DEEP LINKING HEADING ---
        const updateUrlHeading = () => {
            const yawRad = view.yaw();
            const yawDeg = (yawRad * 180) / Math.PI;
            const currentHeading = (yawDeg + scene.heading + 360) % 360;

            // Update URL tanpa reload (replaceState)
            const url = new URL(window.location.href);
            url.searchParams.set("heading", currentHeading.toFixed(2));
            window.history.replaceState({}, "", url);
        };

        // Debounce 300ms
        let debounceTimer;
        const onBoundsChange = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateUrlHeading, 300);
        };

        view.addEventListener("change", onBoundsChange);

        return () => {
            viewer.destroy();
            view.removeEventListener("change", onBoundsChange);
            clearTimeout(debounceTimer);
        };
    }, [scene, initial_heading]);

    return (
        <>
            <Head title={scene.name} />

            <div className="w-full h-screen bg-black relative">
                <div ref={panoRef} className="absolute inset-0 z-0"></div>

                {/* MINIMAP */}
                <Minimap lat={scene.lat} lng={scene.lng} />

                {/* HEADER OVERLAY */}
                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
                    <Link
                        href={route("tour.index")}
                        className="pointer-events-auto bg-white/90 text-gray-900 px-5 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-white transition font-bold"
                    >
                        <FaArrowLeft /> Peta
                    </Link>

                    <div className="bg-black/60 text-white px-6 py-3 rounded-xl backdrop-blur-md text-right min-w-[200px]">
                        {/* HIERARCHY DISPLAY */}
                        {scene.hierarchy && scene.hierarchy.length > 0 ? (
                            <>
                                {/* ROOT (Main Title) */}
                                <h1 className="text-xl font-extrabold uppercase tracking-widest text-white drop-shadow-md">
                                    {scene.hierarchy[0]}
                                </h1>

                                {/* SUB-LEVELS (Breadcrumbs) */}
                                {scene.hierarchy.length > 1 && (
                                    <div className="flex items-center justify-end gap-2 mt-1">
                                        <p className="text-sm text-gray-200 font-medium uppercase tracking-wide">
                                            {scene.hierarchy
                                                .slice(1)
                                                .join(" > ")}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            // Fallback for old data structure
                            <>
                                <h1 className="text-xl font-extrabold uppercase tracking-widest text-white drop-shadow-md">
                                    {scene.main_title}
                                </h1>
                                <div className="flex items-center justify-end gap-2 mt-1">
                                    <span className="w-8 h-[2px] bg-red-600 inline-block"></span>
                                    <p className="text-sm text-gray-200 font-medium uppercase tracking-wide">
                                        {scene.sub_title}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* DATE DISPLAY */}
                        {scene.created_at && (
                            <div className="mt-2 pt-2 border-t border-white/20">
                                <p className="text-xs text-gray-400 font-light tracking-wide italic">
                                    {scene.created_at}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

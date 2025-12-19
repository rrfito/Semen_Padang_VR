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
        scene.hotspots.forEach((hotspot, index) => {
            const el = document.createElement("div");
            const isPortal = hotspot.type === "portal";

            el.className = isPortal ? "hotspot-portal" : "hotspot-nav";

            // Floating Marker: Simple Icon
            el.innerHTML = isPortal
                ? `🚪<div class="label">${hotspot.text}</div>`
                : `<div class="marker-container">
                     <div class="marker-ring"></div>
                     <div class="marker-dot"></div>
                   </div>
                   <div class="label">${hotspot.text}</div>`;

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
            // Pitch 0 agar sejajar mata (Eye Level), sama seperti di Editor
            const pitch = 0;

            // PENTING: Gunakan hotspot.yaw LANGSUNG tanpa konversi!
            // Database sudah menyimpan nilai dalam format yang diexpect Marzipano
            // Konversi radian sudah dilakukan saat save, jangan convert lagi!
            const yaw = hotspot.yaw; // ✅ Langsung, sama seperti Editor!

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
            <style>{`
                /* FLOATING MARKER STYLE */
                .hotspot-nav {
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    /* Tidak ada rotasi 3D, selalu menghadap kamera (Billboard) */
                    transition: transform 0.2s ease-out;
                    opacity: 0.9;
                }

                .marker-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Titik Tengah */
                .marker-dot {
                    width: 12px;
                    height: 12px;
                    background-color: white;
                    border-radius: 50%;
                    box-shadow: 0 0 8px rgba(0,0,0,0.5);
                    z-index: 2;
                }

                /* Cincin Luar (Pulsing) */
                .marker-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border: 2px solid rgba(255, 255, 255, 0.8);
                    border-radius: 50%;
                    animation: ripple 2s infinite;
                    box-shadow: 0 0 4px rgba(0,0,0,0.3);
                }

                /* Hover Effect */
                .hotspot-nav:hover {
                    transform: scale(1.2);
                    opacity: 1;
                }
                .hotspot-nav:hover .marker-dot {
                    background-color: #ffeb3b; /* Kuning saat hover */
                }
                .hotspot-nav:hover .marker-ring {
                    border-color: #ffeb3b;
                }
                
                /* PORTAL (PINTU MASUK) */
                .hotspot-portal { font-size: 40px; cursor: pointer; animation: pulse 2s infinite; filter: drop-shadow(0 0 10px red); }
                
                /* LABEL TEXT */
                .label { display: none; position: absolute; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; font-size: 12px; border-radius: 4px; white-space: nowrap; top: -35px; left: 50%; transform: translateX(-50%); pointer-events: none; }
                .hotspot-nav:hover .label, .hotspot-portal:hover .label { display: block; }
                
                @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
                @keyframes ripple {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
            `}</style>

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

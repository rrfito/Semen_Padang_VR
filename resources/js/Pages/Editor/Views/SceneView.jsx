import React, { useEffect, useRef, useState } from 'react';
import Marzipano from 'marzipano'; // Changed to default import
import { FaPlus, FaTrash } from 'react-icons/fa';
import ToolbarButton from '@/Components/Editor/ToolbarButton';

export default function SceneView({ scene, onUpdateScene, onAddLink, onDeleteLink, onUpdateLink }) {
    const panoRef = useRef(null);
    const viewerRef = useRef(null);
    const currentSceneRef = useRef(null);
    const hotspotElementsRef = useRef([]);

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
                    console.error("SceneView: Failed - Container has 0 dimensions.");
                }
                return;
            }

            console.log(`SceneView: Attempt ${attempts} - Dimensions: ${clientWidth}x${clientHeight}`);
            console.log("Marzipano namespace:", Marzipano);

            try {
                if (viewerRef.current) {
                    viewerRef.current.destroy();
                    viewerRef.current = null;
                }

                // Verify Marzipano.Viewer exists
                if (!Marzipano.Viewer) {
                    console.error("SceneView: Marzipano.Viewer is undefined!", Marzipano);
                    return;
                }

                console.log("SceneView: Creating Viewer...");
                const viewer = new Marzipano.Viewer(panoRef.current);
                
                // CRITICAL: Log domElement
                console.log("SceneView: viewer.domElement():", viewer.domElement());
                
                if (!viewer.domElement()) {
                    console.error("SceneView: FATAL - viewer.domElement() is undefined!");
                    return;
                }

                const stage = viewer.stage();
                if (!stage || !stage.domElement()) {
                    console.error("SceneView: Stage/DOM missing", stage);
                    viewer.destroy();
                    return;
                }
                console.log("SceneView: Stage verified.");

                viewerRef.current = viewer;

                // Create View
                const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
                const limiter = Marzipano.RectilinearView.limit.traditional(1024, 100*Math.PI/180);
                const view = new Marzipano.RectilinearView(
                    { yaw: scene.heading ? (scene.heading * Math.PI / 180) : 0, pitch: 0, fov: Math.PI/4 },
                    limiter
                );

                const source = Marzipano.ImageUrlSource.fromString(scene.image_url);

                console.log("SceneView: Creating Scene...");
                const marzipanoScene = viewer.createScene({
                    source: source,
                    geometry: geometry,
                    view: view,
                    pinFirstLevel: true
                });

                currentSceneRef.current = marzipanoScene;

                marzipanoScene.switchTo();
                console.log("SceneView: Complete.");

                if (scene.links) {
                    scene.links.forEach(link => createHotspot(link));
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
         const wrapper = document.createElement('div');
         wrapper.classList.add('hotspot-wrapper');
         const icon = document.createElement('div');
         icon.classList.add('hotspot-icon');
         icon.innerHTML = `<span class="material-symbols-outlined text-3xl text-white drop-shadow-md cursor-pointer hover:scale-110 transition-transform">${link.type === 'portal' ? 'door_open' : 'arrow_circle_up'}</span>`;
         const tooltip = document.createElement('div');
         tooltip.innerText = link.target_name || 'Unknown';
         tooltip.classList.add('hotspot-tooltip', 'bg-black/70', 'text-white', 'text-xs', 'px-2', 'py-1', 'rounded', 'mt-1', 'opacity-0', 'transition-opacity');
         wrapper.appendChild(icon);
         wrapper.appendChild(tooltip);
         wrapper.addEventListener('mouseenter', () => tooltip.classList.remove('opacity-0'));
         wrapper.addEventListener('mouseleave', () => tooltip.classList.add('opacity-0'));
         wrapper.addEventListener('contextmenu', (e) => {
             e.preventDefault();
             if (confirm('Delete this link?')) {
                 onDeleteLink(link.id);
             }
         });
         if (currentSceneRef.current) {
             currentSceneRef.current.hotspotContainer().createHotspot(wrapper, { yaw: link.yaw, pitch: 0 });
         }
    };

    return (
        <main className="flex-1 relative flex flex-col bg-[#05090c] overflow-hidden group/canvas items-center justify-center h-full w-full">
             <div ref={panoRef} className="absolute inset-0 z-0 cursor-move"></div>
             
             {/* Info Overlay */}
             <div className="absolute top-4 left-4 z-10 pointer-events-none">
                 <div className="bg-black/50 backdrop-blur text-white px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono">
                     Yaw: 0.00° | Pitch: 0.00°
                 </div>
             </div>

             {/* Floating Toolbar */}
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-1 p-1.5 bg-surface-dark/90 backdrop-blur-md border border-border-dark rounded-xl shadow-2xl">
                    <ToolbarButton icon="near_me" title="Select tool" active />
                    
                    <div className="w-px h-6 bg-border-dark mx-1"></div>
                    
                    <ToolbarButton icon="add_link" onClick={onAddLink} title="Add Link / Hotspot" />
                    <ToolbarButton icon="360" title="Set Initial View" />
                    
                    <div className="w-px h-6 bg-border-dark mx-1"></div>
                    
                    <ToolbarButton icon="delete" variant="danger" title="Delete Hotspot" />
                </div>
            </div>
        </main>
    );
}

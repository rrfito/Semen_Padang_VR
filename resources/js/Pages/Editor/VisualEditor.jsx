import React, { useEffect, useRef, useState, useMemo } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import Marzipano from "marzipano";
import { FaArrowLeft, FaPlus, FaSave, FaTrash, FaMapMarkerAlt, FaEye, FaUpload, FaMagic, FaCheck, FaTimes, FaLock, FaUnlock, FaCog, FaEdit } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import axios from "axios";

// Fix Leaflet Marker Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- SUB COMPONENT: MAP PICKER ---
function RecenterAutomatically({lat,lng}) {
 const map = useMapEvents({});
 useEffect(() => {
   map.setView([lat, lng]);
 }, [lat, lng]);
 return null;
}

function LocationPicker({ lat, lng, onLocationSelect }) {
    const validLat = parseFloat(lat) || -0.949;
    const validLng = parseFloat(lng) || 100.417;
    
    const MapEvents = () => {
        useMapEvents({
            click(e) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            },
        });
        return null;
    };

    return (
        <MapContainer center={[validLat, validLng]} zoom={18} style={{ height: "400px", width: "100%" }}>
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[validLat, validLng]}></Marker>
            <RecenterAutomatically lat={validLat} lng={validLng} />
            <MapEvents />
        </MapContainer>
    );
}

export default function VisualEditor({ area, sub_areas = [], scenes: initialScenes, candidates, areas }) {
    const [scenes, setScenes] = useState(initialScenes);
    const [subAreas, setSubAreas] = useState(sub_areas); // NEW: Manage SubAreas
    const [draftScenes, setDraftScenes] = useState([]); // Buffer for uploads
    const [currentScene, setCurrentScene] = useState(null);
    const [viewer, setViewer] = useState(null);
    const [view, setView] = useState(null);
    
    // Modals & UI State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [showAreaModal, setShowAreaModal] = useState(false); // New
    const [mapMode, setMapMode] = useState('scene'); // 'scene' or 'area'
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Area Metadata State
    const [areaData, setAreaData] = useState({
        name: area.name,
        description: area.description,
        parent_id: area.parent_id,
        lat: area.lat,
        lng: area.lng,
        priority: area.priority || 10, // Default 0
    });
    
    // Data for new link
    const [newLinkYaw, setNewLinkYaw] = useState(0);
    const [selectedTarget, setSelectedTarget] = useState("");
    const [selectedType, setSelectedType] = useState("navigasi");
    
    // Map Data
    const [newLocation, setNewLocation] = useState({ lat: 0, lng: 0 });

    // Editing State
    const [editingSceneName, setEditingSceneName] = useState(null);

    const panoRef = useRef(null);

    // --- SUB AREA MANAGEMENT (LOCAL FIRST) ---
    // Actions: Create (Local), Edit Name (Local), Toggle Lock (Local), Delete (Local)

    const handleCreateSubArea = () => {
        const name = prompt("Masukkan Nama Child Area (Contoh: Departemen A):");
        if (!name) return;

        const newId = `new_${Date.now()}`;
        const newSubArea = {
            id: newId,
            name: name,
            parent_id: area.id,
            priority: 0,
            is_new: true, // Flag for Sync
            is_restricted: false
        };

        // AUTO-MOVE ROOT SCENES TO THIS NEW AREA
        // Rule: Jika admin menambah Child Area, scene yang "terlanjur" ada di Root
        // akan dipindahkan ke area baru ini (jika ini area pertama).
        // Atau selalu pindahkan root scenes ke area baru ini sebagai "Unsorted"?
        // User said: "scene yang terlanjur akan dipindahkan ke grup child area pertama yang dibuat."
        // So ONLY if subAreas was empty before.

        let scenesToUpdate = [...scenes];
        if (subAreas.length === 0) {
            const rootScenes = scenesToUpdate.filter(s => s.area_id === area.id);
            if(rootScenes.length > 0) {
                 if(confirm(`Pindahkan ${rootScenes.length} scene yang ada di Root ke area baru ini?`)) {
                    scenesToUpdate = scenesToUpdate.map(s => {
                        if (s.area_id === area.id) return { ...s, area_id: newId };
                        return s;
                    });
                 }
            }
        }

        setSubAreas([...subAreas, newSubArea]);
        setScenes(scenesToUpdate);
    };

    const handleDeleteSubArea = (subAreaId) => {
        if(!confirm("Hapus Child Area ini? Scene di dalamnya akan kembali ke Root (Hidden).")) return;
        
        // Remove SubArea
        const remaining = subAreas.filter(sa => sa.id !== subAreaId);
        setSubAreas(remaining);

        // Move Scenes back to Root
        const updatedScenes = scenes.map(s => {
             if(s.area_id == subAreaId) return {...s, area_id: area.id };
             return s;
        });
        setScenes(updatedScenes);
    };

    const handleRenameSubArea = (subAreaId, oldName) => {
        const newName = prompt("Ganti Nama Area:", oldName);
        if(!newName || newName === oldName) return;

        setSubAreas(subAreas.map(sa => sa.id === subAreaId ? {...sa, name: newName} : sa));
    };

    const handleToggleSubAreaLock = (subAreaId) => {
        setSubAreas(subAreas.map(sa => sa.id === subAreaId ? {...sa, is_restricted: !sa.is_restricted} : sa));
    };

    // --- SCENE & DRAFT ACTIONS ---

    const handleAddDraftsToScenes = () => {
        let targetAreaId = area.id;
        
        // Smart Placement: If SubAreas exist, Default to the FIRST one.
        // Or render a prompt? User said "Root zone dihilangkan", implying Root is invalid destination if SubAreas exist.
        if (subAreas.length > 0) {
             targetAreaId = subAreas[0].id; // Default to first child
        }

        const newScenes = draftScenes.map((d, index) => ({
            id: `draft_${Date.now()}_${index}`,
            name: d.name,
            image_url: d.url, // Preview blob
            temp_path: d.temp_path, // For upload
            links: [],
            area_id: targetAreaId, // Correctly assign area
            heading: 0,
            is_new: true,
            is_restricted: false 
        }));

        setScenes([...scenes, ...newScenes]);
        setDraftScenes([]);
    };

    const handleSceneDrop = (sceneId, targetAreaId) => {
        // Optimistic Update
        const updatedScenes = scenes.map(s => {
            if (String(s.id) === String(sceneId)) {
                return { ...s, area_id: targetAreaId }; // Update Area ID locally
            }
            return s;
        });
        setScenes(updatedScenes);
    };

    // Derived Groups (Dynamic from Local State + SubAreas)
    const renderGroups = useMemo(() => {
        // 1. Root Scenes (Directly in Current Area)
        const rootScenes = scenes.filter(s => s.area_id === area.id);
        
        // 2. Sub Area Scenes
        const subAreaGroups = subAreas.map(sa => ({
            id: sa.id,
            name: sa.name,
            is_restricted: sa.is_restricted,
            scenes: scenes.filter(s => s.area_id === sa.id)
        }));

        return { rootScenes, subAreaGroups };
    }, [scenes, subAreas, area.id]);


    // State for Pending Changes
    const [deletedSceneIds, setDeletedSceneIds] = useState([]);
    const [deletedLinkIds, setDeletedLinkIds] = useState([]);
    
    // INIT MARZIPANO
    useEffect(() => {
        if (!currentScene || !panoRef.current) return;
        
        // Determine Image Source (URL or Temp Blob/URL)
        const imageUrl = currentScene.image_url || currentScene.url;

        let v = viewer;
        if (!v) {
            v = new Marzipano.Viewer(panoRef.current, {
                controls: { mouseViewMode: "drag" },
            });
            setViewer(v);
        }

        const source = Marzipano.ImageUrlSource.fromString(imageUrl);
        const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
        const vView = new Marzipano.RectilinearView(
            { yaw: 0 }, 
            Marzipano.RectilinearView.limit.traditional(1024, 100 * Math.PI / 180)
        );

        const mScene = v.createScene({ source, geometry, view: vView });
        mScene.switchTo();
        
        setView(vView);

        // Render Hotspots (from local state 'links')
        if (currentScene.links) {
            currentScene.links.forEach(link => {
                renderHotspot(mScene, link);
            });
        }

    }, [currentScene]);

    const renderHotspot = (mScene, link) => {
        const el = document.createElement("div");
        el.className = link.type === 'portal' ? 'editor-portal' : 'editor-hotspot';
        el.innerHTML = link.type === 'portal' ? '🚪' : '📍';
        
        // Find Target Name for Label
        let label = "Unknown";
        if(link.type === 'portal') {
             label = link.target_name || "Portal";
        } else {
             const targetScene = scenes.find(s => s.id == link.target_scene_id);
             label = targetScene ? targetScene.name : ("Scene " + link.target_scene_id);
        }
        
        el.title = `Ke: ${label}`;
        
        el.addEventListener('click', (e) => {
            e.stopPropagation(); 
            if(confirm(`Hapus link ke ${label}? (Akan dihapus saat disimpan)`)) {
                deleteLink(link.id, link.target_scene_id); 
            }
        });

        mScene.hotspotContainer().createHotspot(el, { yaw: link.yaw, pitch: 0 }); 
    };

    // --- HANDLERS (LOCAL STATE) ---

    const handleUpdateSceneName = (scene, newName) => {
        setEditingSceneName(null);
        if (!newName || newName === scene.name) return;

        setScenes(scenes.map(s => s.id === scene.id ? {...s, name: newName, group_name: newName} : s));
        if(currentScene?.id === scene.id) setCurrentScene({...currentScene, name: newName});
    };

    const handleDeleteScene = (scene) => {
        if(!confirm(`Hapus scene ${scene.name}? (Akan diproses saat Simpan)`)) return;
        
        // Mark for deletion if real
        if (!String(scene.id).startsWith('draft')) {
            setDeletedSceneIds([...deletedSceneIds, scene.id]);
        }
        
        const newScenes = scenes.filter(s => s.id !== scene.id);
        setScenes(newScenes);
        if(currentScene?.id === scene.id) setCurrentScene(null);
    };

    const handleToggleGroupRestriction = (groupName, shouldRestrict) => {
        const updatedScenes = scenes.map(s => {
            if (s.name === groupName || s.group_name === groupName) {
                return { ...s, is_restricted: shouldRestrict };
            }
            return s;
        });
        setScenes(updatedScenes);
        
        // Update current scene if affected
        if (currentScene && (currentScene.name === groupName || currentScene.group_name === groupName)) {
            setCurrentScene({ ...currentScene, is_restricted: shouldRestrict });
        }
    };



    const saveLink = async () => {
        // Just add to local state
        const newLink = {
            id: 'link_draft_' + Math.random(), 
            source_scene_id: currentScene.id,
            target_scene_id: selectedTarget,
            yaw: newLinkYaw,
            type: selectedType,
            // Helper for display
            target_name: selectedType === 'portal' 
                ? areas.find(a => a.first_scene_id == selectedTarget)?.name 
                : scenes.find(s => s.id == selectedTarget)?.name
        };

        // Update Scenes List (adding link to current scene)
        const updatedScenes = scenes.map(s => {
            if(s.id === currentScene.id) {
                return { ...s, links: [...s.links, newLink] };
            }
            return s;
        });

        setScenes(updatedScenes);
        setCurrentScene({...currentScene, links: [...currentScene.links, newLink]});
        
        alert("Link ditambahkan (Belum disimpan ke DB)");
        setShowLinkModal(false);
    };

    const deleteLink = async (linkId, targetId) => {
        // Track deletion if real link
        if (!String(linkId).startsWith('link_draft')) {
            setDeletedLinkIds([...deletedLinkIds, linkId]);
        }
        
        // Update State
        const updatedScenes = scenes.map(s => {
            if(s.id === currentScene.id) {
                return { ...s, links: s.links.filter(l => l.id !== linkId) };
            }
            return s;
        });
        
        setScenes(updatedScenes);
        setCurrentScene({...currentScene, links: currentScene.links.filter(l => l.id !== linkId)});
    };

    const saveLocation = async () => {
        // Local Update Only
        const updated = {
            ...currentScene, 
            location_array: {lat: newLocation.lat, lng: newLocation.lng},
            lat: newLocation.lat,
            lng: newLocation.lng
        };
        
        setScenes(scenes.map(s => s.id === updated.id ? updated : s));
        setCurrentScene(updated);
        
        setShowMapModal(false);
    };

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        const newDrafts = [];

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await axios.post(route('admin.editor.upload.temp'), formData);
                newDrafts.push({
                    ...res.data, 
                    id: 'draft-' + Math.random().toString(36).substr(2, 9),
                    name: res.data.filename.split('.')[0], 
                    isDraft: true,
                    links: []
                });
            } catch (err) {
                console.error("Upload failed", err);
                alert(`Gagal upload ${file.name}`);
            }
        }

        setDraftScenes([...draftScenes, ...newDrafts]);
        setIsUploading(false);
        if (newDrafts.length > 0) setCurrentScene(newDrafts[0]);
    };

    const handleAutoLink = () => {
        if (!confirm("Jalankan Auto Link (Satu Grup)?\n\nLink hanya akan dibuat antar scene dengan NAMA GRUP YANG SAMA (misal: Sub-Area sama) dan jarak < 100m.\n\nUntuk menghubungkan antar grup, gunakan tombol 'Link' manual.")) return;

        let newLinksCount = 0;
        const LINK_DISTANCE_THRESHOLD = 100; // meters (User Request)

        // Helper: Haversine Distance
        const getDist = (lat1, lon1, lat2, lon2) => {
            const R = 6371e3; // metres
            const φ1 = lat1 * Math.PI/180;
            const φ2 = lat2 * Math.PI/180;
            const Δφ = (lat2-lat1) * Math.PI/180;
            const Δλ = (lon2-lon1) * Math.PI/180;
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        };

        // Helper: Bearing
        const getBearing = (lat1, lon1, lat2, lon2) => {
            const y = Math.sin(lon2-lon1) * Math.cos(lat2);
            const x = Math.cos(lat1)*Math.sin(lat2) -
                      Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1);
            const θ = Math.atan2(y, x);
            return (θ*180/Math.PI + 360) % 360; // Degrees 0-360
        };

        const updatedScenes = scenes.map(source => {
           // Ensure source has location
           let sourceLat = source.location_array?.lat || source.lat;
           let sourceLng = source.location_array?.lng || source.lng;
           
           sourceLat = parseFloat(sourceLat);
           sourceLng = parseFloat(sourceLng);

           if (!sourceLat || !sourceLng) return source; // Skip if no GPS

           const newLinks = [];

           // Find Candidates
           const candidates = [];
           scenes.forEach(target => {
               if (source.id === target.id) return;
               
               // RESTRICTION: Link SAME GROUP NAME (Sub-Area)
               // Replaces old 'name' check which prevented distinct scene linking
               if (source.group_name !== target.group_name) return;

               let targetLat = target.location_array?.lat || target.lat;
               let targetLng = target.location_array?.lng || target.lng;
               targetLat = parseFloat(targetLat);
               targetLng = parseFloat(targetLng);

               if (!targetLat || !targetLng) return;

               const dist = getDist(sourceLat, sourceLng, targetLat, targetLng);
               
               if (dist <= LINK_DISTANCE_THRESHOLD) {
                   candidates.push({ target, dist });
               }
           });

           // SORT BY DISTANCE & TAKE RANK 1 (Nearest)
           candidates.sort((a, b) => a.dist - b.dist);
           
           if (candidates.length > 0) {
                // Take Top 1
                const best = candidates[0];
                const target = best.target;
                
                // Calculate Yaw
                const bearing = getBearing(sourceLat, sourceLng, parseFloat(target.location_array?.lat || target.lat), parseFloat(target.location_array?.lng || target.lng));
                const sourceHeading = parseFloat(source.heading || 0);
                
                let yawDeg = (bearing - sourceHeading);
                const yawRad = yawDeg * (Math.PI / 180);

                // Check duplicate
                const exists = source.links?.some(l => String(l.target_scene_id) == String(target.id));
                if (!exists) {
                    newLinks.push({
                        id: 'link_auto_' + Math.random().toString(36).substr(2, 9),
                        source_scene_id: source.id,
                        target_scene_id: target.id,
                        yaw: yawRad,
                        type: 'navigasi',
                        target_name: target.name
                    });
                    newLinksCount++;
                }
           }

           if (newLinks.length > 0) {
               return { ...source, links: [...(source.links || []), ...newLinks] };
           }
           return source;
        });

        if (newLinksCount > 0) {
            setScenes(updatedScenes);
            // Updating current scene logic
            if(currentScene) {
                 const curr = updatedScenes.find(s => s.id === currentScene.id);
                 if(curr) setCurrentScene(curr);
            }
            alert(`Auto Link Selesai! ${newLinksCount} link internal grup dibuat.\nIngat: Link antar-grup (misal gor1 -> gor2) harus dibuat Manual.`);
        } else {
            alert("Tidak ada scene satu grup yang cukup dekat (< 100m) untuk dihubungkan.");
        }
    };

    const handleAddLink = () => {
        const currentYaw = view.yaw();
        setNewLinkYaw(currentYaw);
        setShowLinkModal(true);
    };

    const handleSync = async () => {
        if(!confirm("Simpan semua perubahan (Upload, Rename, Link, Hapus) ke database?")) return;
        setIsSaving(true);
        try {
            // Payload Construction
            const uploads = scenes.filter(s => String(s.id).startsWith('draft')).map(s => ({
                id: s.id,
                temp_path: s.temp_path,
                name: s.name,
                heading: s.heading,
                is_restricted: s.is_restricted, 
                area_id: s.area_id, // Added (Critical for Sub Areas)
                lat: s.location_array?.lat,
                lng: s.location_array?.lng
            }));
            
            const updates = scenes.filter(s => !String(s.id).startsWith('draft')).map(s => ({
                id: s.id,
                name: s.name,
                is_restricted: s.is_restricted,
                area_id: s.area_id, // Added (Critical for Sub Areas)
                lat: s.location_array?.lat,
                lng: s.location_array?.lng
            }));

            // Collect Links (Only active ones)
            let allLinks = [];
            scenes.forEach(s => {
                if(!s.links) return;
                s.links.forEach(l => {
                     allLinks.push({
                         source: s.id,
                         target: l.target_scene_id,
                         yaw: l.yaw,
                         type: l.type
                     });
                });
            });

            await axios.post(route('admin.editor.save.batch', {area: area.id}), {
                area_data: areaData, 
                sub_areas: subAreas, // Added Sub Areas Payload
                uploads,
                updates,
                deletions: deletedSceneIds,
                deleted_links: deletedLinkIds,
                links: allLinks
            });

            alert("Berhasil disimpan!");
            window.location.href = `/admin/areas`; // Redirect to Area Index
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-gray-900 overflow-hidden font-sans">
             <style>{`
                .editor-hotspot { width: 40px; height: 40px; background: rgba(0,255,0,0.7); border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; cursor: pointer; border: 2px solid white; font-size: 20px;}
                .editor-portal { width: 40px; height: 40px; background: rgba(0,0,255,0.7); border-radius: 5px; display: flex; justify-content: center; align-items: center; cursor: pointer; border: 2px solid white; font-size: 20px;}
            `}</style>
             <Head title={`Visual Editor - ${area.name}`} />

            {/* SIDEBAR */}
            <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col z-20 shadow-xl">
                <div className="p-4 border-b border-gray-700 bg-gray-800">
                    <div className="flex justify-between items-start mb-1">
                        <h2 className="text-white font-bold text-lg leading-tight">{areaData.name}</h2>
                        <button onClick={() => setShowAreaModal(true)} className="text-gray-400 hover:text-white transition">
                            <FaCog size={16} />
                        </button>
                    </div>
                    <p className="text-blue-400 text-xs uppercase tracking-wider mb-3">Visual Editor</p>
                    
                    <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded cursor-pointer transition text-xs border border-gray-600">
                            <FaUpload /> Upload
                            <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
                        </label>
                        <button onClick={handleAutoLink} className="flex-1 flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 text-white py-2 rounded transition text-xs">
                            <FaMagic /> Auto Link
                        </button>
                    </div>
                    {isUploading && <p className="text-yellow-400 text-xs mt-2 animate-pulse">Uploading...</p>}
                </div>
                
                
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                    {/* DRAFTS - NOW JUST UPLOAD QUEUE */}
                    {draftScenes.length > 0 && (
                        <div className="border border-yellow-600/50 rounded bg-yellow-900/20 p-2">
                            <h3 className="text-yellow-500 text-xs font-bold uppercase mb-2 flex justify-between items-center">
                                Pending Uploads ({draftScenes.length})
                                <button onClick={handleAddDraftsToScenes} className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-500">
                                    Tambahkan ke List
                                </button>
                            </h3>
                            <div className="text-[10px] text-gray-400 mb-2 italic">
                                Klik tombol di atas untuk memasukkan foto ini ke daftar scene agar bisa diedit/disambungkan.
                            </div>
                            {draftScenes.map(scene => (
                                <div 
                                    key={scene.id}
                                    className="p-2 rounded flex items-center gap-3 bg-gray-800 border border-gray-700"
                                >
                                    <img src={scene.url} className="w-10 h-10 object-cover rounded bg-gray-900" />
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-white text-xs font-medium truncate">{scene.name}</p>
                                    </div>
                                    <button 
                                        onClick={() => setDraftScenes(draftScenes.filter(d => d.id !== scene.id))}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* EXISTING GROUPS */}
                    {/* --- Sidebar Header & Child Area Button --- */}
                     <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Scenes</h4>
                        <button 
                            onClick={handleCreateSubArea}
                            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1 transition"
                        >
                            <FaPlus size={10} /> Child Area
                        </button>
                    </div>

                    {/* --- ROOT AREA SCENES (Unclassified) --- */}
                    {/* Hide Root Zone if Sub Areas exist, unless there are scenes stranded there */}
                    {(subAreas.length === 0 || renderGroups.rootScenes.length > 0) && (
                        <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const sceneId = e.dataTransfer.getData("sceneId");
                                if (sceneId) handleSceneDrop(sceneId, area.id);
                            }}
                            className={`mb-4 ${subAreas.length > 0 ? 'opacity-50' : ''}`}
                            title={subAreas.length > 0 ? "Scenes di Root (Sebaiknya dipindahkan ke Child Area)" : ""}
                        >
                            <h3 className="text-gray-500 text-xs font-bold uppercase mb-1 px-2 border-b border-gray-700 pb-1">
                                {subAreas.length > 0 ? '⚠️ Unsorted (Root)' : `${area.name} (Root)`}
                            </h3>
                            <div className="space-y-1 mt-2">
                                {renderGroups.rootScenes.length === 0 && subAreas.length === 0 && (
                                    <p className="text-gray-600 text-[10px] px-2 italic">Drop scenes here...</p>
                                )}
                                {renderGroups.rootScenes.map(scene => (
                                    <div 
                                        key={scene.id}
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData("sceneId", scene.id)}
                                        onClick={() => setCurrentScene(scene)}
                                        className={`group relative flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 border mb-1 ${currentScene?.id === scene.id ? 'bg-blue-900/40 border-blue-500/50 shadow-md' : 'border-transparent hover:bg-gray-800'}`}
                                    >
                                        <div className="relative flex-shrink-0 w-12 h-12 mr-3">
                                            <img src={scene.image_url} className="w-full h-full object-cover rounded-md bg-gray-900 shadow-sm" />
                                            {scene.is_restricted && (
                                                <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 border border-gray-900 shadow-sm z-10"><FaLock size={12} /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className={`text-sm font-medium truncate leading-tight ${currentScene?.id === scene.id ? 'text-blue-200' : 'text-gray-200 group-hover:text-white'}`}>{scene.name}</p>
                                        </div>
                                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingSceneName(scene.id); }} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition"><FaEdit size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteScene(scene); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition"><FaTrash size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- SUB AREAS --- */}
                    {renderGroups.subAreaGroups.map(group => (
                        <div 
                            key={group.id} 
                            className="mb-4"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const sceneId = e.dataTransfer.getData("sceneId");
                                if (sceneId) handleSceneDrop(sceneId, group.id);
                            }}
                        >
                             <h3 className="text-gray-400 text-xs font-bold uppercase mb-1 px-2 flex justify-between items-center bg-gray-800/50 p-1 rounded cursor-default border border-gray-700/50 group/header">
                                 <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleRenameSubArea(group.id, group.name)}>
                                     <span>📁 {group.name}</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                     <button 
                                        onClick={() => handleToggleSubAreaLock(group.id)}
                                        className={`p-1 rounded hover:bg-gray-700 ${group.is_restricted ? 'text-red-500' : 'text-gray-500'}`}
                                        title={group.is_restricted ? "Area Terbatas" : "Area Publik"}
                                     >
                                         {group.is_restricted ? <FaLock size={10}/> : <FaUnlock size={10}/>}
                                     </button>
                                     <button 
                                        onClick={() => handleDeleteSubArea(group.id)}
                                        className="p-1 text-gray-500 hover:text-red-500 rounded hover:bg-gray-700"
                                        title="Hapus Folder"
                                     >
                                        <FaTrash size={10} />
                                     </button>
                                     <span className="text-[10px] bg-gray-700 px-1 rounded text-gray-300 ml-1">{group.scenes.length}</span>
                                 </div>
                             </h3>
                             <div className="space-y-1 mt-1 pl-2 border-l border-gray-700 ml-1">
                                {group.scenes.length === 0 && (
                                    <p className="text-gray-600 text-[10px] px-2 italic py-1">Kosong (Drop here)</p>
                                )}
                                {group.scenes.map(scene => (
                                    <div 
                                        key={scene.id}
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData("sceneId", scene.id)}
                                        onClick={() => setCurrentScene(scene)}
                                        className={`group relative flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 border mb-1 ${currentScene?.id === scene.id ? 'bg-blue-900/40 border-blue-500/50 shadow-md' : 'border-transparent hover:bg-gray-800'}`}
                                    >
                                        <div className="relative flex-shrink-0 w-12 h-12 mr-3">
                                            <img src={scene.image_url} className="w-full h-full object-cover rounded-md bg-gray-900 shadow-sm" />
                                            {scene.is_restricted && (
                                                <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 border border-gray-900 shadow-sm z-10"><FaLock size={12} /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            {editingSceneName === scene.id ? (
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    defaultValue={scene.name}
                                                    onBlur={(e) => handleUpdateSceneName(scene, e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if(e.key === 'Enter') handleUpdateSceneName(scene, e.target.value);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full text-xs bg-gray-900 text-white border-blue-500 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            ) : (
                                                <>
                                                    <p className={`text-sm font-medium truncate leading-tight ${currentScene?.id === scene.id ? 'text-blue-200' : 'text-gray-200 group-hover:text-white'}`}>{scene.name}</p>
                                                    <p className="text-[10px] text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                                        {scene.links.length > 0 ? (
                                                            <span className="text-green-500 flex items-center gap-0.5"><FaCheck size={10}/> {scene.links.length} Link</span>
                                                        ) : (
                                                            <span className="text-gray-600">No links</span>
                                                        )}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingSceneName(scene.id); }} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition"><FaEdit size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteScene(scene); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition"><FaTrash size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    ))}
                </div>
                
                <div className="p-3 border-t border-gray-700 bg-gray-900">
                     <button 
                        onClick={handleSync} 
                        disabled={isSaving}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded shadow-lg text-sm flex items-center justify-center gap-2"
                    >
                        {isSaving ? <FaCog className="animate-spin" /> : <FaSave />}
                        SIMPAN PENGATURAN
                    </button>
                    <div className="text-[10px] text-gray-500 text-center mt-1">
                        Klik Simpan untuk memproses semua perubahan.
                    </div>
                </div>
            </div>

            {/* MAIN VIEWER */}
            <div className="flex-1 relative bg-black">
                {currentScene ? (
                    <>
                        <div ref={panoRef} className="absolute inset-0 z-0"></div>
                        
                        {/* CROSSHAIR */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                            <div className="w-6 h-6 border-2 border-white/50 rounded-full flex items-center justify-center">
                                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                            </div>
                        </div>

                        {/* TOOLBAR */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-900/90 p-2 px-4 rounded-full backdrop-blur-md z-20 border border-gray-700 shadow-2xl">
                            
                            <button 
                                onClick={handleAddLink}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm transition"
                            >
                                <FaPlus /> Link
                            </button>

                            <div className="w-px h-6 bg-gray-600"></div>

                            <button 
                                onClick={() => {
                                    const lat = currentScene.location_array?.lat ?? currentScene.lat ?? 0;
                                    const lng = currentScene.location_array?.lng ?? currentScene.lng ?? 0;
                                    setNewLocation({lat, lng});
                                    setShowMapModal(true);
                                }}
                                className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-full font-bold text-sm transition"
                            >
                                <FaMapMarkerAlt /> Lokasi
                            </button>
                        </div>
                        
                        {/* SCENE NAME OVERLAY */}
                        <div className="absolute top-4 left-4 z-20 bg-black/50 px-3 py-1 rounded text-white text-sm backdrop-blur">
                            {currentScene.isDraft ? '[DRAFT] ' : ''} {currentScene.name}
                        </div>

                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                        <FaEye size={48} />
                        <p>Pilih foto dari sidebar untuk mulai mengedit</p>
                    </div>
                )}
            </div>

            {/* MODAL ADD LINK */}
            {showLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">Tambah Link</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Tipe Link</label>
                            <select 
                                value={selectedType} 
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full border rounded p-2"
                            >
                                <option value="navigasi">Navigasi (Area Sama)</option>
                                <option value="portal">Portal (Pindah Area)</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2">Target</label>
                            <select 
                                value={selectedTarget} 
                                onChange={(e) => setSelectedTarget(e.target.value)}
                                className="w-full border rounded p-2"
                            >
                                <option value="">-- Pilih Tujuan --</option>
                                {selectedType === 'navigasi' ? (
                                    // Group candidates by their name (Group Name) or just flat list?
                                    // User wants "distinct group linking".
                                    // Let's create OptGroup for each unique Name prefix or similar?
                                    // Actually, candidates don't have group info in the current API response.
                                    // Let's rely on their names or fetch groups better.
                                    // Wait, in controller: 'group_name' => $scene->name.
                                    // Candidates list only has 'name' which IS the group name effectively if we follow the pattern.
                                    // But scenes also have individual names? 
                                    // Looking at controller: name => scene->name ?? 'Scene #'. group_name => scene->name.
                                    // So Scene Name acts as Group Name.
                                    // So we can group by Name? But that would mean 1 group = 1 scene if names are unique.
                                    // If multiple scenes share the same 'name' (e.g. "Lobby"), then they are grouped.
                                    // Let's Group by Name for the Dropdown.
                                    
                                    (()=>{
                                        const groupedCandidates = {};
                                        // Filter: Exclude Self AND Already Linked Scenes
                                        candidates.filter(c => {
                                            const isSelf = c.id === currentScene.id;
                                            const isAlreadyLinked = currentScene.links && currentScene.links.some(l => l.target_scene_id == c.id);
                                            return !isSelf && !isAlreadyLinked;
                                        }).forEach(c => {
                                             if(!groupedCandidates[c.name]) groupedCandidates[c.name] = [];
                                             groupedCandidates[c.name].push(c);
                                        });

                                        return Object.keys(groupedCandidates).map(grp => (
                                            <optgroup key={grp} label={grp}>
                                                {groupedCandidates[grp].map((c, idx) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} #{c.id}
                                                        {/* Adding ID just to distinguish if they have same name */}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ));
                                    })()

                                ) : (
                                    // Portal: Select Target Area
                                    areas.filter(a => a.first_scene_id).map(a => (
                                        <option key={a.id} value={a.first_scene_id}>
                                            Area: {a.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            {selectedType === 'portal' && <p className="text-xs text-gray-500 mt-1">Portal akan mengarah ke scene pertama dari area yang dipilih.</p>}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Batal</button>
                            <button onClick={saveLink} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL AREA SETTINGS */}
            {showAreaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px]">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">Pengaturan Area</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Nama Area</label>
                            <input 
                                type="text" 
                                value={areaData.name} 
                                onChange={(e) => setAreaData({...areaData, name: e.target.value})}
                                className="w-full border rounded p-2"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Deskripsi</label>
                            <textarea 
                                value={areaData.description || ''} 
                                onChange={(e) => setAreaData({...areaData, description: e.target.value})}
                                className="w-full border rounded p-2"
                                rows={3}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Priority (Urutan)</label>
                            <input 
                                type="number" 
                                value={areaData.priority} 
                                onChange={(e) => setAreaData({...areaData, priority: parseInt(e.target.value) || 0})}
                                className="w-full border rounded p-2"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Parent Area (Grup)</label>
                            <select 
                                value={areaData.parent_id || ''} 
                                onChange={(e) => setAreaData({...areaData, parent_id: e.target.value || null})}
                                className="w-full border rounded p-2"
                            >
                                <option value="">-- Tidak Ada (Root) --</option>
                                {areas.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2">Lokasi Global Area</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    placeholder="Lat" 
                                    value={areaData.lat || 0} 
                                    onChange={(e) => setAreaData({...areaData, lat: e.target.value})}
                                    className="w-1/2 border rounded p-2" 
                                />
                                <input 
                                    type="number" 
                                    placeholder="Lng" 
                                    value={areaData.lng || 0} 
                                    onChange={(e) => setAreaData({...areaData, lng: e.target.value})}
                                    className="w-1/2 border rounded p-2" 
                                />
                            </div>
                            <button 
                                onClick={() => {
                                    setNewLocation({lat: areaData.lat || -0.949, lng: areaData.lng || 100.417});
                                    setMapMode('area'); // 'scene' or 'area'
                                    setShowMapModal(true);
                                }}
                                className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <FaMapMarkerAlt /> Pilih dari Peta
                            </button>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAreaModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MAP PICKER */}
            {showMapModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-[600px]">
                         <h3 className="text-lg font-bold mb-2 text-gray-900">
                            {mapMode === 'area' ? 'Lokasi Global Area' : 'Lokasi Scene'}
                         </h3>
                         <div className="border rounded overflow-hidden mb-4">
                            <LocationPicker 
                                lat={newLocation.lat} 
                                lng={newLocation.lng} 
                                onLocationSelect={(lat, lng) => setNewLocation({lat, lng})}
                            />
                         </div>
                         <div className="flex justify-end gap-2">
                            <button onClick={() => setShowMapModal(false)} className="px-4 py-2 text-gray-600">Batal</button>
                            <button onClick={() => {
                                if (mapMode === 'area') {
                                    setAreaData({...areaData, lat: newLocation.lat, lng: newLocation.lng});
                                    setShowMapModal(false);
                                } else {
                                    saveLocation();
                                }
                            }} className="px-4 py-2 bg-green-600 text-white rounded">Simpan</button>
                         </div>
                    </div>
                </div>
             )}

        </div>
    );
}

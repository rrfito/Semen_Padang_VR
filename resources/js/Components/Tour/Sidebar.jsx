import React, { useState } from 'react';
import { FaSearch, FaMapMarkerAlt, FaChevronDown, FaChevronRight, FaChevronLeft, FaUserCircle, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';
import { Link } from '@inertiajs/react';

export default function Sidebar({ menuData, onSelectLocation, user, isOpen, onToggle }) {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState({});

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleItemClick = (area) => {
        const firstScene = area.scenes?.[0];
        if (firstScene) {
            onSelectLocation(area);
        } else {
            alert("Area ini belum ada fotonya.");
        }
    };

    // --- LOGIKA FILTER SEARCH ---
    const safeMenuData = Array.isArray(menuData) ? menuData : [];
    const filteredData = safeMenuData.map(root => {
        const validChildren = (root.children || []).map(sub => {
            const validGrandChildren = (sub.children || []).filter(cucu => 
                cucu.name.toLowerCase().includes(search.toLowerCase())
            );
            const isSubMatch = sub.name.toLowerCase().includes(search.toLowerCase());
            const hasScenes = sub.scenes?.length > 0;

            if (isSubMatch || validGrandChildren.length > 0 || (hasScenes && isSubMatch)) {
                return { ...sub, children: validGrandChildren };
            }
            return null;
        }).filter(Boolean);

        const isRootMatch = root.name.toLowerCase().includes(search.toLowerCase());
        if (isRootMatch || validChildren.length > 0) {
            return { ...root, children: validChildren };
        }
        return null;
    }).filter(Boolean);

    return (
        <aside className={`
            h-full md:absolute z-[1000] flex flex-col font-sans relative transition-all duration-300 ease-in-out
            w-full md:w-80
            ${isOpen 
                ? 'md:left-5 md:top-5 md:h-[95vh] md:rounded-xl' 
                : 'md:left-0 md:top-0 md:h-full md:rounded-none'
            }
        `}>
            
            {/* TOGGLE BUTTON (CHEVRON) - Visible only on Desktop */}
            <button 
                onClick={onToggle}
                className={`
                    hidden md:flex absolute top-1/2 transform -translate-y-1/2 w-8 h-16 bg-white border-y border-r border-gray-200 rounded-r-xl items-center justify-center shadow-md text-gray-500 hover:text-[#D32F2F] hover:bg-gray-50 transition-all duration-300 z-[10]
                    -right-8
                `}
                title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
            >
                {isOpen ? <FaChevronLeft size={14} /> : <FaChevronRight size={14} />}
            </button>

            {/* CONTENT WRAPPER - Hidden when collapsed */}
            <div className={`
                flex flex-col h-full overflow-hidden transition-opacity duration-200 bg-white md:rounded-xl shadow-2xl border border-gray-100 relative z-[20]
                ${isOpen ? 'opacity-100' : 'opacity-0 invisible'}
            `}>
                
                {/* BRANDING */}
                <div className="p-6 border-b border-gray-100 bg-white shrink-0">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        {/* Logo Semen Padang */}
                        <img 
                            src="/image/LOGO PT SEMEN PADANG.png" 
                            alt="Semen Padang Logo" 
                            className="h-10 w-auto object-contain"
                        />
                        <div className="flex flex-col">
                            <span className="leading-none tracking-tight">SEMEN PADANG</span>
                            <span className="text-[10px] text-gray-500 font-medium tracking-widest mt-1">VIRTUAL TOUR</span>
                        </div>
                    </h1>
                </div>

                {/* SEARCH */}
                <div className="p-4 bg-gray-50/50 shrink-0">
                    <div className="relative group">
                        <FaSearch className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#D32F2F] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Cari lokasi..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] outline-none transition-all shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* LIST UTAMA */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredData.map(root => (
                        <div key={root.id} className="mb-1">
                            {/* LEVEL 1: ROOT */}
                            {(() => {
                                const isFolder = root.is_parent || (root.children && root.children.length > 0);
                                return (
                                    <div 
                                        className={`
                                            flex items-center justify-between px-3 py-3 cursor-pointer rounded-lg transition-all duration-200
                                            ${expanded[root.id] ? 'bg-gray-50' : 'hover:bg-gray-50'}
                                        `}
                                        onClick={() => isFolder ? toggleExpand(root.id) : handleItemClick(root)}
                                    >
                                        <div className="flex items-center gap-3 font-bold text-sm text-gray-800 uppercase tracking-wide">
                                            {!isFolder && <FaMapMarkerAlt className="text-[#D32F2F]" />}
                                            {root.name}
                                        </div>
                                        {isFolder && (
                                            <div className={`transform transition-transform duration-200 ${expanded[root.id] ? 'rotate-180' : ''}`}>
                                                <FaChevronDown size={10} className="text-gray-400"/>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* CHILDREN */}
                            {(expanded[root.id] || search) && (
                                <div className="mt-1 space-y-0.5">
                                    {root.children?.map(sub => {
                                        const isFolder = sub.is_parent || (sub.children && sub.children.length > 0);
                                        return (
                                            <div key={sub.id} className="relative">
                                                {/* Vertical Line for Tree Structure */}
                                                <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-200"></div>

                                                {isFolder ? (
                                                    // LEVEL 2: PARENT
                                                    <>
                                                        <div 
                                                            className="flex items-center justify-between py-2 pl-8 pr-3 cursor-pointer hover:bg-gray-50 rounded-r-lg relative"
                                                            onClick={() => toggleExpand(sub.id)}
                                                        >
                                                            <span className="text-sm font-semibold text-gray-700">{sub.name}</span>
                                                            <FaChevronDown size={10} className={`text-gray-300 transform transition ${expanded[sub.id] ? 'rotate-180' : ''}`}/>
                                                        </div>
                                                        
                                                        {/* LEVEL 3: CHILDREN */}
                                                        {expanded[sub.id] && (
                                                            <div className="ml-4">
                                                                {sub.children && sub.children.length > 0 ? (
                                                                    sub.children.map(cucu => (
                                                                        <div 
                                                                            key={cucu.id}
                                                                            onClick={() => handleItemClick(cucu)}
                                                                            className="flex items-center gap-2 py-2 pl-8 pr-3 cursor-pointer hover:bg-red-50 group relative rounded-r-lg"
                                                                        >
                                                                            <div className="absolute left-[18px] top-1/2 w-2 h-px bg-gray-300"></div>
                                                                            <FaMapMarkerAlt className="text-gray-400 group-hover:text-[#D32F2F] transition-colors" size={12} />
                                                                            <span className="text-xs font-medium text-gray-600 group-hover:text-[#D32F2F] transition-colors">
                                                                                {cucu.name}
                                                                            </span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="py-2 pl-8 text-xs text-gray-400 italic">
                                                                        Belum ada sub-area
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    // LEVEL 2: LEAF
                                                    <div 
                                                        onClick={() => handleItemClick(sub)}
                                                        className="flex items-center gap-2 py-2 pl-8 pr-3 cursor-pointer hover:bg-red-50 group relative rounded-r-lg"
                                                    >
                                                        <div className="absolute left-[18px] top-1/2 w-2 h-px bg-gray-300"></div>
                                                        <FaMapMarkerAlt className="text-gray-400 group-hover:text-[#D32F2F] transition-colors" size={12} />
                                                        <span className="text-sm font-medium text-gray-600 group-hover:text-[#D32F2F] transition-colors">
                                                            {sub.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* USER SECTION (LOGIN/LOGOUT) */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#D32F2F]">
                                    <FaUserCircle size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">{user.name}</span>
                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Pegawai
                                    </span>
                                </div>
                            </div>
                            <Link 
                                href={route('logout')} 
                                method="post" 
                                as="button"
                                className="p-2 text-gray-400 hover:text-[#D32F2F] hover:bg-white rounded-lg transition-all shadow-sm"
                                title="Logout"
                            >
                                <FaSignOutAlt size={18} />
                            </Link>
                        </div>
                    ) : (
                        <Link 
                            href={route('login')}
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#D32F2F] text-white rounded-lg text-sm font-bold hover:bg-[#b71c1c] transition-colors shadow-lg shadow-red-200"
                        >
                            <FaSignInAlt />
                            Login Pegawai
                        </Link>
                    )}
                </div>
            </div>
        </aside>
    );
}

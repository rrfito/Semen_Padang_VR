import React from 'react';
import { Link } from '@inertiajs/react';
import { FaTimes, FaMapMarkedAlt, FaVrCardboard } from 'react-icons/fa';

export default function SecondarySidebar({ selectedArea, onClose, onTogglePolyline, showPolyline }) {
    if (!selectedArea) return null;

    return (
        <div className="
            fixed bottom-0 left-0 right-0 z-[1000] 
            md:absolute md:top-4 md:right-4 md:bottom-auto md:left-auto md:w-80 
            bg-white rounded-t-xl md:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up md:animate-fade-in-right border border-gray-100 font-sans
            max-h-[60vh] md:max-h-[90vh]
        ">
            {/* Header Image */}
            <div className="h-32 md:h-48 w-full relative group shrink-0">
                <img 
                    src={selectedArea.thumbnail} 
                    alt={selectedArea.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[#D32F2F] transition-all duration-300 shadow-lg border border-white/20"
                >
                    <FaTimes size={16} />
                </button>

                <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-lg md:text-xl font-bold text-white leading-tight shadow-sm">{selectedArea.name}</h2>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 overflow-y-auto bg-white">
                <p className="text-sm text-gray-600 mb-6 line-clamp-4 leading-relaxed">
                    {selectedArea.description || 'Tidak ada deskripsi untuk area ini.'}
                </p>

                {/* Actions */}
                <div className="space-y-3">
                    <Link 
                        href={route('tour.show', selectedArea.first_scene_id)}
                        className="flex items-center justify-center gap-2 w-full bg-[#D32F2F] hover:bg-[#b71c1c] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-red-200 group"
                    >
                        <FaVrCardboard size={18} className="group-hover:scale-110 transition-transform" />
                        <span>Masuk Virtual Tour</span>
                    </Link>

                    <button 
                        onClick={onTogglePolyline}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 ${
                            showPolyline 
                                ? 'bg-red-50 border-red-200 text-[#D32F2F]' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2 font-medium">
                            <FaMapMarkedAlt size={16} className={showPolyline ? 'text-[#D32F2F]' : 'text-gray-400'} />
                            <span>Lihat Jalur Area</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${showPolyline ? 'bg-[#D32F2F]' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${showPolyline ? 'translate-x-5' : ''}`} />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

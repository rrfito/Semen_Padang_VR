import React, { useState, useEffect } from 'react';
import PendingChangesModal from '../Modals/PendingChangesModal';
import axios from 'axios';

export default function Header({ breadcrumbs = [], saveStatus = 'idle' }) {
    const [showPendingChanges, setShowPendingChanges] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    
    useEffect(() => {
        // Poll for pending count
        const fetchCount = async () => {
            try {
                const { data } = await axios.get(route('admin.editor.pending-changes'));
                setPendingCount(data.summary.total_changes || 0);
            } catch (error) {
                console.error('Failed to fetch pending count', error);
            }
        };
        
        fetchCount();
        const interval = setInterval(fetchCount, 30000); // Every 30s
        return () => clearInterval(interval);
    }, []);
    
    return (
        <header className="h-16 shrink-0 flex items-center justify-between border-b border-solid border-border-light dark:border-border-dark px-6 bg-surface-light dark:bg-surface-dark z-20 font-display">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
                <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
                    <span className="material-symbols-outlined">grid_view</span>
                </div>
                <div>
                    <h2 className="text-sm font-bold leading-tight tracking-wide uppercase text-slate-500 dark:text-slate-400">
                        PT Semen Padang
                    </h2>
                    <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                        Street View Admin
                    </h1>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#111a22] rounded-lg border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">home</span>
                {breadcrumbs.length > 0 && <span className="text-slate-400">/</span>}
                
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                        <span className={`text-sm font-bold ${index === breadcrumbs.length - 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-300 cursor-pointer transition-colors'}`}>
                            {crumb.name}
                        </span>
                        {index < breadcrumbs.length - 1 && <span className="text-slate-400">/</span>}
                    </React.Fragment>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Auto-save Status Indicator */}
                {saveStatus !== 'idle' && (
                    <div className="flex items-center gap-2 text-sm">
                        {saveStatus === 'saving' && (
                            <>
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <span className="text-slate-400">💾 Saving...</span>
                            </>
                        )}
                        {saveStatus === 'saved' && (
                            <>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-slate-400">✓ All changes saved</span>
                            </>
                        )}
                        {saveStatus === 'error' && (
                            <>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-red-400">⚠️ Failed to save</span>
                            </>
                        )}
                    </div>
                )}
                
                {/* Review Changes Button - Changed to Blue/Slate (more comfortable) */}
                <button 
                    onClick={() => {
                        setShowPendingChanges(true);
                    }}
                    className="relative px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold rounded-lg border border-blue-500/30 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                    <span>Review Changes</span>
                    {pendingCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                            {pendingCount}
                        </span>
                    )}
                </button>
                
                <div className="h-8 w-px bg-border-light dark:bg-border-dark mx-1"></div>
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div 
                        className="bg-center bg-no-repeat bg-cover rounded-full size-9 ring-2 ring-transparent group-hover:ring-primary/50 transition-all bg-slate-700"
                        style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff')" }}
                    ></div>
                </div>
            </div>
            
            {/* Pending Changes Modal */}
            <PendingChangesModal 
                isOpen={showPendingChanges}
                onClose={() => setShowPendingChanges(false)}
                onPublished={() => {
                    // Refetch pending count after publish
                    const fetchCount = async () => {
                        try {
                            const { data } = await axios.get(route('admin.editor.pending-changes'));
                            setPendingCount(data.summary.total_changes || 0);
                        } catch (error) {
                            console.error('Failed to fetch pending count', error);
                        }
                    };
                    fetchCount();
                }}
            />
        </header>
    );
}

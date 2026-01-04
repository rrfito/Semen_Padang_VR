import React, { useState, useEffect } from "react";
import {
    FaFolderPlus,
    FaLayerGroup,
    FaTimes,
    FaBan,
    FaArrowRight,
} from "react-icons/fa";

export default function CreateAreaModal({
    isOpen,
    onClose,
    parentArea,
    onConfirm,
}) {
    if (!isOpen) return null;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [contentType, setContentType] = useState("group"); // 'group' (Folder) or 'default' (scenes)
    const [isRootOverride, setIsRootOverride] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setName("");
            setDescription("");
            setContentType("group");
            setIsRootOverride(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    // Calculate Effective Parent and Level
    const effectiveParent = isRootOverride ? null : parentArea;
    const parentLevel = effectiveParent ? effectiveParent.level : 0;
    const targetLevel = parentLevel + 1;
    const isMaxDepthBlocked = targetLevel > 3;

    // Block if parent is a scene container (Level 2 with is_container = false)
    const isSceneContainerBlocked =
        effectiveParent &&
        effectiveParent.level === 2 &&
        effectiveParent.is_container === false;

    const isBlocked = isMaxDepthBlocked || isSceneContainerBlocked;

    const handleSubmit = async (keepOpen = false) => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            await onConfirm({
                name,
                description,
                parent_id: effectiveParent ? effectiveParent.id : null,
                is_container: contentType === "group", // Convert to boolean for backend
            });

            if (keepOpen) {
                // Reset form but keep modal open
                setName("");
                setDescription("");
                setContentType("group");
                setIsLoading(false);
            } else {
                // Close modal after successful save
                onClose();
            }
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="theme-modal max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="theme-modal-header flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div
                            className={`size-10 rounded-full flex items-center justify-center ${
                                isBlocked
                                    ? "bg-red-500/10 text-red-500"
                                    : "bg-action-primary/10 text-action-primary"
                            }`}
                        >
                            {isBlocked ? <FaBan /> : <FaFolderPlus />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold theme-text">
                                {isBlocked
                                    ? "Tidak Bisa Tambah Area"
                                    : "Tambah Area Baru"}
                            </h3>
                            {!isBlocked && (
                                <p className="text-xs theme-text-muted">
                                    {effectiveParent
                                        ? "Menambahkan sub-area baru"
                                        : "Menambahkan area utama baru"}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="theme-text-subtle hover:text-action-primary transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Context Visualization */}
                    <div className="theme-surface-elevated rounded-lg p-4 border theme-border">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-xs font-bold theme-text-muted uppercase">
                                Lokasi Penempatan
                            </div>
                            {parentArea && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded theme-input border theme-border text-action-primary focus:ring-action-primary w-3.5 h-3.5"
                                        checked={isRootOverride}
                                        onChange={(e) =>
                                            setIsRootOverride(e.target.checked)
                                        }
                                    />
                                    <span className="text-[10px] uppercase font-bold text-action-primary hover:text-action-primary/80 transition-colors">
                                        Buat di Halaman Utama
                                    </span>
                                </label>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            {/* Parent Context */}
                            <div
                                className={`flex items-center gap-2 ${
                                    effectiveParent
                                        ? "theme-text"
                                        : "theme-text-muted"
                                }`}
                            >
                                <FaLayerGroup className="theme-text-muted" />
                                <span>
                                    {effectiveParent
                                        ? effectiveParent.name
                                        : "Halaman Utama"}
                                </span>
                            </div>

                            <FaArrowRight className="theme-text-subtle text-xs" />

                            {/* New Node Placeholder */}
                            {isBlocked ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded border theme-alert-danger">
                                    <FaBan size={12} />
                                    <span>Penuh</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-dashed theme-border theme-text font-medium">
                                    <FaFolderPlus
                                        size={12}
                                        className="theme-text-muted"
                                    />
                                    <span>{name || "Nama Area"}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Blocked State Message */}
                    {isBlocked ? (
                        <div className="theme-alert-danger">
                            {isSceneContainerBlocked ? (
                                <>
                                    <h4 className="text-sm font-bold text-red-500 dark:text-red-400 mb-2">
                                        Area Ini Hanya Untuk Scene
                                    </h4>
                                    <p className="text-sm theme-text-secondary leading-relaxed">
                                        <span className="theme-text font-medium">
                                            "{effectiveParent?.name}"
                                        </span>{" "}
                                        adalah Ruangan Foto yang hanya bisa
                                        berisi foto-foto 360°.
                                    </p>
                                    <p className="text-sm theme-text-secondary mt-2">
                                        Gunakan tombol{" "}
                                        <span className="theme-text font-medium">
                                            "Tambah Scene"
                                        </span>{" "}
                                        untuk menambahkan foto.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h4 className="text-sm font-bold text-red-500 dark:text-red-400 mb-2">
                                        Batas Level Tercapai
                                    </h4>
                                    <p className="text-sm theme-text-secondary leading-relaxed">
                                        Anda tidak bisa membuat area lagi di
                                        dalam{" "}
                                        <span className="theme-text font-medium">
                                            "{effectiveParent?.name}"
                                        </span>
                                        . Sistem hanya mendukung 3 tingkat
                                        kedalaman (Gedung &gt; Lantai &gt;
                                        Ruangan).
                                    </p>
                                    <p className="text-sm theme-text-secondary mt-2">
                                        Silakan pilih area lain atau buat area
                                        baru di Halaman Utama.
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        /* Form Inputs */
                        <div className="space-y-4">
                            {/* Level 2 Content Type Selection */}
                            {targetLevel === 2 && (
                                <div className="space-y-2">
                                    <label className="theme-form-label block">
                                        Jenis Area Ini
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div
                                            onClick={() =>
                                                setContentType("group")
                                            }
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                contentType === "group"
                                                    ? "theme-sidebar-item-active"
                                                    : "theme-surface-elevated theme-border theme-sidebar-item"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <FaLayerGroup
                                                    className={
                                                        contentType === "group"
                                                            ? "text-action-primary"
                                                            : "theme-text-muted"
                                                    }
                                                />
                                                <span className="text-xs font-bold uppercase">
                                                    Area Zona
                                                </span>
                                            </div>
                                            <p className="text-[10px] leading-snug opacity-80">
                                                Pilih ini jika area ini memiliki
                                                area-area lain di dalamnya
                                                (Contoh: Lantai, Zona).
                                            </p>
                                        </div>

                                        <div
                                            onClick={() =>
                                                setContentType("default")
                                            }
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                contentType === "default"
                                                    ? "theme-sidebar-item-active"
                                                    : "theme-surface-elevated theme-border theme-sidebar-item"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <FaArrowRight
                                                    className={
                                                        contentType ===
                                                        "default"
                                                            ? "text-action-primary"
                                                            : "theme-text-muted"
                                                    }
                                                />
                                                <span className="text-xs font-bold uppercase">
                                                    Area Ruangan
                                                </span>
                                            </div>
                                            <p className="text-[10px] leading-snug opacity-80">
                                                Pilih ini jika area ini langsung
                                                berisi foto-foto 360 (Contoh:
                                                Lapangan, Ruang Tamu).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="theme-form-label block mb-1">
                                    Nama Area{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Contoh: Gedung Serbaguna, Lantai 1, Ruang Rapat"
                                    className="theme-form-input"
                                    autoFocus
                                />
                                <p className="theme-form-hint">
                                    Gunakan nama yang jelas dan mudah
                                    dimengerti.
                                </p>
                            </div>

                            <div>
                                <label className="theme-form-label block mb-1">
                                    Keterangan{" "}
                                    <span className="theme-text-subtle text-xs">
                                        (Opsional)
                                    </span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Penjelasan singkat tentang area ini..."
                                    rows={3}
                                    className="theme-form-input resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="theme-modal-footer flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="theme-btn-secondary">
                        {isBlocked ? "Tutup" : "Batal"}
                    </button>

                    {!isBlocked && (
                        <>
                            <button
                                onClick={() => handleSubmit(true)}
                                disabled={!name.trim() || isLoading}
                                className="theme-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="size-4 rounded-full border-2 border-gray-400 dark:border-white/30 border-t-gray-700 dark:border-t-white animate-spin"></div>
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaFolderPlus size={14} />
                                        <span>Simpan & Tambah Lagi</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={!name.trim() || isLoading}
                                className="theme-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaFolderPlus size={14} />
                                        <span>Simpan Area</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

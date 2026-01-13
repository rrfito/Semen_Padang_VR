import React, { useState, useEffect } from "react";

export default function InfoSpotModal({
    isOpen,
    onClose,
    onConfirm,
    initialData = null,
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState({});

    const maxTitleLength = 255;
    const maxDescriptionLength = 2000;

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || "");
                setDescription(initialData.description || "");
            } else {
                setTitle("");
                setDescription("");
            }
            setErrors({});
        }
    }, [isOpen, initialData]);

    const validate = () => {
        const newErrors = {};

        if (!title.trim()) {
            newErrors.title = "Judul wajib diisi";
        } else if (title.length > maxTitleLength) {
            newErrors.title = `Judul maksimal ${maxTitleLength} karakter`;
        }

        if (description.length > maxDescriptionLength) {
            newErrors.description = `Deskripsi maksimal ${maxDescriptionLength} karakter`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onConfirm({
                title: title.trim(),
                description: description.trim() || null,
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="theme-modal-backdrop backdrop-blur-sm">
            <div
                id="modal-info-spot"
                className="theme-modal w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="theme-modal-header flex justify-between items-center">
                    <h3 className="text-lg font-bold theme-text flex items-center gap-2">
                        <span className="material-symbols-outlined text-white bg-gray-500 rounded-full p-1 text-sm">
                            info
                        </span>
                        {initialData ? "Edit Info Spot" : "Tambah Info Spot"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="theme-text-subtle hover:text-action-primary"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {/* Title Field */}
                    <div>
                        <label className="block text-sm font-medium theme-text mb-1">
                            Judul <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Berikan nama untuk papan informasi ini"
                            maxLength={maxTitleLength}
                            className={`theme-input w-full ${
                                errors.title ? "border-red-500" : ""
                            }`}
                        />
                        <div className="flex justify-between mt-1">
                            {errors.title && (
                                <span className="text-xs text-red-500">
                                    {errors.title}
                                </span>
                            )}
                            <span className="text-xs theme-text-muted ml-auto">
                                {title.length}/{maxTitleLength}
                            </span>
                        </div>
                    </div>

                    {/* Description Field */}
                    <div>
                        <label className="block text-sm font-medium theme-text mb-1">
                            Deskripsi
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Berikan informasi detail tentang objek ini..."
                            rows={5}
                            maxLength={maxDescriptionLength}
                            className={`theme-input w-full resize-none ${
                                errors.description ? "border-red-500" : ""
                            }`}
                        />
                        <div className="flex justify-between mt-1">
                            {errors.description && (
                                <span className="text-xs text-red-500">
                                    {errors.description}
                                </span>
                            )}
                            <span className="text-xs theme-text-muted ml-auto">
                                {description.length}/{maxDescriptionLength}
                            </span>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="theme-modal-footer flex justify-end gap-2">
                    <button onClick={onClose} className="theme-btn-secondary">
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        id="btn-save-info-spot"
                        className="theme-btn-primary"
                    >
                        {initialData ? "Simpan Perubahan" : "Tambah Info Spot"}
                    </button>
                </div>
            </div>
        </div>
    );
}

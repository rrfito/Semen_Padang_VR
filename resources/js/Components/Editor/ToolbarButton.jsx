export default function ToolbarButton({ icon, onClick, title, variant = "secondary", active = false }) {
    const baseClasses = "w-10 h-10 flex items-center justify-center rounded-lg transition-colors";
    
    const variants = {
        primary: "bg-primary text-white shadow-sm",
        secondary: "text-slate-300 hover:text-white hover:bg-white/10",
        danger: "text-red-400 hover:text-red-300 hover:bg-red-500/10"
    };

    return (
        <button
            className={`${baseClasses} ${active ? variants.primary : variants[variant]}`}
            onClick={onClick}
            title={title}
        >
            <span className="material-symbols-outlined">{icon}</span>
        </button>
    );
}

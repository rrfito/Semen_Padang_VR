export default function ToolbarButton({
    icon,
    onClick,
    title,
    active = false,
}) {
    return (
        <button
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                active
                    ? "bg-primary text-white"
                    : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-primary"
            }`}
            onClick={onClick}
            title={title}
        >
            <span className="material-symbols-outlined text-[20px]">
                {icon}
            </span>
        </button>
    );
}

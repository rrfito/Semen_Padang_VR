export default function FormTextarea({ label, value, onChange, placeholder = "", rows = 4, ...props }) {
    return (
        <div className="space-y-1">
            {label && (
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {label}
                </label>
            )}
            <textarea
                className="w-full bg-slate-100 dark:bg-[#111a22] border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                {...props}
            />
        </div>
    );
}

export default function FormInput({ label, value, onChange, type = "text", placeholder = "", disabled = false, readOnly = false, ...props }) {
    return (
        <div className="space-y-1">
            {label && (
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {label}
                </label>
            )}
            <input
                className={`w-full bg-slate-100 dark:bg-[#111a22] border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all ${
                    disabled || readOnly ? 'bg-slate-200 dark:bg-[#1a2632] text-slate-500 cursor-not-allowed' : ''
                }`}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                {...props}
            />
        </div>
    );
}

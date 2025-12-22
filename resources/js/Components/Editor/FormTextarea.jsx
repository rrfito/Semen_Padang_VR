export default function FormTextarea({
    label,
    value,
    onChange,
    placeholder = "",
    rows = 4,
    ...props
}) {
    return (
        <div className="space-y-1">
            {label && <label className="theme-form-label">{label}</label>}
            <textarea
                className="theme-form-input resize-none"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                {...props}
            />
        </div>
    );
}

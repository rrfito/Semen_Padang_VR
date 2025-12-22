export default function FormInput({
    label,
    value,
    onChange,
    type = "text",
    placeholder = "",
    disabled = false,
    readOnly = false,
    ...props
}) {
    return (
        <div className="space-y-1">
            {label && <label className="theme-form-label">{label}</label>}
            <input
                className={`theme-form-input ${
                    disabled || readOnly ? "opacity-60 cursor-not-allowed" : ""
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

import React from "react";
import { useTheme } from "../../styles/Theme/Theme";

export default function TextArea({
  label,
  hint,
  error,
  rows = 4,
  className = "",
  containerClassName = "",
  style,
  ...rest
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const borderColor = error
    ? c.error?.main || "#EF4444"
    : c.secondary?.light || "#CBD5E1";

  return (
    <div className={containerClassName}>
      {label && (
        <label
          className="block mb-1 text-sm font-medium"
          style={{ color: c.text?.secondary }}
        >
          {label}
        </label>
      )}

      <textarea
        rows={rows}
        className={`w-full rounded-xl border px-4 py-3 outline-none transition-shadow ${className}`}
        style={{
          backgroundColor: c.background?.paper || "#fff",
          color: c.text?.primary,
          borderColor,
          boxShadow: "0 0 0 0 rgba(0,0,0,0)",
          resize: "vertical",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          hyphens: "auto",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 3px ${
            c.menu?.ring || "rgba(37,99,235,0.3)"
          }`;
          e.currentTarget.style.borderColor = c.primary?.main || "#2563EB";
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = borderColor;
        }}
        {...rest}
      />
      {(hint || error) && (
        <div className="mt-1 text-xs">
          {error ? (
            <span style={{ color: c.error?.main }}>{error}</span>
          ) : (
            <span style={{ color: c.text?.secondary }}>{hint}</span>
          )}
        </div>
      )}
    </div>
  );
}

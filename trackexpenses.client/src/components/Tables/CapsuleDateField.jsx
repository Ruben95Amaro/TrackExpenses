import React from "react";
import { Calendar } from "lucide-react";

export default function CapsuleDateField({
  value = "",
  onClick = () => {},
  leftAction,
  disabled = false,
  theme,
  className = "",
  ariaLabel = "Date",
}) {
  const border = "#FFFFFF"; 
  const bg = "rgba(255,255,255,0.10)";

  return (
    <div
      className={[
        "h-[52px] rounded-2xl border flex items-center overflow-hidden relative",
        "focus-within:border-white focus-within:shadow-[0_0_0_2px_rgba(255,255,255,0.25)]",
        className,
      ].join(" ")}
      style={{ borderColor: border, background: bg }}
    >
      {/* Ícone à esquerda */}
      <button
        type="button"
        onClick={leftAction || onClick}
        disabled={disabled}
        aria-label={`${ariaLabel} open`}
        className="absolute left-0 h-full w-[48px] flex items-center justify-center hover:bg-white/10 transition rounded-l-2xl"
      >
        <Calendar className="w-4.5 h-4.5 opacity-90 text-white" />
      </button>

      {/* Data centrada */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={value || ariaLabel}
        className="w-full h-full flex items-center justify-center text-sm font-medium px-3 truncate text-white hover:bg-white/5 transition"
      >
        {value || "—"}
      </button>
    </div>
  );
}

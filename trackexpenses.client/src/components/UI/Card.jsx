// src/components/UI/Card.jsx
import React from "react";
import { useTheme } from "../../styles/Theme/Theme";

export default function Card({
  title,
  actions,
  footer,
  padding = "md",
  hover = false,
  clickable = false,
  onClick,
  className = "",
  style,
  children,
  variant = "solid", 
  ...rest
}) {
  const { theme } = useTheme();
  const c = theme?.colors || {};

  // --- Black UI (match Edit page) ---
  const BORDER_COLOR = "#000";
  const BORDER_WIDTH = "2px";
  const PAPER_BG = c.background?.paper ?? "rgba(255,255,255,0.9)";

  const paddings = { none: "p-0", sm: "p-4", md: "p-6" };
  const isGhost = variant === "ghost";

  return (
    <section
      onClick={onClick}
      className={[
        "rounded-2xl",
        paddings[padding],
        hover || clickable ? "transition-shadow" : "",
        clickable ? "cursor-pointer" : "",
        "min-w-0 overflow-hidden",
        className,
      ].join(" ")}
      style={{
        backgroundColor: isGhost ? "transparent" : PAPER_BG,
        border: isGhost ? "0" : `${BORDER_WIDTH} solid ${BORDER_COLOR}`,
        boxShadow: isGhost
          ? "none"
          : (hover || clickable
              ? "0 10px 30px rgba(0,0,0,0.06)"
              : "0 1px 2px rgba(0,0,0,0.03)"),
        ...style,
      }}
      {...rest}
    >
      {(title || actions) && (
        <header
          className={
            "flex items-start sm:items-center justify-between gap-3 pb-4 " +
            (isGhost ? "" : "border-b")
          }
          style={{ borderColor: BORDER_COLOR }}
        >
          <div
            className="text-base font-semibold min-w-0 break-words hyphens-auto"
            style={{ color: "#000" }}
          >
            {title}
          </div>
          {actions ? (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          ) : null}
        </header>
      )}

      <div className={title || actions ? "pt-4" : ""}>{children}</div>

      {footer && (
        <footer
          className={"mt-4 pt-4 " + (isGhost ? "" : "border-t")}
          style={{ borderColor: BORDER_COLOR }}
        >
          {footer}
        </footer>
      )}
    </section>
  );
}

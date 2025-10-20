import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../styles/Theme/Theme";

function parseToRGB(c) {
  if (!c) return { r: 11, g: 18, b: 32 };
  if (typeof c !== "string") return { r: 11, g: 18, b: 32 };
  if (c.startsWith("#")) {
    const h = c.slice(1);
    const full = h.length === 3 ? h.split("").map(x => x + x).join("") : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  if (c.startsWith("rgb")) {
    const nums = c.replace(/[^\d.,]/g, "").split(",").map(Number);
    return { r: nums[0] ?? 11, g: nums[1] ?? 18, b: nums[2] ?? 32 };
  }
  return { r: 11, g: 18, b: 32 };
}
function isDarkColor(color) {
  const { r, g, b } = parseToRGB(color || "#0b1220");
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128;
}

export default function StatCard({
  icon,
  title,
  value,
  trend,
  trendColor,
  className = "",
  onClick,
}) {
  const { theme } = useTheme();
  const c = theme?.colors || {};

  const PAPER = c.background?.paper ?? "rgba(255,255,255,0.9)";
  const DARK = isDarkColor(PAPER);
  const FG = DARK ? "#FFFFFF" : "#000000";           
  const BORDER_WIDTH = "2px";

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: ["h-6 w-6 shrink-0", icon.props?.className].filter(Boolean).join(" "),
        style: { color: FG, ...(icon.props?.style || {}) },
      });
    }
    if (typeof icon === "function") {
      const IconComp = icon;
      return <IconComp className="h-6 w-6 shrink-0" style={{ color: FG }} />;
    }
    return null;
  };

  const trendText =
    trend === 0 || trend
      ? (typeof trend === "number"
          ? `${trend > 0 ? "+" : trend < 0 ? "−" : ""}${Math.abs(trend)}%`
          : String(trend))
      : "";

  const handleKey = (e) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKey}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={[
        "w-full min-w-0 rounded-2xl p-4 sm:p-5",
        "flex items-start gap-3 sm:gap-4 overflow-hidden",
        onClick
          ? "cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus:ring-2"
          : "",
        className,
      ].join(" ")}
      style={{
        backgroundColor: PAPER,
        border: `${BORDER_WIDTH} solid ${FG}`,   
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        color: FG,                                
      }}
    >
      {icon ? <div className="pt-0.5">{renderIcon()}</div> : null}

      <div className="min-w-0 flex-1">
        <div
          className="text-xs sm:text-sm leading-snug break-words overflow-hidden"
          style={{
            color: FG,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
          title={typeof title === "string" ? title : undefined}
        >
          {title}
        </div>

        <div
          className="mt-1 text-xl sm:text-2xl font-semibold leading-tight truncate"
          style={{ color: FG }}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>

        {trendText ? (
          <div
            className="mt-1 text-[11px] sm:text-xs font-medium break-words overflow-hidden"
            style={{
              color: trendColor || FG,  
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
            title={trendText}
          >
            {trendText}
          </div>
        ) : null}
      </div>
    </div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  trendColor: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

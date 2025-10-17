import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../styles/Theme/Theme";

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

  const BLACK = "#000";
  const BORDER_WIDTH = "2px";
  const PAPER = c.background?.paper ?? "rgba(255,255,255,0.9)";

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: ["h-6 w-6 shrink-0", icon.props?.className].filter(Boolean).join(" "),
        style: { color: BLACK, ...(icon.props?.style || {}) },
      });
    }
    if (typeof icon === "function") {
      const IconComp = icon;
      return <IconComp className="h-6 w-6 shrink-0" style={{ color: BLACK }} />;
    }
    return null;
  };

  const trendText =
    trend === 0 || trend
      ? typeof trend === "number"
        ? `${trend > 0 ? "+" : trend < 0 ? "−" : ""}${Math.abs(trend)}%`
        : String(trend)
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
        border: `${BORDER_WIDTH} solid ${BLACK}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        color: BLACK, 
      }}
    >
      {icon ? <div className="pt-0.5">{renderIcon()}</div> : null}

      <div className="min-w-0 flex-1">
        <div
          className="text-xs sm:text-sm leading-snug break-words overflow-hidden"
          style={{
            color: BLACK, 
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
          style={{ color: BLACK }} 
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>

        {trendText ? (
          <div
            className="mt-1 text-[11px] sm:text-xs font-medium break-words overflow-hidden"
            style={{
              color: trendColor || BLACK, 
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

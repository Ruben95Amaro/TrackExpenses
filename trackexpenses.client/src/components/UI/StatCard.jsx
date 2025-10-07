import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../styles/Theme/Theme";

export default function StatCard({
  icon,          // componente (Icon) OU elemento (<Icon />)
  title,
  value,
  trend,         // string ou número (ex.: "+12%")
  trendColor,
  className = "",
  onClick,
}) {
  const { theme } = useTheme();
  const c = theme?.colors || {};

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: ["h-6 w-6 shrink-0", icon.props?.className].filter(Boolean).join(" "),
        style: { color: c.primary?.main, ...(icon.props?.style || {}) },
      });
    }
    if (typeof icon === "function") {
      const IconComp = icon;
      return <IconComp className="h-6 w-6 shrink-0" style={{ color: c.primary?.main }} />;
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
        "w-full min-w-0 rounded-2xl border p-4 sm:p-5",
        "flex items-start gap-3 sm:gap-4 overflow-hidden", // impede overflow
        onClick ? "cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50" : "",
        className,
      ].join(" ")}
      style={{
        backgroundColor: c.background?.paper,
        borderColor: c.secondary?.light,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {/* Ícone sem “quadrado”/fundo */}
      {icon ? <div className="pt-0.5">{renderIcon()}</div> : null}

      <div className="min-w-0 flex-1">
        {/* Título: quebra e limita a 2 linhas */}
        <div
          className="text-xs sm:text-sm leading-snug break-words overflow-hidden"
          style={{
            color: c.text?.secondary,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
          title={typeof title === "string" ? title : undefined}
        >
          {title}
        </div>

        {/* Valor: maior, com ellipsis */}
        <div
          className="mt-1 text-xl sm:text-2xl font-semibold leading-tight truncate"
          style={{ color: c.text?.primary }}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>

        {/* Trend/descrição: até 2 linhas */}
        {trendText ? (
          <div
            className="mt-1 text-[11px] sm:text-xs font-medium break-words overflow-hidden"
            style={{
              color: trendColor || c.text?.secondary,
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

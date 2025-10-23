import React, { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Search as SearchIcon, ChevronDown, X } from "lucide-react";

const cx = (...xs) => xs.filter(Boolean).join(" ");

/* ===== helpers de tema ===== */
const paperBg = (theme) => theme?.colors?.background?.paper || "transparent";
const ringColor = (theme) =>
  theme?.colors?.secondary?.light || "rgba(148,163,184,0.25)";
const capsuleBg = (theme) =>
  theme?.colors?.glass?.soft || "rgba(148,163,184,0.08)";
const textMain = (theme) => theme?.colors?.text?.primary || "#ffffff";
const textMuted = (theme) =>
  theme?.colors?.text?.secondary || "rgba(255,255,255,0.85)";
const isDarkMode = (t) => {
  const m =
    t?.isDark ??
    t?.mode ??
    t?.palette?.mode ??
    t?.colors?.mode;
  if (typeof m === "boolean") return m;
  if (typeof m === "string") return m.toLowerCase() === "dark";
  return false;
};

/* ===== cápsulas reutilizáveis ===== */
function FieldLabel({ children, theme }) {
  return (
    <label className="text-xs select-none block mb-1" style={{ color: textMuted(theme) }}>
      {children}
    </label>
  );
}

function Capsule({ children, theme, className }) {
  return (
    <div
      className={cx("relative h-[52px] rounded-2xl ring-1 overflow-hidden", className)}
      style={{ background: capsuleBg(theme), borderColor: ringColor(theme) }}
    >
      {children}
    </div>
  );
}

/** Input de pesquisa em cápsula */
function SearchCapsule({ value, onChange, placeholder, theme }) {
  const inputRef = useRef(null);

  return (
    <Capsule theme={theme}>
      <span
        className="absolute left-0 top-0 h-full w-[48px] flex items-center justify-center pointer-events-none z-30"
        style={{ color: textMain(theme) }}
      >
        <SearchIcon className="w-4.5 h-4.5" />
      </span>

      <input
        ref={inputRef}
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="absolute inset-0 z-20 pl-[56px] pr-10 bg-transparent outline-none text-sm"
        style={{ color: textMain(theme) }}
      />

      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 rounded p-1 hover:bg-white/10"
          aria-label="Clear"
          title="Clear"
        >
          <X className="w-4 h-4" style={{ color: textMain(theme) }} />
        </button>
      ) : null}
    </Capsule>
  );
}

/** Select em cápsula */
function SelectCapsule({
  value,
  onChange,
  options = [],
  placeholder = "—",
  theme,
  rightChevron = true,
  className = "",
}) {
  const norm = useMemo(
    () =>
      (options || []).map((o, i) => {
        const v = o?.value ?? o?.id ?? i.toString();
        let lbl = o?.label ?? o?.name ?? o?.email ?? "";
        if (o?.isPrimary) lbl = `${lbl} (Primary)`;
        return { val: String(v), label: String(lbl) };
      }),
    [options]
  );

  const current =
    norm.find((o) => o.val === String(value))?.label || placeholder;

  return (
    <Capsule theme={theme} className={className}>
      <div className="absolute inset-0 flex items-center pl-[16px] pr-8 pointer-events-none z-30">
        <span
          className="text-sm truncate w-full"
          style={{ color: textMain(theme) }}
          title={current}
        >
          {current}
        </span>
      </div>

      <select
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="absolute inset-0 z-10 w-full h-full bg-transparent appearance-none outline-none cursor-pointer"
        style={{
          color: "transparent",
          WebkitTextFillColor: "transparent",
          border: "none",
          paddingLeft: "14px",
          paddingRight: "28px",
        }}
        title={current}
      >
        {norm.map((o) => (
          <option
            key={o.val}
            value={o.val}
            style={{ backgroundColor: "rgba(15,23,42,0.95)", color: "#f8fafc" }}
          >
            {o.label}
          </option>
        ))}
        {!norm.some((o) => o.val === String(value)) && (
          <option value="">{placeholder}</option>
        )}
      </select>

      {rightChevron && (
        <ChevronDown
          className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-70 pointer-events-none z-30"
          style={{ color: textMain(theme) }}
        />
      )}
    </Capsule>
  );
}

export default function GenericFilter({
  value = { q: "" },
  onChange = () => {},
  onClear,
  filters = [],
  t,
  theme,
  searchPlaceholder = "Type to search...",
  className = "",
  rightActions = null,
  showToggle = true,
  defaultOpen = true,
  showSearch = false,
}) {
  const safeValue = value ?? { q: "" };
  const [open, setOpen] = useState(!!defaultOpen);
  const btnRef = useRef(null);

  const setField = (key, val) => onChange({ ...safeValue, [key]: val });

  const handleSelect = (key, nextVal, multiple = false) => {
    if (!multiple) return setField(key, nextVal);
    const prev = Array.isArray(safeValue[key]) ? safeValue[key] : [];
    const exists = prev.includes(nextVal);
    const nextArr = exists ? prev.filter((v) => v !== nextVal) : [...prev, nextVal];
    setField(key, nextArr);
  };

  const clearAll = () => {
    const cleared = { q: "" };
    (filters || []).forEach((f) => {
      cleared[f.key] = f.multiple ? [] : f.defaultValue ?? "all";
    });
    onChange(cleared);
  };
  const doClear = () => (typeof onClear === "function" ? onClear() : clearAll());

  const fieldWrap = "flex flex-col gap-1 min-w-[260px] grow basis-[280px]";

  const renderField = (f) => {
    const isMultiple = !!f.multiple;
    const current = safeValue[f.key];

    const wrapCls = f.fullWidth === false ? "flex flex-col gap-1 shrink-0 w-auto" : fieldWrap;

    if (f.type === "custom" && typeof f.render === "function") {
      return (
        <div key={f.key} className={wrapCls}>
          {f.label && <FieldLabel theme={theme}>{f.label}</FieldLabel>}
          <Capsule theme={theme} className="px-2">
            <div className={cx(f.fullWidth === false ? "w-auto" : "w-full")}>
              {f.render(current, (nv) => setField(f.key, nv))}
            </div>
          </Capsule>
        </div>
      );
    }

    if (isMultiple) {
      const arr = Array.isArray(current) ? current : [];
      return (
        <div key={f.key} className={wrapCls}>
          {f.label && <FieldLabel theme={theme}>{f.label}</FieldLabel>}
          <div
            className="rounded-2xl ring-1 p-2 max-h-44 overflow-auto space-y-1"
            style={{ borderColor: ringColor(theme), background: capsuleBg(theme) }}
          >
            {(f.options || []).map((opt) => {
              const checked = arr.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5"
                  title={opt.label}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleSelect(f.key, opt.value, true)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm" style={{ color: textMain(theme) }}>
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div key={f.key} className={wrapCls}>
        {f.label && <FieldLabel theme={theme}>{f.label}</FieldLabel>}
        <SelectCapsule
          value={Array.isArray(current) ? current[0] ?? "" : current ?? ""}
          onChange={(v) => handleSelect(f.key, v, false)}
          options={f.options || []}
          placeholder={f.placeholder || "—"}
          theme={theme}
        />
      </div>
    );
  };

  /* cores do botão Clear por modo */
  const clearBg = isDarkMode(theme)
    ? "rgba(12,22,40,0.82)"      // DARK: mais escuro
    : "rgba(148,163,184,0.34)";  // LIGHT: mais cinzento

  return (
    <div className={cx("w-full", className)}>
      <div className="w-full flex justify-start mb-3 relative z-[5] flex-wrap gap-2">
        {showToggle && (
          <button
            ref={btnRef}
            type="button"
            onClick={() => setOpen((s) => !s)}
            aria-pressed={open}
            className={cx(
              "relative flex items-center justify-between h-[52px] rounded-2xl ring-1 px-4 text-sm font-medium",
              "min-w-[180px]"
            )}
            style={{
              background: capsuleBg(theme),
              borderColor: ringColor(theme),
              color: textMain(theme),
            }}
          >
            <span className="truncate" style={{ color: textMuted(theme) }}>
              {open
                ? t?.("common.hideFilters") || "Filters"
                : t?.("common.showFilters") || "Filters"}
            </span>
            <ChevronDown
              className={`w-4 h-4 ml-2 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
              style={{ color: textMain(theme) }}
            />
          </button>
        )}
        {rightActions}
      </div>

      {open && (
        <div
          role="region"
          aria-label={t ? t("common.filters") : "Filters"}
          className="w-full rounded-3xl ring-1 px-4 py-4"
          style={{ background: paperBg(theme), borderColor: ringColor(theme) }}
        >
          <div
            className="grid gap-3 items-start"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
          >
            {showSearch && (
              <div className={fieldWrap}>

                <SearchCapsule
                  value={safeValue.q ?? ""}
                  onChange={(q) => onChange({ ...safeValue, q })}
                  placeholder={searchPlaceholder}
                  theme={theme}
                />
              </div>
            )}

            {(filters || []).map((f) => renderField(f))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={doClear}
              className="h-11 px-6 rounded-2xl font-medium transition-colors hover:brightness-95 active:brightness-90 shadow-sm"
              style={{
                background: clearBg,
                border: `1px solid ${ringColor(theme)}`,
                color: textMain(theme),
                boxShadow: isDarkMode(theme)
                  ? "inset 0 1px 0 rgba(255,255,255,.03)"
                  : "inset 0 1px 0 rgba(0,0,0,.05)",
              }}
              title={t ? t("common.clear") : "Clear"}
            >
              {t ? t("common.clear") : "Clear"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

GenericFilter.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func,
  onClear: PropTypes.func,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      type: PropTypes.oneOf(["select", "custom"]).isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
      ),
      multiple: PropTypes.bool,
      defaultValue: PropTypes.string,
      fullWidth: PropTypes.bool,
      render: PropTypes.func,
      placeholder: PropTypes.string,
    })
  ),
  t: PropTypes.func,
  theme: PropTypes.object,
  searchPlaceholder: PropTypes.string,
  className: PropTypes.string,
  rightActions: PropTypes.node,
  showToggle: PropTypes.bool,
  defaultOpen: PropTypes.bool,
  showSearch: PropTypes.bool,
};

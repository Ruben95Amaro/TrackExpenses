import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Search, ChevronDown, X } from "lucide-react";
import Button from "../Buttons/Button";

const cx = (...xs) => xs.filter(Boolean).join(" ");
const paperBg = (theme) => theme?.colors?.background?.paper || "transparent";
const ringColor = (theme) =>
  theme?.colors?.secondary?.light || "rgba(148,163,184,0.25)";
const capsuleBg = (theme) =>
  theme?.colors?.glass?.soft || "rgba(148,163,184,0.08)";

export default function GenericFilter({
  value = { q: "" },
  onChange = () => {},
  onClear,
  filters = [],
  t,
  theme,
  searchPlaceholder = "Pesquisar...",
  className = "",
  rightActions = null,
  showToggle = true,
  defaultOpen = true,
  showSearch = false,
}) {
  const safeValue = value ?? { q: "" };
  const [open, setOpen] = useState(!!defaultOpen);
  const btnRef = useRef(null);

  const handleSearch = (e) => onChange({ ...safeValue, q: e.target.value });

  const handleSelect = (key, nextVal, multiple = false) => {
    if (!multiple) return onChange({ ...safeValue, [key]: nextVal });
    const prev = Array.isArray(safeValue[key]) ? safeValue[key] : [];
    const exists = prev.includes(nextVal);
    const nextArr = exists
      ? prev.filter((v) => v !== nextVal)
      : [...prev, nextVal];
    onChange({ ...safeValue, [key]: nextArr });
  };

  const clearAll = () => {
    const cleared = { q: "" };
    (filters || []).forEach((f) => {
      cleared[f.key] = f.multiple ? [] : f.defaultValue ?? "all";
    });
    onChange(cleared);
  };
  const doClear = () => (typeof onClear === "function" ? onClear() : clearAll());

  const activeCount = useMemo(() => {
    let n = 0;
    if (showSearch && safeValue.q?.trim()) n++;
    (filters || []).forEach((f) => {
      const v = safeValue[f.key];
      if (f.multiple) n += Array.isArray(v) ? v.length : 0;
      else if (v && v !== "all") n++;
    });
    return n;
  }, [safeValue, filters, showSearch]);

  const Field = ({ children }) => (
    <div
      className="flex items-center min-w-0 rounded-2xl ring-1 px-3 h-[52px]"
      style={{ background: capsuleBg(theme), borderColor: ringColor(theme) }}
    >
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );

  const SearchBox = (
    <Field>
      <div className="relative w-full">
        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
          <Search className="h-4.5 w-4.5 opacity-70" />
        </span>
        <input
          type="text"
          value={safeValue.q ?? ""}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
          className="w-full h-[44px] pl-8 pr-8 bg-transparent outline-none rounded-xl"
          aria-label={t ? t("common.search") : "Pesquisar"}
        />
        {!!safeValue.q && (
          <button
            type="button"
            onClick={() => onChange({ ...safeValue, q: "" })}
            className="absolute inset-y-0 right-1.5 flex items-center rounded p-1 hover:bg-white/10"
            aria-label={t ? t("common.clear") : "Limpar"}
            title={t ? t("common.clear") : "Limpar"}
          >
            <X className="h-4 w-4 opacity-80" />
          </button>
        )}
      </div>
    </Field>
  );

  const SelectField = (f) => {
    const isMultiple = !!f.multiple;
    const current = safeValue[f.key];

    if (isMultiple) {
      const arr = Array.isArray(current) ? current : [];
      return (
        <div key={f.key} className="w-full">
          {f.label && (
            <div className="text-xs mb-1 opacity-70 select-none">{f.label}</div>
          )}
          <div
            className="rounded-2xl border p-2 max-h-40 overflow-auto space-y-1"
            style={{ borderColor: ringColor(theme), background: capsuleBg(theme) }}
          >
            {(f.options || []).map((opt) => {
              const checked = arr.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleSelect(f.key, opt.value, true)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div key={f.key} className="w-full">
        {f.label && (
          <label className="block text-xs mb-1 opacity-70 select-none">
            {f.label}
          </label>
        )}
        <div
          className="relative rounded-2xl ring-1 h-[52px] flex items-center"
          style={{ background: capsuleBg(theme), borderColor: ringColor(theme) }}
        >
          <select
            value={Array.isArray(current) ? current[0] ?? "" : current ?? ""}
            onChange={(e) => handleSelect(f.key, e.target.value, false)}
            className="appearance-none bg-transparent outline-none w-full h-[44px] px-3 pr-8 rounded-xl truncate"
            style={{ borderRadius: "0.75rem" }}
          >
            {(f.options || []).map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 opacity-70 absolute right-2 pointer-events-none" />
        </div>
      </div>
    );
  };

  return (
    <div className={["w-full", className].join(" ")}>
      <div className="w-full flex justify-start mb-3 relative z-[5] flex-wrap gap-2">
        {showToggle && (
  <button
    ref={btnRef}
    type="button"
    onClick={() => setOpen((s) => !s)}
    aria-pressed={open}
    className={cx(
      "relative flex items-center justify-between w-[220px] h-[52px] rounded-2xl ring-1 px-4 text-sm font-medium text-white transition",
      open ? "bg-white/10" : "bg-white/5 hover:bg-white/10"
    )}
    style={{
      background: capsuleBg(theme),
      borderColor: ringColor(theme),
    }}
  >
    <span className="truncate">
      {open
        ? t?.("common.hideFilters") || "Filters"
        : t?.("common.showFilters") || "Filters"}
    </span>

    <ChevronDown
      className={`w-4 h-4 ml-2 opacity-70 transition-transform ${
        open ? "rotate-180" : ""
      }`}
    />
  </button>
)}
        {rightActions}
      </div>

      {open && (
        <div
          role="region"
          aria-label={t ? t("common.filters") : "Filtros"}
          className="w-full rounded-3xl ring-1 px-4 py-4"
          style={{
            backgroundColor: paperBg(theme),
            borderColor: ringColor(theme),
          }}
        >
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {showSearch && <div className="col-span-full">{SearchBox}</div>}
            {(filters || []).map(SelectField)}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={doClear}
              className="h-11 px-6 rounded-2xl bg-white/80 text-black/90 font-medium"
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
      type: PropTypes.oneOf(["select"]).isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
      ),
      multiple: PropTypes.bool,
      defaultValue: PropTypes.string,
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

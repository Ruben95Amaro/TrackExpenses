import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import PropTypes from "prop-types";
import { Search, ChevronDown, X } from "lucide-react";
import Button from "../Buttons/Button";

export default function GenericFilter({
  value = { q: "" },
  onChange = () => {},
  filters = [],
  t,
  theme,
  searchPlaceholder = "Pesquisar...",
  className = "",
  rightActions = null,
  tableSelector = ".data-table, .table, table",
}) {
  const safeValue = value ?? { q: "" };
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  const handleSearch = (e) => onChange({ ...safeValue, q: e.target.value });

  const handleSelect = (key, nextVal, multiple = false) => {
    if (!multiple) return onChange({ ...safeValue, [key]: nextVal });
    const prev = Array.isArray(safeValue[key]) ? safeValue[key] : [];
    const exists = prev.includes(nextVal);
    const nextArr = exists ? prev.filter((v) => v !== nextVal) : [...prev, nextVal];
    onChange({ ...safeValue, [key]: nextArr });
  };

  const clearAll = () => {
    const cleared = { q: "" };
    (filters || []).forEach((f) => {
      cleared[f.key] = f.multiple ? [] : f.defaultValue ?? "all";
    });
    onChange(cleared);
  };

  const activeCount = useMemo(() => {
    let n = 0;
    if (safeValue.q?.trim()) n++;
    (filters || []).forEach((f) => {
      const v = safeValue[f.key];
      if (f.multiple) n += Array.isArray(v) ? v.length : 0;
      else if (v && v !== "all") n++;
    });
    return n;
  }, [safeValue, filters]);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;

    const panel = panelRef.current;
    const target =
      document.querySelector(tableSelector) ||
      panel.parentElement;

    function syncSize() {
      if (!target) return;
      const tRect = target.getBoundingClientRect();
      const pRect = panel.getBoundingClientRect();

      panel.style.width = `${Math.round(tRect.width)}px`;

      const deltaLeft = Math.round(tRect.left - pRect.left);
      panel.style.marginLeft = `${deltaLeft}px`;
    }

    const ro = new ResizeObserver(syncSize);
    ro.observe(target);
    window.addEventListener("resize", syncSize);
    syncSize();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncSize);
      if (panel) {
        panel.style.width = "";
        panel.style.marginLeft = "";
      }
    };
  }, [open, tableSelector]);

  const SearchBox = (
    <div className="relative w-full">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <Search className="h-5 w-5 opacity-60" />
      </span>
      <input
        type="text"
        value={safeValue.q ?? ""}
        onChange={handleSearch}
        placeholder={searchPlaceholder}
        className="w-full h-11 pl-10 pr-10 rounded-lg border"
        style={{
          backgroundColor: theme?.colors?.background?.paper,
          borderColor: "rgba(255,255,255,0.15)",
        }}
      />
      {!!safeValue.q && (
        <button
          type="button"
          onClick={() => onChange({ ...safeValue, q: "" })}
          className="absolute inset-y-0 right-2 flex items-center rounded p-1 hover:bg-white/10"
          aria-label={t ? t("common.clear") : "Limpar"}
          title={t ? t("common.clear") : "Limpar"}
        >
          <X className="h-4 w-4 opacity-80" />
        </button>
      )}
    </div>
  );

  const SelectField = (f) => {
    const isMultiple = !!f.multiple;
    const current = safeValue[f.key];

    if (isMultiple) {
      const arr = Array.isArray(current) ? current : [];
      return (
        <div key={f.key} className="w-full">
          {f.label && <div className="text-xs mb-1 opacity-70 select-none">{f.label}</div>}
          <div
            className="rounded-lg border p-2 max-h-40 overflow-auto space-y-1"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            {(f.options || []).map((opt) => {
              const checked = arr.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5">
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
        {f.label && <label className="block text-xs mb-1 opacity-70 select-none">{f.label}</label>}
        <select
          value={Array.isArray(current) ? current[0] ?? "" : current ?? ""}
          onChange={(e) => handleSelect(f.key, e.target.value, false)}
          className="w-full h-11 px-3 rounded-lg border bg-transparent"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
        >
          {(f.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className={["w-full", className].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col items-start">
          <Button
            ref={btnRef}
            variant="secondary"
            onClick={() => setOpen((v) => !v)}
            className="!px-4 h-11 inline-flex items-center gap-2"
            aria-expanded={open}
            aria-haspopup="region"
          >
            {t ? t("common.filters") : "Filtros"}
            {activeCount > 0 && (
  <span
    className="ml-1 inline-flex items-center justify-center rounded-full text-xs px-2 h-5"
    style={{ background: "rgba(255,255,255,0.8)", color: "#000" }}
  >
    {activeCount}
  </span>
)}
            <ChevronDown className={`w-4 h-4 transition ${open ? "rotate-180" : ""}`} />
          </Button>

          {open && (
            <div
              ref={panelRef}
              role="region"
              aria-label={t ? t("common.filters") : "Filtros"}
              className="
                mt-2 w-full rounded-2xl border shadow-lg px-4 py-4
                [grid-column:1/-1]  /* caso o pai seja grid, ocupa a linha toda */
              "
              style={{
                backgroundColor: theme?.colors?.background?.paper,
                borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                <div className="col-span-full">{SearchBox}</div>

                {(filters || []).map(SelectField)}

                <div className="col-span-full flex items-center justify-end gap-2 pt-1">
                  <Button variant="secondary" onClick={clearAll} className="!px-4 h-10">
                    {t ? t("common.clear") : "Limpar"}
                  </Button>
                  <Button variant="primary" onClick={() => setOpen(false)} className="!px-4 h-10">
                    {t ? t("common.apply") : "Aplicar"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {rightActions}
      </div>
    </div>
  );
}

GenericFilter.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func,
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
  tableSelector: PropTypes.string,
};

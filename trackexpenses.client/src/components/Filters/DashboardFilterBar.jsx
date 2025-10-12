// src/components/Filters/DashboardFilterBar.jsx
import React, { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown, Search, X, UserRound, Wallet2, Calendar } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";

const cx = (...xs) => xs.filter(Boolean).join(" ");

const paperBg = (theme) => theme?.colors?.background?.paper || "transparent";
const ringColor = (theme) => theme?.colors?.secondary?.light || "rgba(148,163,184,0.25)";
const capsuleBg = (theme) => theme?.colors?.glass?.soft || "rgba(148,163,184,0.08)";
const primaryMain = (theme) => theme?.colors?.primary?.main || "#4f8df9";
const palette = (theme) => ({
  paper: paperBg(theme),
  ring: ringColor(theme),
  capsule: capsuleBg(theme),
  primary: primaryMain(theme),
  text: theme?.colors?.text?.primary || "#ffffff",
  textMuted: theme?.colors?.text?.secondary || "rgba(255,255,255,0.85)",
  clearBg: "rgba(255,255,255,0.80)",
  clearFg: "#111827",
  applyShadow: "0 6px 14px rgba(99,91,255,0.35)",
});

const toISO = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const fmtPT = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

/* ========= SUB-COMPONENTES ========= */

function SelectCapsule({
  value,
  onChange,
  options,
  label,
  Icon,
  placeholder = "—",
  theme,
}) {
  const colors = palette(theme);

  const norm = useMemo(() => {
    return (options || []).map((o, i) => {
      const v = o?.id ?? o?.Id ?? o?.value ?? o?.Value ?? i.toString();
      let lbl =
        o?.name ??
        o?.Name ??
        o?.label ??
        o?.Label ??
        o?.email ??
        o?.Email ??
        "";
      if (o?.isPrimary) lbl = `${lbl} (Primary)`;
      return { val: String(v), label: String(lbl) };
    });
  }, [options]);

  const currentLabel =
    norm.find((o) => o.val === String(value))?.label || placeholder;

  return (
    <div className="flex flex-col gap-1 min-w-[260px]">
      {label && (
        <label className="text-xs select-none" style={{ color: colors.textMuted }}>
          {label}
        </label>
      )}
      <div
        className="relative h-[52px] rounded-2xl ring-1 overflow-hidden"
        style={{ background: colors.capsule, borderColor: colors.ring }}
      >
        {Icon && (
          <span
            className="absolute left-0 top-0 h-full w-[48px] flex items-center justify-center pointer-events-none z-30"
            style={{ color: colors.text }}
          >
            <Icon className="w-4.5 h-4.5" />
          </span>
        )}

        {/* Overlay visível */}
        <div className="absolute inset-0 z-30 flex items-center pl-[56px] pr-8 pointer-events-none">
          <span className="text-sm truncate w-full" style={{ color: colors.text }}>
            {currentLabel}
          </span>
        </div>

        {/* select por baixo (interativo) */}
        <select
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="relative z-10 block w-full h-full pl-[56px] pr-8 outline-none bg-transparent appearance-none cursor-pointer"
          style={{
            color: "transparent",
            WebkitTextFillColor: "transparent",
            backgroundColor: "transparent",
            border: "none",
          }}
          aria-label={label}
          title={currentLabel}
        >
          {norm.map((opt) => (
            <option
              key={opt.val}
              value={opt.val}
              style={{ backgroundColor: "rgba(15,23,42,0.95)", color: "#f8fafc" }}
            >
              {opt.label}
            </option>
          ))}
          {!norm.some((o) => o.val === String(value)) && (
            <option value="">{placeholder}</option>
          )}
        </select>

        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-70 pointer-events-none z-30"
          style={{ color: colors.text }}
        />
      </div>
    </div>
  );
}

function DateCapsule({ value, onChange, label, theme }) {
  const colors = palette(theme);
  const inputRef = useRef(null);
  const iso = toISO(value);
  const display = fmtPT(iso);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  return (
    <div className="flex flex-col gap-1 min-w-[260px]">
      {label && (
        <label className="text-xs select-none" style={{ color: colors.textMuted }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={openPicker}
        className="relative h-[52px] rounded-2xl ring-1 w-full"
        style={{ background: colors.capsule, borderColor: colors.ring }}
      >
        <span
          className="absolute left-0 top-0 h-full w-[48px] flex items-center justify-center pointer-events-none z-30"
          style={{ color: colors.text }}
        >
          <Calendar className="w-4.5 h-4.5" />
        </span>

        <span
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none text-sm"
          style={{ color: colors.text }}
        >
          {display || "—"}
        </span>

        <input
          ref={inputRef}
          type="date"
          value={iso}
          onChange={(e) => onChange?.(e.target.value)}
          className="absolute inset-0 z-10 opacity-0 cursor-pointer"
          aria-label={label}
        />
      </button>
    </div>
  );
}

function Segmented({ value, onChange, options, theme }) {
  const colors = palette(theme);
  return (
    <div
      className="w-full rounded-2xl h-[52px] px-3 py-[8px] grid"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))`,
        background: colors.capsule,
        border: `1px solid ${colors.ring}`,
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="mx-1 rounded-xl h-[36px] px-5 text-sm font-medium min-w-0 truncate transition"
            style={{
              color: active ? "#fff" : colors.textMuted,
              background: active ? colors.primary : "transparent",
              boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.20)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ========= PRINCIPAL ========= */

export default function DashboardFilterBar({
  value = {},                 // <- default seguro
  onChange,
  onSearch,
  onClear,
  loading,
  t,
  showToggle = true,
  defaultOpen = false,
  options = { users: [], wallets: [] },
}) {
  const { theme } = useTheme();
  const colors = palette(theme);

  // inicia sempre fechado
  const [open, setOpen] = useState(false);

  // alias seguro para evitar acessos nulos
  const v = value || {};

  const txt = {
    filters: t?.("common.filters") || "Filters",
    user: t?.("dashboard.filters.user") || "User",
    wallet: t?.("dashboard.filters.wallet") || "Wallet",
    from: t?.("dashboard.filters.from") || "From",
    to: t?.("dashboard.filters.to") || "To",
    day: t?.("dashboard.filters.day") || "Day",
    week: t?.("dashboard.filters.week") || "Week",
    month: t?.("dashboard.filters.month") || "Month",
    both: t?.("dashboard.filters.both") || "Income & Expenses",
    incOnly: t?.("dashboard.filters.incomeOnly") || "Income only",
    expOnly: t?.("dashboard.filters.expenseOnly") || "Expenses only",
    clear: t?.("common.clear") || "Clear",
    apply: t?.("common.apply") || "Apply",
    allWallets: t?.("dashboard.filters.allWallets") || "All wallets",
    selectUser: t?.("common.selectUser") || "Select user",
  };

  const showUser = Array.isArray(options.users) && options.users.length > 0;
  const usersOpts = useMemo(() => (showUser ? options.users : []), [showUser, options.users]);

  const walletsOpts = useMemo(
    () => [{ id: "__ALL__", name: txt.allWallets }, ...(options.wallets || [])],
    [options.wallets, txt.allWallets]
  );

  const setPatch = (patch) => onChange?.(patch);

  // Validação de intervalo (usa v.* para estar protegido)
  const setFromSafe = (nextFromISO) => {
    const to = v.to ? toISO(v.to) : "";
    let safeFrom = nextFromISO || "";
    if (to && safeFrom && safeFrom > to) safeFrom = to;
    setPatch({ from: safeFrom });
  };

  const setToSafe = (nextToISO) => {
    const from = v.from ? toISO(v.from) : "";
    let safeTo = nextToISO || "";
    if (from && safeTo && safeTo < from) safeTo = from;
    setPatch({ to: safeTo });
  };

  return (
    <div className="w-full">
      <div className="w-full flex justify-start mb-3 flex-wrap gap-2">
        {showToggle && (
          <div
            className="h-[52px] rounded-2xl px-5 flex items-center text-sm font-medium min-w-[180px] ring-1"
            style={{ background: colors.capsule, borderColor: colors.ring, color: colors.text }}
          >
            <span className="truncate" style={{ color: colors.textMuted }}>
              {txt.filters}
            </span>
            <button
              onClick={() => setOpen((s) => !s)}
              className="ml-auto inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10 transition"
            >
              <ChevronDown
                className={cx("w-4 h-4 opacity-80 transition-transform", open ? "rotate-180" : "")}
                style={{ color: colors.text }}
              />
            </button>
          </div>
        )}
      </div>

      {!open ? null : (
        <div
          className="rounded-2xl px-5 py-4 ring-1"
          style={{ background: colors.paper, borderColor: colors.ring }}
        >
          {/* Linha 1 */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
          >
            {showUser && (
              <SelectCapsule
                value={v.userId ?? ""}
                onChange={(val) => setPatch({ userId: val, walletId: "" })}
                options={usersOpts}
                label={txt.user}
                Icon={UserRound}
                placeholder={txt.selectUser}
                theme={theme}
              />
            )}

            <SelectCapsule
              value={!v.walletId ? "__ALL__" : String(v.walletId)}
              onChange={(val) => setPatch({ walletId: val === "__ALL__" ? "" : val })}
              options={walletsOpts.map((w) => ({ id: w.id, name: w.name, isPrimary: w.isPrimary }))}
              label={txt.wallet}
              Icon={Wallet2}
              placeholder={txt.allWallets}
              theme={theme}
            />

            <DateCapsule value={v.from} onChange={setFromSafe} label={txt.from} theme={theme} />
            <DateCapsule value={v.to}   onChange={setToSafe}   label={txt.to}   theme={theme} />
          </div>

          {/* Linha 2 */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Segmented
              value={v.granularity}
              onChange={(val) => setPatch({ granularity: val })}
              options={[
                { value: "day", label: txt.day },
                { value: "week", label: txt.week },
                { value: "month", label: txt.month },
              ]}
              theme={theme}
            />
            <Segmented
              value={v.type}
              onChange={(val) => setPatch({ type: val })}
              options={[
                { value: "both", label: txt.both },
                { value: "income", label: txt.incOnly },
                { value: "expense", label: txt.expOnly },
              ]}
              theme={theme}
            />
          </div>

          {/* Linha 3 */}
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClear}
              disabled={loading}
              className="h-11 px-6 rounded-2xl font-medium flex items-center gap-2"
              style={{ background: colors.clearBg, color: colors.clearFg }}
            >
              <X className="w-4 h-4" />
              {txt.clear}
            </button>
            <button
              type="button"
              onClick={onSearch}
              disabled={loading}
              className="h-11 px-7 rounded-2xl font-medium flex items-center gap-2 disabled:opacity-60"
              style={{ background: colors.primary, color: "#fff", boxShadow: colors.applyShadow }}
            >
              <Search className="w-4 h-4" />
              {txt.apply}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

DashboardFilterBar.propTypes = {
  value: PropTypes.object,            // agora opcional
  onChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  onClear: PropTypes.func,
  loading: PropTypes.bool,
  t: PropTypes.func,
  showToggle: PropTypes.bool,
  defaultOpen: PropTypes.bool,
  options: PropTypes.shape({
    users: PropTypes.array,
    wallets: PropTypes.array,
  }),
};

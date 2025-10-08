import React, { useMemo, useState } from "react";
import {
  Calendar,
  Users as UsersIcon,
  Wallet as WalletIcon,
  LayoutGrid as GroupsIcon,
  ChevronDown,
  Search as SearchIcon,
  X as XIcon,
} from "lucide-react";

const toISO = (d) => {
  if (!d) return "";
  const dd = d instanceof Date ? d : new Date(d);
  return Number.isNaN(+dd) ? "" : dd.toISOString().slice(0, 10);
};
const cx = (...xs) => xs.filter(Boolean).join(" ");

function Field({ icon: Icon, children, className = "", tone }) {
  const bg = tone?.bg ?? "rgba(148,163,184,0.08)";
  const border = tone?.border ?? "rgba(148,163,184,0.25)";
  return (
    <div
      className={cx(
        "flex items-center gap-2 min-w-0 rounded-2xl px-3 py-2 h-[52px] ring-1",
        className
      )}
      style={{ background: bg, borderColor: border }}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 opacity-80" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function FancySelect({ value, onChange, options = [], placeholder = "—" }) {
  const norm = useMemo(
    () =>
      (options || []).map((o) => {
        const v = o?.value ?? o?.id ?? "";
        let label = o?.label ?? o?.name ?? "";
        if (o?.isPrimary) label += " (Primary)";
        return { value: String(v), label };
      }),
    [options]
  );
  const current = norm.find((o) => o.value === String(value))?.label || "";

  return (
    <div className="relative min-w-0">
      <select
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="appearance-none bg-transparent outline-none w-full truncate pr-8 rounded-xl h-10"
        title={current || placeholder}
        style={{
          borderRadius: "0.75rem",
          padding: "6px 10px",
          backgroundColor: "transparent",
        }}
      >
        {norm.map((o) => (
          <option
            key={o.value}
            value={o.value}
            title={o.label}
            style={{
              borderRadius: "0.75rem",
              padding: "6px 10px",
              backgroundColor: "#1e293b",
              color: "#f1f5f9",
            }}
          >
            {o.label}
          </option>
        ))}
        <option value="">{placeholder}</option>
      </select>

      <ChevronDown
        className="w-4 h-4 opacity-70 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

function Segmented({ items, value, onChange, tone }) {
  const border = tone?.border ?? "rgba(148,163,184,0.25)";
  return (
    <div
      className="rounded-2xl p-1 ring-1 grid"
      style={{
        gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))`,
        borderColor: border,
      }}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange?.(it.value)}
            className={cx(
              "h-12 rounded-xl px-4 text-sm font-medium truncate transition",
              active
                ? "bg-[#5B5BF5] text-white"
                : "bg-transparent text-white/85 hover:bg-white/10"
            )}
            title={typeof it.label === "string" ? it.label : undefined}
          >
            <span className="block truncate">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function DashboardFilterBar({
  value,
  onChange,
  onSearch,
  onClear,
  loading = false,
  options = {},
  t,
  tone = {},
  defaultOpen = true,
  hideToggle = false,
  className = "",
}) {
  const v = value ?? {};
  const set = (patch) => onChange?.(patch);

  const groups = Array.isArray(options.groups) ? options.groups : [];
  const users = Array.isArray(options.users) ? options.users : [];
  const wallets = Array.isArray(options.wallets) ? options.wallets : [];

  const bg = tone?.bg ?? "rgba(148,163,184,0.08)";
  const border = tone?.border ?? "rgba(148,163,184,0.25)";

  const [open, setOpen] = useState(!!defaultOpen);

  const toggleLabel = open
    ? t?.("common.hideFilters") || "Hide filters"
    : t?.("common.showFilters") || "Show filters";

  return (
    <div className={cx("w-full", className)}>
{!hideToggle && (
  <div className="w-full flex justify-start mb-3 relative z-[5]">
    <button
      type="button"
      onClick={() => setOpen((s) => !s)}
      aria-pressed={open}
      className={cx(
        "relative min-w-[240px] h-[52px] rounded-2xl ring-1 px-4",
        "flex items-center justify-between text-white font-semibold tracking-tight transition"
      )}
      style={{ background: bg, borderColor: border }}
    >
      <span className="truncate text-[0.95rem] leading-none flex-1 text-left">
        {toggleLabel || "Filters"}
      </span>

      <ChevronDown
        className={cx(
          "w-4 h-4 opacity-80 pointer-events-none transition-transform duration-200 ml-2",
          "relative top-[1px]", 
          open ? "rotate-180" : ""
        )}
      />
    </button>
  </div>
)}


      <div
        className={cx(
          "transition-[max-height,opacity] duration-300",
          open ? "max-h-[100rem] opacity-100 pt-1" : "max-h-0 opacity-0"
        )}
        style={{ overflow: open ? "visible" : "hidden" }}
      >
        <div
          className="rounded-3xl p-4 ring-1 relative z-[1]"
          style={{ background: bg, borderColor: border }}
        >
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            {groups.length > 0 && (
              <Field icon={GroupsIcon} tone={{ bg, border }}>
                <FancySelect
                  value={v.groupId || ""}
                  onChange={(val) =>
                    set({ groupId: val, userId: "", walletId: "" })
                  }
                  options={groups}
                  placeholder={t?.("common.selectGroup") || "Select group"}
                />
              </Field>
            )}

            {users.length > 0 && (
              <Field icon={UsersIcon} tone={{ bg, border }}>
                <FancySelect
                  value={v.userId || ""}
                  onChange={(val) => set({ userId: val, walletId: "" })}
                  options={users}
                  placeholder={t?.("common.selectUser") || "Select user"}
                />
              </Field>
            )}

            {wallets.length > 0 && (
              <Field icon={WalletIcon} tone={{ bg, border }}>
                <FancySelect
                  value={v.walletId || ""}
                  onChange={(val) => set({ walletId: val })}
                  options={wallets}
                  placeholder={
                    t?.("dashboard.filters.wallet_all") || "All wallets"
                  }
                />
              </Field>
            )}

            <Field icon={Calendar} tone={{ bg, border }}>
              <input
                type="date"
                value={toISO(v.from)}
                onChange={(e) => set({ from: e.target.value })}
                className="bg-transparent outline-none w-full h-11 text-[0.95rem]"
              />
            </Field>

            <Field icon={Calendar} tone={{ bg, border }}>
              <input
                type="date"
                value={toISO(v.to)}
                onChange={(e) => set({ to: e.target.value })}
                className="bg-transparent outline-none w-full h-11 text-[0.95rem]"
              />
            </Field>
          </div>

          <div
            className="mt-3 grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            <Segmented
              items={[
                {
                  value: "day",
                  label: t?.("dashboard.filters.day") || "Day",
                },
                {
                  value: "week",
                  label: t?.("dashboard.filters.week") || "Week",
                },
                {
                  value: "month",
                  label: t?.("dashboard.filters.month") || "Month",
                },
              ]}
              value={v.granularity || "month"}
              onChange={(val) => set({ granularity: val })}
              tone={{ border }}
            />
            <Segmented
              items={[
                {
                  value: "both",
                  label:
                    t?.("dashboard.filters.type_both") || "Income & Expenses",
                },
                {
                  value: "income",
                  label:
                    t?.("dashboard.filters.type_income") || "Income only",
                },
                {
                  value: "expense",
                  label:
                    t?.("dashboard.filters.type_expense") || "Expenses only",
                },
              ]}
              value={v.type || "both"}
              onChange={(val) => set({ type: val })}
              tone={{ border }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={() => onClear?.()}
              className="h-11 px-5 rounded-2xl bg-white/80 text-black/90 flex items-center gap-2"
            >
              <XIcon className="w-4 h-4" />
              <span>{t?.("common.clear") || "Clear"}</span>
            </button>
            <button
              type="button"
              onClick={() => onSearch?.()}
              disabled={loading}
              className={cx(
                "h-11 px-5 rounded-2xl flex items-center gap-2",
                "bg-[#5B5BF5] text-white font-medium",
                "disabled:opacity-70 disabled:cursor-not-allowed"
              )}
            >
              <SearchIcon className="w-5 h-5" />
              <span>{t?.("common.apply") || "Apply"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

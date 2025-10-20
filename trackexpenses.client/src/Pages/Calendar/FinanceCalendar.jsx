import React, { useEffect, useMemo, useState, useContext } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addDays,
} from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

import Title from "../../components/Titles/TitlePage";
import GenericFilter from "../../components/Tables/GenericFilter";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

/* ==================== Helpers ==================== */
const EP_E_LIST = "Expenses/ListExpenses";
const EP_R_LIST = "Earnings/ListEarnings";
const EP_WALLETS = "/wallets?includeArchived=true";

const unwrap = (v) => (Array.isArray(v) ? v : v?.$values ?? []);
const N = (v) => (v ?? "").toString().trim();
const money = (n) =>
  Number(n || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: {},
});

const tt = (t, key, fallback) => {
  const v = t?.(key);
  return !v || v === key ? fallback : v;
};

function parseToRGB(c) {
  if (!c || typeof c !== "string") return { r: 11, g: 18, b: 32 };
  if (c.startsWith("#")) {
    const h = c.slice(1);
    const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
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

/* ==================== Responsivo ==================== */
function useIsMobile(bp = 520) {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width:${bp}px)`).matches
      : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width:${bp}px)`);
    const handler = (e) => setMobile(e.matches);
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, [bp]);
  return mobile;
}

/* ==================== Dots ==================== */
function DayCellIndicators({ children, eventsForDay, colors }) {
  const hasExpense = eventsForDay.some((e) => e.kind === "expense");
  const hasEarning = eventsForDay.some((e) => e.kind === "earning");
  const size = "clamp(10px, 0.9vw, 14px)";

  const Dot = ({ bg }) => (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        background: bg,
        borderRadius: "9999px",
        boxShadow: `0 0 0 2px ${colors.dotRingInset} inset, 0 0 0 2px ${colors.dotRing}`,
      }}
    />
  );

  return (
    <div className="relative h-full w-full">
      {children}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5"
        style={{ transform: "translateY(-4px)" }}
      >
        {hasExpense && <Dot bg={colors.expenseDot} />}
        {hasEarning && <Dot bg={colors.incomeDot} />}
      </div>
    </div>
  );
}

/* ==================== Drawer ==================== */
function DayDrawer({ open, onClose, date, items, colors, t, monthName }) {
  if (!open) return null;

  const expenses = items.filter((x) => x.kind === "expense");
  const earnings = items.filter((x) => x.kind === "earning");
  const total = (list) => list.reduce((s, x) => s + Number(x.amount || 0), 0);

  const FG = colors.border; 
  const subtle = (hex, alpha = 0.2) =>
    hex.startsWith("#")
      ? `${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`
      : hex;

  const RowItem = ({ title, amount, accent, borderSoft }) => (
    <li
      className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 transition-all"
      style={{
        background: colors.rowBg,
        border: `2px solid ${subtle(borderSoft, 0.5)}`,
        outline: `2px solid ${subtle(FG, 0.25)}`,
        color: colors.text,
      }}
    >
      <span className="min-w-0 flex items-center gap-2 truncate">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
          style={{ background: accent, boxShadow: `0 0 0 2px ${subtle(FG, 0.25)}` }}
        />
        <span className="truncate">{title}</span>
      </span>
      <span className="ml-3 tabular-nums font-semibold">{money(amount)}</span>
    </li>
  );

  const Section = ({ title, color, list, emptyText, borderSoft }) => (
    <section className="mb-5 last:mb-0">
      <div className="mb-2.5 flex items-center justify-between" style={{ color: colors.text }}>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
          <h4 className="font-semibold text-[15px]">{title}</h4>
        </div>
        {list.length > 0 && <span className="tabular-nums font-semibold">{money(total(list))}</span>}
      </div>

      {list.length === 0 ? (
        <div className="text-sm" style={{ color: colors.textSoft }}>
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((e) => (
            <RowItem
              key={e.id}
              title={N(e.title) || title}
              amount={e.amount}
              accent={color}
              borderSoft={borderSoft}
            />
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div
        className="relative max-h-[86vh] w-[min(820px,96vw)] overflow-auto rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        style={{
          background: colors.drawerBg,
          border: `2px solid ${FG}`,
          color: colors.text,
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          className="sticky top-0 z-10 px-5 py-4 md:px-6 md:py-5"
          style={{
            background: colors.headerBarBg,
            color: colors.headerTitle,
            borderBottom: `2px solid ${FG}`,
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[clamp(18px,1.1rem,22px)] tracking-tight">
              {`${date.getDate()} ${monthName(date.getMonth())} ${date.getFullYear()}`}
            </h3>
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm"
              style={{ background: colors.primary, color: colors.onPrimary, border: `2px solid ${FG}` }}
            >
              {tt(t, "common.close", "Fechar")}
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6" style={{ background: colors.drawerInner }}>
          <Section
            title={tt(t, "expenses.title", "Despesas")}
            color={colors.expenseDot}
            list={expenses}
            emptyText={tt(t, "expenses.none", "Sem despesas neste dia.")}
            borderSoft={colors.expenseSoftBorder}
          />
          <div className="my-5 border-t" style={{ borderColor: subtle(FG, 0.35), borderTopWidth: 2 }} />
          <Section
            title={tt(t, "earnings.title", "Receitas")}
            color={colors.incomeDot}
            list={earnings}
            emptyText={tt(t, "earnings.none", "Sem receitas neste dia.")}
            borderSoft={colors.incomeSoftBorder}
          />
        </div>
      </div>
    </div>
  );
}

/* ==================== Toolbars ==================== */
function ToolbarDesktop({ date, onNavigate, colors, t, monthName }) {
  const monthIdx = date.getMonth();
  const year = date.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => monthName(i));
  const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);
  const jumpTo = (m, y) => onNavigate("DATE", new Date(y, m, 1));

  const optDark = { background: "#0f172a", color: "#E3EDFF" };
  const optLight = { background: "#fff", color: "#0b2540" };

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-3 mb-4"
      style={{
        background: colors.toolbarBg,
        border: `2px solid ${colors.border}`,
        borderRadius: colors.radius,
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate("TODAY")}
          className="h-10 px-3 rounded-xl font-semibold whitespace-nowrap"
          style={{ color: colors.headerTitle, border: `2px solid ${colors.border}` }}
        >
          {tt(t, "common.today", "Hoje")}
        </button>

        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `2px solid ${colors.border}` }}>
          <button onClick={() => onNavigate("PREV")} className="h-10 px-3" style={{ color: colors.headerTitle }} aria-label={tt(t, "common.prev", "Anterior")}>‹</button>
          <span className="w-px self-stretch" style={{ background: colors.border }} />
          <button onClick={() => onNavigate("NEXT")} className="h-10 px-3" style={{ color: colors.headerTitle }} aria-label={tt(t, "common.next", "Seguinte")}>›</button>
        </div>
      </div>

      <div className="text-lg font-extrabold tracking-wide uppercase text-center flex-grow text-nowrap" style={{ color: colors.headerTitle, minWidth: 120 }}>
        {`${monthName(monthIdx)} ${year}`.toUpperCase()}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={monthIdx}
          onChange={(e) => jumpTo(Number(e.target.value), year)}
          className="h-10 max-w-[140px] px-3 rounded-xl text-sm appearance-none"
          style={{ background: "transparent", color: colors.headerTitle, border: `2px solid ${colors.border}` }}
          aria-label={tt(t, "calendar.month", "Mês")}
        >
          {months.map((m, i) => (
            <option key={i} value={i} style={colors.isDark ? optDark : optLight}>
              {m[0]?.toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => jumpTo(monthIdx, Number(e.target.value))}
          className="h-10 max-w-[96px] px-3 rounded-xl text-sm appearance-none"
          style={{ background: "transparent", color: colors.headerTitle, border: `2px solid ${colors.border}` }}
          aria-label={tt(t, "calendar.year", "Ano")}
        >
          {years.map((y) => (
            <option key={y} value={y} style={colors.isDark ? optDark : optLight}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ToolbarMobile({ date, setDate, colors, t, monthName }) {
  const optDark = { background: "#0f172a", color: "#E3EDFF" };
  const optLight = { background: "#fff", color: "#0b2540" };

  return (
    <div className="sm:hidden mb-3">
      <div
        className="flex items-center justify-between gap-2 px-3 py-2.5"
        style={{ background: colors.toolbarBg, border: `2px solid ${colors.border}`, borderRadius: colors.radius }}
      >
        <button
          onClick={() => setDate(new Date())}
          className="h-11 px-3 rounded-xl font-semibold"
          style={{ color: colors.headerTitle, border: `2px solid ${colors.border}` }}
        >
          {tt(t, "common.today", "Hoje")}
        </button>

        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `2px solid ${colors.border}` }}>
          <button onClick={() => setDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="h-11 px-3" style={{ color: colors.headerTitle }} aria-label={tt(t, "common.prev", "Anterior")}>‹</button>
          <span className="w-px self-stretch" style={{ background: colors.border }} />
          <button onClick={() => setDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="h-11 px-3" style={{ color: colors.headerTitle }} aria-label={tt(t, "common.next", "Seguinte")}>›</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <select
          value={date.getMonth()}
          onChange={(e) => setDate(new Date(date.getFullYear(), Number(e.target.value), 1))}
          className="h-11 px-3 rounded-xl text-sm w-full appearance-none"
          style={{ background: "transparent", color: colors.headerTitle, border: `2px solid ${colors.border}` }}
          aria-label={tt(t, "calendar.month", "Mês")}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i} style={colors.isDark ? optDark : optLight}>
              {monthName(i)}
            </option>
          ))}
        </select>
        <select
          value={date.getFullYear()}
          onChange={(e) => setDate(new Date(Number(e.target.value), date.getMonth(), 1))}
          className="h-11 px-3 rounded-xl text-sm w-full appearance-none"
          style={{ background: "transparent", color: colors.headerTitle, border: `2px solid ${colors.border}` }}
          aria-label={tt(t, "calendar.year", "Ano")}
        >
          {Array.from({ length: 11 }, (_, i) => date.getFullYear() - 5 + i).map((y) => (
            <option key={y} value={y} style={colors.isDark ? optDark : optLight}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ==================== Lista mensal (mobile) ==================== */
function MobileMonthList({ date, getEventsFor, colors, onPickDay, weekdayName }) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="divide-y" style={{ borderTop: `2px solid ${colors.border}` }}>
      {days.map((d) => {
        const items = getEventsFor(d);
        const sumExp = items.filter((i) => i.kind === "expense").reduce((s, x) => s + (x.amount || 0), 0);
        const sumInc = items.filter((i) => i.kind === "earning").reduce((s, x) => s + (x.amount || 0), 0);
        const isToday = isSameDay(new Date(), d);

        return (
          <button
            key={d.toISOString()}
            onClick={() => onPickDay(d)}
            className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
            style={{
              background: isToday ? colors.todayBg : "transparent",
              boxShadow: isToday ? `inset 0 0 0 2px ${colors.borderFocus}` : "none",
              color: colors.text,
            }}
          >
            <div className="min-w-0">
              <div className="text-[13px] uppercase opacity-80">{weekdayName(getDay(d))}</div>
              <div className="text-[clamp(18px,1.1rem,22px)] font-semibold">{String(d.getDate()).padStart(2, "0")}</div>
            </div>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <div className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors.expenseDot }} />
                <span className="tabular-nums">{sumExp > 0 ? money(sumExp) : "-"}</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors.incomeDot }} />
                <span className="tabular-nums">{sumInc > 0 ? money(sumInc) : "-"}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ==================== Página ==================== */
export default function FinanceCalendar() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth } = useContext(AuthContext) || {};
  const isLogged = Boolean(auth?.Email);
  const isMobile = useIsMobile(520);

  const bgPaper = theme?.colors?.background?.paper;
  const isDark = isDarkColor(bgPaper);
  const FG = isDark ? "#FFFFFF" : "#000000";
  const BORDER_W = 2; 

  const I18N = useMemo(() => {
    const months = [
      tt(t, "calendar.months.january", "janeiro"),
      tt(t, "calendar.months.february", "fevereiro"),
      tt(t, "calendar.months.march", "março"),
      tt(t, "calendar.months.april", "abril"),
      tt(t, "calendar.months.may", "maio"),
      tt(t, "calendar.months.june", "junho"),
      tt(t, "calendar.months.july", "julho"),
      tt(t, "calendar.months.august", "agosto"),
      tt(t, "calendar.months.september", "setembro"),
      tt(t, "calendar.months.october", "outubro"),
      tt(t, "calendar.months.november", "novembro"),
      tt(t, "calendar.months.december", "dezembro"),
    ];
    const weekdays = [
      tt(t, "calendar.weekdays.sun", "domingo"),
      tt(t, "calendar.weekdays.mon", "segunda-feira"),
      tt(t, "calendar.weekdays.tue", "terça-feira"),
      tt(t, "calendar.weekdays.wed", "quarta-feira"),
      tt(t, "calendar.weekdays.thu", "quinta-feira"),
      tt(t, "calendar.weekdays.fri", "sexta-feira"),
      tt(t, "calendar.weekdays.sat", "sábado"),
    ];
    return { months, weekdays };
  }, [t]);

  const monthName = (i) => I18N.months[i] || "";
  const weekdayName = (i0Sun) => I18N.weekdays[i0Sun] || "";

  const colors = isDark
    ? {
        isDark: true,
        radius: "20px",
        border: FG,
        borderFocus: FG,
        toolbarBg: "linear-gradient(180deg, rgba(147,197,253,0.14) 0%, rgba(147,197,253,0.09) 100%)",
        headerBarBg: "linear-gradient(180deg, rgba(147,197,253,0.14) 0%, rgba(147,197,253,0.09) 100%)",
        headerTitle: FG,
        drawerBg: "rgba(8,12,22,0.9)",
        drawerInner: "rgba(8,12,22,0.7)",
        text: "#EAF2FF",
        textSoft: "#C7D3EA",
        rowBg: "rgba(255,255,255,0.05)",
        headerBg: "linear-gradient(180deg, rgba(147,197,253,0.14) 0%, rgba(147,197,253,0.09) 100%)",
        headerText: FG,
        todayBg: "rgba(93,127,255,0.28)",
        offRangeBg: "rgba(255,255,255,0.02)",
        offRangeText: FG,
        expenseDot: "#ef4444",
        incomeDot: "#22c55e",
        expenseSoftBorder: "rgba(239,68,68,0.55)",
        incomeSoftBorder: "rgba(34,197,94,0.55)",
        dotRing: "rgba(255,255,255,.36)",
        dotRingInset: "rgba(0,0,0,.36)",
        primary: "#2563EB",
        onPrimary: "#fff",
      }
    : {
        isDark: false,
        radius: "20px",
        border: FG,
        borderFocus: FG,
        toolbarBg: "linear-gradient(180deg, rgba(147,197,253,0.35) 0%, rgba(147,197,253,0.22) 100%)",
        headerBarBg: "linear-gradient(180deg, rgba(147,197,253,0.35) 0%, rgba(147,197,253,0.22) 100%)",
        headerTitle: FG,
        drawerBg: "#ffffff",
        drawerInner: "#f8fafc",
        text: "#0b2540",
        textSoft: "#475569",
        rowBg: "rgba(0,0,0,0.03)",
        headerBg: "linear-gradient(180deg, rgba(147,197,253,0.35) 0%, rgba(147,197,253,0.22) 100%)",
        headerText: FG,
        todayBg: "rgba(37,99,235,0.10)",
        offRangeBg: "rgba(2,6,23,0.03)",
        offRangeText: FG,
        expenseDot: "#ef4444",
        incomeDot: "#22c55e",
        expenseSoftBorder: "rgba(239,68,68,0.55)",
        incomeSoftBorder: "rgba(34,197,94,0.55)",
        dotRing: "rgba(0,0,0,.28)",
        dotRingInset: "rgba(255,255,255,.28)",
        primary: "#2563EB",
        onPrimary: "#fff",
      };

  const [wallets, setWallets] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flt, setFlt] = useState({ wallet: "all", category: "all", status: "all", kind: "all" });
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  /* ---- API: carteiras ---- */
  useEffect(() => {
    if (!isLogged) return;
    (async () => {
      try {
        const r = await apiCall.get(EP_WALLETS, { validateStatus: () => true });
        const list = r?.status >= 200 && r?.status < 300 ? unwrap(r.data) : [];
        setWallets(Array.isArray(list) ? list : []);
      } catch {}
    })();
  }, [isLogged]);

  /* ---- API: despesas e receitas ---- */
  useEffect(() => {
    if (!isLogged) return;
    const email = auth?.Email;
    if (!email) return;

    (async () => {
      setLoading(true);
      try {
        const [expRes, earnRes] = await Promise.all([
          apiCall.get(EP_E_LIST, { params: { userEmail: email }, validateStatus: () => true }),
          apiCall.get(EP_R_LIST, { params: { userEmail: email }, validateStatus: () => true }),
        ]);

        const expList = expRes?.status >= 200 && expRes?.status < 300 ? unwrap(expRes.data) : [];
        const earnList = earnRes?.status >= 200 && earnRes?.status < 300 ? unwrap(earnRes.data) : [];

        const evts = [];
        for (const e of Array.isArray(expList) ? expList : []) {
          for (const i of unwrap(e?.Instances)) {
            if (!i?.DueDate) continue;
            evts.push({
              id: i.Id || `${e.Id}:${i.DueDate}`,
              title: N(e?.Name) || "Despesa",
              start: new Date(i.DueDate),
              end: new Date(i.DueDate),
              amount: Number(i?.Value ?? e?.Value ?? 0),
              kind: "expense",
              paid: Boolean(i?.IsPaid || (i?.PaidAmount && Number(i.PaidAmount) >= Number(i.Value))),
              walletId: e?.WalletId ?? null,
              category: N(e?.Category) || "",
            });
          }
        }
        for (const e of Array.isArray(earnList) ? earnList : []) {
          for (const i of unwrap(e?.Instances)) {
            if (!i?.ExpectedDate) continue;
            evts.push({
              id: i.Id || `${e.Id}:${i.ExpectedDate}`,
              title: N(e?.Title) || "Receita",
              start: new Date(i.ExpectedDate),
              end: new Date(i.ExpectedDate),
              amount: Number(i?.Amount ?? e?.Amount ?? 0),
              kind: "earning",
              paid: Boolean(i?.IsReceived || i?.ReceivedAtUtc),
              walletId: e?.WalletId ?? null,
              category: N(e?.Category) || "",
            });
          }
        }
        setEvents(evts);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [auth?.Email, isLogged]);

  /* ---- Opções e filtros ---- */
  const walletOptions = useMemo(
    () => [
      { value: "all", label: tt(t, "wallets.all", "Todas as carteiras") },
      ...wallets.map((w) => ({ value: w.Id ?? w.id, label: N(w.Name ?? w.name) })),
    ],
    [wallets, t]
  );

  const categoryOptions = useMemo(() => {
    const names = new Set(events.map((x) => N(x.category)).filter(Boolean));
    return [{ value: "all", label: tt(t, "common.all", "Todas") }, ...[...names].sort().map((v) => ({ value: v, label: v }))];
  }, [events, t]);

  const kindOptions = [
    { value: "all", label: tt(t, "common.all", "Todos") },
    { value: "expense", label: tt(t, "expenses.title", "Despesas") },
    { value: "earning", label: tt(t, "earnings.title", "Receitas") },
  ];
  const statusOptions = [
    { value: "all", label: tt(t, "common.allStatus", "Todos") },
    { value: "paid", label: tt(t, "common.paid", "Pago / Recebido") },
    { value: "pending", label: tt(t, "common.pending", "Pendente") },
  ];

  const filteredEvents = useMemo(() => {
    const w = flt.wallet, k = flt.kind, st = flt.status, ccat = (flt.category || "all").toLowerCase();
    return events.filter((ev) => {
      const walletOk = w === "all" || String(ev.walletId) === String(w);
      const kindOk = k === "all" || ev.kind === k;
      const statusOk = st === "all" || (st === "paid" ? ev.paid : !ev.paid);
      const catOk = ccat === "all" || (ev.category || "").toLowerCase() === ccat;
      return walletOk && kindOk && statusOk && catOk;
    });
  }, [events, flt]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const ev of filteredEvents) {
      const key = `${ev.start.getFullYear()}-${String(ev.start.getMonth() + 1).padStart(2,"0")}-${String(ev.start.getDate()).padStart(2,"0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return map;
  }, [filteredEvents]);
  const getEventsFor = (date) =>
    byDay.get(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`) || [];

  if (!isLogged) {
    return (
      <div className="p-2 sm:p-4">
        <Title text={tt(t, "calendar.title", "Calendário Financeiro")} />
        <div className="text-sm opacity-70">{tt(t, "auth.login_required", "Inicia sessão para veres o calendário.")}</div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 pb-6">
      <style>{`
        :root { --fg: ${FG}; --bw: ${BORDER_W}px; }

        .te-card{
          border: var(--bw) solid var(--fg) !important;
          border-radius: 20px;
          overflow: visible;
          padding: 12px;
          background: transparent;
        }

        .te-inner .rbc-month-view{
          border: var(--bw) solid var(--fg) !important;
          border-radius: 16px;
          overflow: hidden;
          background: transparent;
        }

        .te-inner .rbc-header{
          background: ${colors.headerBg};
          color: var(--fg) !important;
          border-color: var(--fg) !important;
          border-bottom-width: var(--bw) !important;
          font-weight: 700;
          font-size: clamp(12px, .8rem + .15vw, 14px);
          padding: 10px 8px;
        }

        /* === inside = outside (mesma espessura) === */
        .te-inner .rbc-month-row{
          border-top: var(--bw) solid var(--fg) !important;
          min-height: 4.1rem;
        }
        @media (max-width:1024px){ .te-inner .rbc-month-row{ min-height: 3.9rem; } }
        @media (max-width:640px){ .te-inner .rbc-month-row{ min-height: 3.5rem; } }

        .te-inner .rbc-row.rbc-month-header + .rbc-month-row{
          border-top: 0 !important; /* evita dupla linha logo abaixo do header */
        }

        .te-inner .rbc-day-bg{
          border-right: var(--bw) solid var(--fg) !important;
          border-top: 0 !important;
          border-bottom: 0 !important;
        }
        .te-inner .rbc-day-bg:last-child{
          border-right: 0 !important; /* não duplica com a moldura direita */
        }

        .te-inner .rbc-button-link{
          color: var(--fg) !important;
          font-weight: 600;
          opacity: 1 !important;
        }

        .te-inner .rbc-today{
          background: ${colors.todayBg} !important;
          box-shadow: inset 0 0 0 var(--bw) var(--fg) !important;
        }

        .te-inner .rbc-off-range-bg{ background: ${colors.offRangeBg} !important; }
        .te-inner .rbc-off-range .rbc-button-link{ color: ${colors.offRangeText} !important; }

        .te-inner .rbc-event, .te-inner .rbc-show-more{ display:none !important; }
      `}</style>

      <Title text={tt(t, "calendar.title", "Calendário Financeiro")} />

      <GenericFilter
        value={flt}
        onChange={setFlt}
        t={t}
        theme={theme}
        showToggle
        defaultOpen
        className="mb-6"
        filters={[
          { key: "wallet", type: "select", options: walletOptions },
          { key: "category", type: "select", options: categoryOptions },
          { key: "kind", type: "select", options: kindOptions },
          { key: "status", type: "select", options: statusOptions },
        ]}
      />

      {loading && <div className="mt-4 opacity-80">{tt(t, "common.loading", "A carregar…")}</div>}

      {!loading && (
        <>
          <div className="te-card">
            <ToolbarDesktop
              colors={colors}
              t={t}
              date={currentDate}
              monthName={monthName}
              onNavigate={(action, nd) => {
                if (action === "DATE" && nd) setCurrentDate(nd);
                else if (action === "TODAY") setCurrentDate(new Date());
                else if (action === "PREV") setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
                else if (action === "NEXT") setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
              }}
            />
            <ToolbarMobile colors={colors} t={t} monthName={monthName} date={currentDate} setDate={setCurrentDate} />

            <div className="te-inner">
              {isMobile ? (
                <MobileMonthList
                  date={currentDate}
                  getEventsFor={getEventsFor}
                  colors={colors}
                  onPickDay={setSelectedDate}
                  weekdayName={(iSun0) => weekdayName(iSun0)}
                />
              ) : (
                <Calendar
                  localizer={localizer}
                  events={filteredEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: "clamp(520px, 78vh, 860px)" }}
                  views={["month"]}
                  date={currentDate}
                  onNavigate={(date) => setCurrentDate(date)}
                  defaultView="month"
                  messages={{
                    month: tt(t, "calendar.month", "Mês"),
                    today: tt(t, "common.today", "Hoje"),
                    previous: tt(t, "common.prev", "‹"),
                    next: tt(t, "common.next", "›"),
                  }}
                  formats={{
                    monthHeaderFormat: (d) => `${monthName(d.getMonth())} ${d.getFullYear()}`.toUpperCase(),
                    dayFormat: (d) => String(d.getDate()).padStart(2, "0"),
                    weekdayFormat: (d) => weekdayName(getDay(d)),
                  }}
                  selectable
                  onSelectSlot={(slot) => {
                    if (slot?.action === "click" || slot?.action === "select") setSelectedDate(slot.start);
                  }}
                  components={{
                    toolbar: () => null,
                    dateCellWrapper: (p) => (
                      <DayCellIndicators {...p} eventsForDay={getEventsFor(p.value)} colors={colors} />
                    ),
                  }}
                />
              )}
            </div>
          </div>

          <DayDrawer
            open={!!selectedDate}
            onClose={() => setSelectedDate(null)}
            date={selectedDate || new Date()}
            items={selectedDate ? filteredEvents.filter((e) => isSameDay(e.start, selectedDate)) : []}
            colors={colors}
            t={t}
            monthName={monthName}
          />
        </>
      )}
    </div>
  );
}

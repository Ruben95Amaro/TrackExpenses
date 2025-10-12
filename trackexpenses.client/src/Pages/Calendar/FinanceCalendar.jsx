
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
import { pt } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import Title from "../../components/Titles/TitlePage";
import GenericFilter from "../../components/Tables/GenericFilter";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

/* ==================== Endpoints & helpers ==================== */
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
  locales: { pt },
});
const tt = (t, key, fallback) => {
  const v = t?.(key);
  return !v || v === key ? fallback : v;
};

/* ==================== Responsividade ==================== */
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

/* ==================== Dots centrados na célula ==================== */
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

/* ==================== Drawer (lista do dia) ==================== */
function DayDrawer({ open, onClose, date, items, colors, t }) {
  if (!open) return null;
  const expenses = items.filter((x) => x.kind === "expense");
  const earnings = items.filter((x) => x.kind === "earning");
  const total = (list) => list.reduce((s, x) => s + Number(x.amount || 0), 0);

  const Header = () => (
    <div
      className="flex items-center justify-between rounded-t-2xl px-4 md:px-5 py-3 md:py-4"
      style={{
        background: colors.headerBarBg,
        color: colors.headerTitle,
        borderBottom: `1px solid ${colors.borderHex}`,
      }}
    >
      <h3 className="font-semibold text-[clamp(1rem,0.9rem+0.5vw,1.125rem)]">
        {format(date, "d 'de' LLLL 'de' yyyy", { locale: pt })}
      </h3>
      <button
        onClick={onClose}
        className="rounded-lg px-3 py-2 text-sm font-semibold shadow-sm"
        style={{
          background: colors.primary,
          color: colors.onPrimary,
          border: `1px solid ${colors.borderHex}`,
        }}
      >
        {tt(t, "common.close", "Fechar")}
      </button>
    </div>
  );

  const Section = ({ title, color, border, list, emptyText }) => (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
          <h4 className="font-semibold" style={{ color: colors.text }}>
            {title}
          </h4>
        </div>
        {list.length > 0 && (
          <span className="tabular-nums font-semibold" style={{ color: colors.text }}>
            {money(total(list))}
          </span>
        )}
      </div>
      {list.length === 0 ? (
        <div className="text-sm" style={{ color: colors.textSoft }}>
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{
                background: colors.rowBg,
                color: colors.text,
                border: `1px solid ${border}`,
              }}
            >
              <span className="truncate">{N(e.title) || title}</span>
              <span className="tabular-nums font-semibold">{money(e.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative max-h-[86vh] w-[min(820px,96vw)] overflow-auto rounded-2xl shadow-2xl"
        style={{ background: colors.drawerBg, border: `2px solid ${colors.borderHex}` }}
      >
        <Header />
        <div className="rounded-b-2xl p-4 md:p-6" style={{ background: colors.drawerInner }}>
          <Section
            title={tt(t, "expenses.title", "Despesas")}
            color={colors.expenseDot}
            border={colors.expenseSoftBorder}
            list={expenses}
            emptyText={tt(t, "expenses.none", "Sem despesas neste dia.")}
          />
          <Section
            title={tt(t, "earnings.title", "Receitas")}
            color={colors.incomeDot}
            border={colors.incomeSoftBorder}
            list={earnings}
            emptyText={tt(t, "earnings.none", "Sem receitas neste dia.")}
          />
        </div>
      </div>
    </div>
  );
}

/* ==================== Toolbars ==================== */
function ToolbarDesktop({ date, onNavigate, colors, t }) {
  const monthIdx = date.getMonth();
  const year = date.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2020, i, 1).toLocaleDateString("pt-PT", { month: "long" })
  );
  const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);
  const jumpTo = (m, y) => onNavigate("DATE", new Date(y, m, 1));

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-3 mb-4 rounded-xl"
      style={{ background: colors.headerBarBg, border: `1px solid ${colors.borderHex}` }}
    >
      {/* esquerda */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate("TODAY")}
          className="h-10 px-3 rounded-xl font-semibold whitespace-nowrap"
          style={{ color: colors.headerTitle, border: `1px solid ${colors.borderHex}` }}
        >
          {tt(t, "common.today", "Hoje")}
        </button>

        {/* grupo com separador vertical full-height */}
        <div
          className="flex items-center rounded-xl overflow-hidden"
          style={{ border: `1px solid ${colors.borderHex}` }}
        >
          <button
            onClick={() => onNavigate("PREV")}
            className="h-10 px-3"
            style={{ color: colors.headerTitle }}
            aria-label="Anterior"
          >
            ‹
          </button>

          {/* separador: ocupa 100% graças a self-stretch */}
          <span
            className="w-px self-stretch"
            style={{ background: colors.borderHex, opacity: 0.85 }}
            aria-hidden
          />

          <button
            onClick={() => onNavigate("NEXT")}
            className="h-10 px-3"
            style={{ color: colors.headerTitle }}
            aria-label="Seguinte"
          >
            ›
          </button>
        </div>
      </div>

      {/* centro */}
      <div
        className="text-lg font-extrabold tracking-wide uppercase text-center flex-grow text-nowrap"
        style={{ color: colors.headerTitle, minWidth: 120 }}
      >
        {format(date, "LLLL yyyy", { locale: pt })}
      </div>

      {/* direita */}
      <div className="flex items-center gap-2">
        <select
          value={monthIdx}
          onChange={(e) => jumpTo(Number(e.target.value), year)}
          className="h-10 max-w-[140px] px-3 rounded-xl text-sm appearance-none"
          style={{ background: "transparent", color: colors.headerTitle, border: `1px solid ${colors.borderHex}` }}
          aria-label="Mês"
        >
          {months.map((m, i) => (
            <option key={i} value={i} style={{ background: "#0f172a", color: "#E3EDFF" }}>
              {m[0].toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => jumpTo(monthIdx, Number(e.target.value))}
          className="h-10 max-w-[96px] px-3 rounded-xl text-sm appearance-none"
          style={{ background: "transparent", color: colors.headerTitle, border: `1px solid ${colors.borderHex}` }}
          aria-label="Ano"
        >
          {years.map((y) => (
            <option key={y} value={y} style={{ background: "#0f172a", color: "#E3EDFF" }}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ToolbarMobile({ date, setDate, colors, t }) {
  return (
    <div className="sm:hidden mb-3">
      <div
        className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: colors.headerBarBg, border: `1px solid ${colors.borderHex}` }}
      >
        <button
          onClick={() => setDate(new Date())}
          className="h-11 px-3 rounded-xl font-semibold"
          style={{ color: colors.headerTitle, border: `1px solid ${colors.borderHex}` }}
        >
          {tt(t, "common.today", "Hoje")}
        </button>

        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.borderHex}` }}>
          <button
            onClick={() => setDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="h-11 px-3"
            style={{ color: colors.headerTitle }}
          >
            ‹
          </button>
          <span className="w-px self-stretch" style={{ background: colors.borderHex, opacity: 0.85 }} />
          <button
            onClick={() => setDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="h-11 px-3"
            style={{ color: colors.headerTitle }}
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <select
          value={date.getMonth()}
          onChange={(e) => setDate(new Date(date.getFullYear(), Number(e.target.value), 1))}
          className="h-11 px-3 rounded-xl text-sm w-full appearance-none"
          style={{ background: "transparent", color: colors.headerTitle, border: `1px solid ${colors.borderHex}` }}
          aria-label="Mês"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i} style={{ background: "#0f172a", color: "#E3EDFF" }}>
              {new Date(2020, i, 1)
                .toLocaleDateString("pt-PT", { month: "long" })
                .replace(/^\w/, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <select
          value={date.getFullYear()}
          onChange={(e) => setDate(new Date(Number(e.target.value), date.getMonth(), 1))}
          className="h-11 px-3 rounded-xl text-sm w-full appearance-none"
          style={{ background: "transparent", color: colors.headerTitle, border: `1px solid ${colors.borderHex}` }}
          aria-label="Ano"
        >
          {Array.from({ length: 11 }, (_, i) => date.getFullYear() - 5 + i).map((y) => (
            <option key={y} value={y} style={{ background: "#0f172a", color: "#E3EDFF" }}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ==================== Lista mensal (modo mobile) ==================== */
function MobileMonthList({ date, getEventsFor, colors, onPickDay }) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="divide-y" style={{ borderTop: `1px solid ${colors.borderHex}` }}>
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
              boxShadow: isToday ? `inset 0 0 0 2px ${colors.todayRing}` : "none",
            }}
          >
            <div className="min-w-0">
              <div className="text-[13px] uppercase opacity-80">{format(d, "EEEE", { locale: pt })}</div>
              <div className="text-[clamp(18px,1.1rem,22px)] font-semibold">{format(d, "dd", { locale: pt })}</div>
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

  // Paleta unificada
  const colors = {
    headerBarBg: "#1b2741",
    headerTitle: "#E3EDFF",
    borderHex: "#2563EB",

    drawerBg: "#1b2741",
    drawerInner: "#1d2f54",

    text: "#EAF2FF",
    textSoft: "#C7D3EA",
    rowBg: "#24345c",
    headerBg: "#1C2942",
    headerText: "#E9F0FF",

    todayBg: "rgba(93,127,255,0.28)",
    todayRing: "#4D7CFF",
    offRangeBg: "#1a2336",
    offRangeText: "#9fb0d4",

    expenseDot: "#ef4444",
    incomeDot: "#22c55e",
    expenseSoftBorder: "#A53333",
    incomeSoftBorder: "#2A7B4A",
    dotRing: "rgba(255,255,255,.22)",
    dotRingInset: "rgba(0,0,0,.22)",

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

        // Expenses
        for (const e of (Array.isArray(expList) ? expList : [])) {
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

        // Earnings
        for (const e of (Array.isArray(earnList) ? earnList : [])) {
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

  /* ---- Opções de filtro ---- */
  const walletOptions = useMemo(
    () => [
      { value: "all", label: tt(t, "wallets.all", "Todas as carteiras") },
      ...wallets.map((w) => ({ value: w.Id ?? w.id, label: N(w.Name ?? w.name) })),
    ],
    [wallets, t]
  );

  const categoryOptions = useMemo(() => {
    const names = new Set(events.map((x) => N(x.category)).filter(Boolean));
    return [
      { value: "all", label: tt(t, "common.all", "Todas") },
      ...[...names].sort().map((v) => ({ value: v, label: v })),
    ];
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

  /* ---- Aplicar filtros ---- */
  const filteredEvents = useMemo(() => {
    const w = flt.wallet,
      k = flt.kind,
      st = flt.status,
      ccat = (flt.category || "all").toLowerCase();
    return events.filter((ev) => {
      const walletOk = w === "all" || String(ev.walletId) === String(w);
      const kindOk = k === "all" || ev.kind === k;
      const statusOk = st === "all" || (st === "paid" ? ev.paid : !ev.paid);
      const catOk = ccat === "all" || (ev.category || "").toLowerCase() === ccat;
      return walletOk && kindOk && statusOk && catOk;
    });
  }, [events, flt]);

  /* ---- Mapa por dia ---- */
  const byDay = useMemo(() => {
    const map = new Map();
    for (const ev of filteredEvents) {
      const key = format(ev.start, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return map;
  }, [filteredEvents]);
  const getEventsFor = (date) => byDay.get(format(date, "yyyy-MM-dd")) || [];

  if (!isLogged) {
    return (
      <div className="p-2 sm:p-4">
        <Title text={tt(t, "calendar.title", "Calendário Financeiro")} />
        <div className="text-sm opacity-70">
          {tt(t, "auth.login_required", "Inicia sessão para veres o calendário.")}
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 pb-6">
      {/* estilos do cartão/grelha */}
      <style>{`
        .te-card{
          border:2px solid ${colors.borderHex};
          border-radius:20px;
          overflow:visible;
          box-shadow:0 0 10px rgba(37,99,235,.25);
          padding:12px;
          background:transparent;
        }
        .te-inner .rbc-month-view{
          border:1px solid ${colors.borderHex};
          border-radius:16px;
          overflow:hidden;
          background:transparent;
        }
        .te-inner .rbc-row.rbc-month-header { min-height: 3.25rem; }
        .te-inner .rbc-header{
          background:${colors.headerBg};
          color:${colors.headerText};
          border-color:${colors.borderHex};
          font-weight:700;
          font-size:clamp(12px, .8rem + .15vw, 14px);
          padding:10px 8px;
        }
        .te-inner .rbc-month-row{ min-height: 4.1rem; }
        @media (max-width:1024px){ .te-inner .rbc-month-row{ min-height: 3.9rem; } }
        @media (max-width:640px){ .te-inner .rbc-month-row{ min-height: 3.5rem; } }
        .te-inner .rbc-day-bg,.te-inner .rbc-month-row{ border-color:${colors.borderHex}; }
        .te-inner .rbc-button-link{ font-size:clamp(12px,.75rem + .15vw,14px); }
        .te-inner .rbc-today{
          background:${colors.todayBg} !important;
          box-shadow: inset 0 0 0 2px ${colors.todayRing};
        }
        .te-inner .rbc-off-range-bg{ background:${colors.offRangeBg} !important; }
        .te-inner .rbc-off-range .rbc-button-link{ color:${colors.offRangeText} !important; opacity:.9; }
        .te-inner .rbc-event,.te-inner .rbc-show-more{ display:none !important; }
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
              onNavigate={(action, nd) => {
                if (action === "DATE" && nd) setCurrentDate(nd);
                else if (action === "TODAY") setCurrentDate(new Date());
                else if (action === "PREV")
                  setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
                else if (action === "NEXT")
                  setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
              }}
            />
            <ToolbarMobile
              colors={colors}
              t={t}
              date={currentDate}
              setDate={setCurrentDate}
            />

            <div className="te-inner">
              {isMobile ? (
                <MobileMonthList
                  date={currentDate}
                  getEventsFor={getEventsFor}
                  colors={colors}
                  onPickDay={setSelectedDate}
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
                    monthHeaderFormat: (d) =>
                      format(d, "LLLL yyyy", { locale: pt }).toUpperCase(),
                    dayFormat: (d) =>
                      d.toLocaleDateString("pt-PT", { day: "2-digit" }),
                    weekdayFormat: (d) => format(d, "eeee", { locale: pt }),
                  }}
                  selectable
                  onSelectSlot={(slot) => {
                    if (slot?.action === "click" || slot?.action === "select")
                      setSelectedDate(slot.start);
                  }}
                  components={{
                    toolbar: () => null,
                    dateCellWrapper: (p) => (
                      <DayCellIndicators
                        {...p}
                        eventsForDay={getEventsFor(p.value)}
                        colors={colors}
                      />
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
            items={
              selectedDate
                ? filteredEvents.filter((e) => isSameDay(e.start, selectedDate))
                : []
            }
            colors={colors}
            t={t}
          />
        </>
      )}
    </div>
  );
}

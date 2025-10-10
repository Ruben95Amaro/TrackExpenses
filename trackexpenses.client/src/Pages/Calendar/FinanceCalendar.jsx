import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";
import Title from "../../components/Titles/TitlePage";
import GenericFilter from "../../components/Tables/GenericFilter";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

const EP_E_LIST = "Expenses/ListExpenses";   
const EP_R_LIST = "Earnings/ListEarnings";   
const EP_WALLETS = "/wallets?includeArchived=true";

const unwrap = (v) => (Array.isArray(v) ? v : v?.$values ?? []);
const N = (v) => (v ?? "").toString().trim();
const keyOf = (d) => d.toISOString().slice(0, 10); 
const normalizeDate = (d) => {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate()); 
};

export default function FinanceCalendar() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth } = useContext(AuthContext) || {};
  const isLogged = Boolean(auth?.Email);

  const isDark =
    theme?.mode === "dark" ||
    theme?.isDark === true ||
    theme?.palette?.mode === "dark";

  const today = normalizeDate(new Date());
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);

  const [wallets, setWallets] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [flt, setFlt] = useState({
    wallet: "all",
    category: "all",
    status: "all",
    kind: "all",
  });

  const [isSmall, setIsSmall] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const perDayLimit = isSmall ? 2 : 4;

  const calWrapRef = useRef(null);
  useEffect(() => {
    const el = calWrapRef.current;
    if (!el) return;
    let startX = 0;
    const onTouchStart = (e) => (startX = e.touches[0].clientX);
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) goNext();
        else goPrev();
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []); 

  const walletOptions = useMemo(
    () => [
      { value: "all", label: t?.("wallets.all") || "All wallets" },
      ...wallets.map((w) => ({ value: w.Id ?? w.id, label: N(w.Name ?? w.name) })),
    ],
    [wallets, t]
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: new Date(2020, i, 1).toLocaleDateString(undefined, { month: "long" }),
      })),
    []
  );
  const yearOptions = useMemo(() => {
    const years = new Set(events.map((e) => e.date.getFullYear()));
    const y = view.y;
    if (years.size === 0)
      return Array.from({ length: 7 }, (_, i) => y - 3 + i);
    const arr = Array.from(years).sort((a, b) => a - b);
    const min = Math.min(arr[0], y - 3);
    const max = Math.max(arr[arr.length - 1], y + 3);
    const out = [];
    for (let yy = min; yy <= max; yy++) out.push(yy);
    return out;
  }, [events, view.y]);

  useEffect(() => {
    if (!isLogged) return;
    let alive = true;
    (async () => {
      try {
        const r = await apiCall.get(EP_WALLETS, { validateStatus: () => true });
        if (!alive) return;
        const list =
          r?.status >= 200 && r?.status < 300
            ? Array.isArray(r.data)
              ? r.data
              : unwrap(r.data)
            : [];
        setWallets(list || []);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [isLogged]);

  useEffect(() => {
    if (!isLogged) return;
    let alive = true;
    (async () => {
      const email = auth?.Email || "";
      if (!email) return;
      setLoading(true);
      try {
        const [expRes, earnRes] = await Promise.all([
          apiCall.get(EP_E_LIST, { params: { userEmail: email }, validateStatus: () => true }),
          apiCall.get(EP_R_LIST, { params: { userEmail: email }, validateStatus: () => true }),
        ]);

        const expList =
          expRes?.status >= 200 && expRes?.status < 300
            ? Array.isArray(expRes.data)
              ? expRes.data
              : unwrap(expRes.data)
            : [];
        const earnList =
          earnRes?.status >= 200 && earnRes?.status < 300
            ? Array.isArray(earnRes.data)
              ? earnRes.data
              : unwrap(earnRes.data)
            : [];

        const evts = [];

        for (const e of expList) {
          const inst = unwrap(e?.Instances);
          for (const i of inst) {
            if (!i?.DueDate) continue;
            evts.push({
              id: i.Id || `${e.Id}:${i.DueDate}`,
              parentId: e.Id,
              kind: "expense",
              title: N(e?.Name) || t?.("expenses.one") || "Expense",
              category: N(e?.Category) || "-",
              walletId: e?.WalletId || null,
              date: normalizeDate(i.DueDate),
              amount: Number(i?.Value ?? e?.Value ?? 0),
              paid: Boolean(i?.IsPaid || (i?.PaidAmount && Number(i.PaidAmount) >= Number(i.Value))),
            });
          }
        }
        for (const e of earnList) {
          const inst = unwrap(e?.Instances);
          for (const i of inst) {
            if (!i?.ExpectedDate) continue;
            evts.push({
              id: i.Id || `${e.Id}:${i.ExpectedDate}`,
              parentId: e.Id,
              kind: "earning",
              title: N(e?.Title) || t?.("earnings.one") || "Earning",
              category: N(e?.Category) || "-",
              walletId: e?.WalletId || null,
              date: normalizeDate(i.ExpectedDate),
              amount: Number(i?.Amount ?? e?.Amount ?? 0),
              paid: Boolean(i?.IsReceived || i?.ReceivedAtUtc),
            });
          }
        }

        if (alive) setEvents(evts);
      } catch (err) {
        if (alive) setError(err?.message || "Failed to load calendar");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [auth?.Email, isLogged, t]);

  const categoryOptions = useMemo(() => {
    const names = new Set(events.map((x) => N(x.category)).filter(Boolean));
    return [
      { value: "all", label: t?.("common.all") || "All" },
      ...[...names].sort().map((v) => ({ value: v, label: v })),
    ];
  }, [events, t]);

  const kindOptions = useMemo(
    () => [
      { value: "all", label: t?.("common.all") || "All" },
      { value: "expense", label: t?.("expenses.list") || "Expenses" },
      { value: "earning", label: t?.("earnings.list") || "Earnings" },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t?.("common.all") || "All" },
      { value: "paid", label: t?.("calendar.status.paid") || "Paid / Received" },
      { value: "pending", label: t?.("calendar.status.pending") || "Pending" },
    ],
    [t]
  );

  const filtered = useMemo(() => {
    const w = flt.wallet;
    const c = (flt.category || "all").toLowerCase();
    const k = (flt.kind || "all").toLowerCase();
    const st = (flt.status || "all").toLowerCase();
    return events.filter((ev) => {
      const walletOk = w === "all" || String(ev.walletId) === String(w);
      const catOk = c === "all" || N(ev.category).toLowerCase() === c;
      const kindOk = k === "all" || ev.kind === k;
      const statusOk = st === "all" || (st === "paid" ? ev.paid : !ev.paid);
      return walletOk && catOk && kindOk && statusOk;
    });
  }, [events, flt]);

  const firstOfMonth = useMemo(() => new Date(view.y, view.m, 1), [view]);
  const gridStart = useMemo(() => {
    const d = new Date(firstOfMonth);
    const day = d.getDay() || 7; // 1..7 Mon..Sun
    d.setDate(d.getDate() - ((day + 6) % 7)); // voltar à segunda
    return normalizeDate(d);
  }, [firstOfMonth]);

  const gridDates = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const d = new Date(gridStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [gridStart]
  );

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of filtered) {
      const k = keyOf(ev.date);
      map[k] = map[k] || [];
      map[k].push(ev);
    }
    for (const k in map) {
      map[k].sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "expense" ? -1 : 1;
        return Number(b.amount || 0) - Number(a.amount || 0);
      });
    }
    return map;
  }, [filtered]);

  const goPrev = useCallback(
    () => setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: v.m === 0 ? 11 : v.m - 1 })),
    []
  );
  const goNext = useCallback(
    () => setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: v.m === 11 ? 0 : v.m + 1 })),
    []
  );
  const goToday = useCallback(() => setView({ y: today.getFullYear(), m: today.getMonth() }), [today]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  if (!isLogged) {
    return (
      <div className={`space-y-6 min-h-screen ${isDark ? "dark" : ""}`}>
        <Title text={t?.("calendar.title") || "Calendar"} />
        <div className="text-slate-500 text-sm">
          {t?.("auth.login_required") || "Please sign in to view your calendar."}
        </div>
      </div>
    );
  }

  const monthLabel = firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const EventTag = ({ ev }) => {
    const isExpense = ev.kind === "expense";
    const base = isExpense
      ? "bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"
      : "bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300";
    const opacity = ev.paid ? "" : "opacity-70";
    return (
      <div
        className={`w-full text-[12px] md:text-[11px] px-2 py-[6px] rounded-md border ${base} ${opacity} flex items-center gap-2`}
        title={`${ev.title} • ${ev.amount.toLocaleString(undefined, { style: "currency", currency: "EUR" })}`}
      >
        <div className={`w-1.5 h-3 rounded-sm ${isExpense ? "bg-red-500" : "bg-green-500"}`} />
        <div className="truncate">{ev.title}</div>
        <div className="ml-auto font-semibold">
          {ev.amount.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
        </div>
      </div>
    );
  };

  const DayCell = ({ date }) => {
    const k = keyOf(date);
    const items = eventsByDate[k] || [];
    const inMonth = date.getMonth() === view.m;
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    return (
      <button
        className={`min-h-[110px] sm:min-h-[120px] md:min-h-[140px] lg:min-h-[160px] w-full text-left rounded-2xl border overflow-hidden p-2 sm:p-3 flex flex-col gap-2 transition
          ${
            isToday
              ? "border-blue-500 ring-1 ring-blue-300 bg-white dark:bg-slate-800"
              : inMonth
              ? "border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700"
              : "border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
          }`}
        onClick={() => setSelectedDate(date)}
      >
        <div className="flex items-center justify-between">
          <div className={`text-sm sm:text-base ${inMonth ? "text-slate-700 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
            {date.getDate()}
          </div>
          <div className="flex gap-1">
            {items.some((e) => e.kind === "expense") && (
              <span className="text-[10px] px-1 rounded bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">Exp</span>
            )}
            {items.some((e) => e.kind === "earning") && (
              <span className="text-[10px] px-1 rounded bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300">Inc</span>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1">
          {items.slice(0, perDayLimit).map((ev) => (
            <EventTag key={ev.id} ev={ev} />
          ))}
          {items.length === 0 && (
            <div className="text-[12px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {t?.("calendar.empty") || "No entries"}
            </div>
          )}
          {items.length > perDayLimit && (
            <div className="text-[12px] sm:text-[11px] text-slate-600 dark:text-slate-300">
              +{items.length - perDayLimit} {t?.("calendar.more") || "more"}
            </div>
          )}
        </div>
      </button>
    );
  };

  const selectedKey = selectedDate ? keyOf(selectedDate) : null;
  const selectedList = selectedKey ? eventsByDate[selectedKey] || [] : [];

  return (
    <div className={`${isDark ? "dark" : ""}`}>
      <div className="space-y-6 min-h-screen text-slate-900 dark:text-slate-100">
        {/* Título */}
        <Title text={t?.("calendar.title") || "Finance Calendar"} />

        {/* Filtros */}
        <GenericFilter
          value={flt}
          onChange={setFlt}
          t={t}
          theme={theme}
          showToggle
          defaultOpen
          filters={[
            { key: "wallet", type: "select", options: walletOptions },
            { key: "category", type: "select", options: categoryOptions },
            { key: "kind", type: "select", options: kindOptions },
            { key: "status", type: "select", options: statusOptions },
          ]}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap mt-1">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" onClick={goToday}>
              {t?.("calendar.today") || "Today"}
            </button>
            <button className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" onClick={goPrev}>‹</button>
            <button className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" onClick={goNext}>›</button>
          </div>

          <div className="text-xl font-semibold order-2 md:order-none">
            {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 shadow border border-slate-200 dark:border-slate-700 text-sm"
              value={view.m}
              onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 shadow border border-slate-200 dark:border-slate-700 text-sm"
              value={view.y}
              onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Header dos dias (sticky em mobile) */}
        <div className="sticky top-0 z-10 bg-transparent">
          <div className="grid grid-cols-7 gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 select-none py-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-2 text-center">
                {d}
              </div>
            ))}
          </div>
        </div>

        <div ref={calWrapRef} className="grid grid-cols-7 gap-2 md:gap-3">
          {gridDates.map((d) => (
            <DayCell key={keyOf(d)} date={d} />
          ))}
        </div>

        {selectedDate && (
          <div className="rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="font-semibold text-base sm:text-lg">
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <button
                className="text-sm text-slate-600 dark:text-slate-300 hover:underline"
                onClick={() => setSelectedDate(null)}
              >
                {t?.("common.close") || "Close"}
              </button>
            </div>
            <div className="p-4 space-y-3">
              {selectedList.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-300">
                  {t?.("calendar.empty") || "No entries"}
                </div>
              ) : (
                selectedList.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 text-[15px] sm:text-sm">
                    <div className={`w-2.5 h-2.5 rounded-full ${ev.kind === "expense" ? "bg-red-500" : "bg-green-500"}`} />
                    <div className="truncate">{ev.title}</div>
                    <div className={`ml-auto font-semibold ${ev.kind === "expense" ? "text-red-600" : "text-green-600"}`}>
                      {ev.amount.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}
        {loading && (
          <div className="text-sm text-slate-500 dark:text-slate-300">
            {t?.("calendar.loading") || "Loading calendar..."}
          </div>
        )}
      </div>
    </div>
  );
}
  
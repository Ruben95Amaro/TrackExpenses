import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import Title from "../../components/Titles/TitlePage";
import StatCard from "../../components/UI/StatCard";
import EvolutionChart from "../../components/Charts/EvolutionChart";
import CategoriesPies from "../../components/Charts/CategoriesPies";
import StatusStackedBar from "../../components/Charts/StatusStackedBar";
import DashboardFilterBar from "../../components/Filters/DashboardFilterBar";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import AuthContext from "../../services/Authentication/AuthContext";

/* === helpers === */
const toISO = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");
const firstDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const lastDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const A = (x) => (Array.isArray(x) ? x : x?.$values ? x.$values : []);
const N = (v) => (v == null ? 0 : Number(v));
const pct = (p, t) => (N(t) > 0 ? N(p) / N(t) : 0);
const fmtCurrency = (v, cur = "EUR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(N(v));

/* --- helpers de cor --- */
function parseToRGB(c) {
  if (!c) return { r: 11, g: 18, b: 32 };
  if (c.startsWith("#")) {
    const h = c.replace("#", "");
    const full = h.length === 3 ? h.split("").map(x => x + x).join("") : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return { r, g, b };
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

/* === componente principal === */
export default function GroupDashboard() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth } = useContext(AuthContext) || {};

  const [flt, setFlt] = useState({
    groupId: "",
    userId: "",
    walletId: "",
    from: toISO(firstDay()),
    to: toISO(lastDay()),
    granularity: "month",
    type: "both",
  });

  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState([]);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [catsIncome, setCatsIncome] = useState([]);
  const [catsExpense, setCatsExpense] = useState([]);
  const [statusIncome, setStatusIncome] = useState([]);
  const [statusExpense, setStatusExpense] = useState([]);
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");

  const c = theme?.colors || {};
  const bg = c?.background?.paper;
  const isDark = isDarkColor(bg);
  const FG = isDark ? "#FFFFFF" : "#000000";           
  const BORDER_W = 2;                                   
  const success = c?.success?.main || "#16a34a";
  const danger  = c?.error?.main   || "#ef4444";
  const gridColor = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.25)";

  const showIncome  = flt.type === "both" || flt.type === "income";
  const showExpense = flt.type === "both" || flt.type === "expense";

  /* --- Fetch grupos --- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await apiCall.get("Group/ListMine", { validateStatus: () => true });
        const list = r?.status >= 200 && r?.status < 300 ? A(r.data) : [];
        if (!alive) return;
        setGroups(list);
        if (list[0]) setFlt((p) => ({ ...p, groupId: list[0].id }));
      } catch {/* ignore */}
    })();
    return () => { alive = false; };
  }, [auth?.Email]);

  /* --- Fetch users por grupo --- */
  useEffect(() => {
    let alive = true;
    if (!flt.groupId) { setUsers([]); return; }
    (async () => {
      try {
        const r = await apiCall.get("Group/Members", { params: { groupId: flt.groupId }, validateStatus: () => true });
        const list = r?.status >= 200 && r?.status < 300 ? A(r?.data?.members ?? r.data) : [];
        if (!alive) return;
        setUsers(list);
        if (list[0]) setFlt((p) => ({ ...p, userId: list[0].id }));
      } catch {/* ignore */}
    })();
    return () => { alive = false; };
  }, [flt.groupId]);

  /* --- Fetch wallets por user --- */
  useEffect(() => {
    let alive = true;
    if (!flt.userId) { setWallets([]); return; }
    (async () => {
      try {
        const r = await apiCall.get("Group/UserWallets", { params: { userId: flt.userId }, validateStatus: () => true });
        const list = r?.status >= 200 && r?.status < 300 ? A(r.data) : [];
        if (!alive) return;
        setWallets(list);
      } catch {/* ignore */}
    })();
    return () => { alive = false; };
  }, [flt.userId]);

  /* --- Fazer a 1ª pesquisa automaticamente --- */
  const didInitialSearch = useRef(false);
  useEffect(() => {
    if (!didInitialSearch.current && flt.groupId && flt.userId) {
      didInitialSearch.current = true;
      (async () => { await doSearch(); })();
    }
  }, [flt.groupId, flt.userId]);

  const buildParams = () => {
    const p = { from: flt.from, to: flt.to, granularity: flt.granularity, groupId: flt.groupId };
    if (flt.userId) p.userId = flt.userId;
    if (flt.walletId) p.walletId = flt.walletId;
    return p;
  };

  const doSearch = async () => {
    if (!flt.groupId || !flt.userId) return;
    setLoading(true);
    setError("");
    const params = buildParams();
    try {
      const [sumRes, tsRes, ciRes, ceRes, stIncRes, stExpRes] = await Promise.all([
        apiCall.get("GroupDashboard/Summary", { params }),
        apiCall.get("GroupDashboard/TimeSeries", { params }),
        apiCall.get("GroupDashboard/Categories", { params: { ...params, type: "income" } }),
        apiCall.get("GroupDashboard/Categories", { params: { ...params, type: "expense" } }),
        apiCall.get("GroupDashboard/StatusSplit", { params: { ...params, type: "income", groupBy: flt.granularity } }),
        apiCall.get("GroupDashboard/StatusSplit", { params: { ...params, type: "expense", groupBy: flt.granularity } }),
      ]);

      setSummary(sumRes?.data ?? null);
      setSeries(A(tsRes?.data).map((r) => ({ label: r?.label ?? "", income: N(r?.income), expense: N(r?.expense) })));
      setCatsIncome(A(ciRes?.data).map((x) => ({ category: x?.category ?? "—", amount: N(x?.amount) })));
      setCatsExpense(A(ceRes?.data).map((x) => ({ category: x?.category ?? "—", amount: N(x?.amount) })));
      setStatusIncome(A(stIncRes?.data));
      setStatusExpense(A(stExpRes?.data));
      if (sumRes?.data?.currency) setCurrency(sumRes.data.currency);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed");
    } finally { setLoading(false); }
  };

  const clearFilters = () => {
    setFlt((p) => ({
      ...p,
      walletId: "",
      type: "both",
      from: toISO(firstDay()),
      to: toISO(lastDay()),
      granularity: "month",
    }));
  };

  const statusMerged = useMemo(() => {
    const map = new Map();
    A(statusIncome).forEach((i) => {
      const k = i.label ?? "";
      map.set(k, {
        label: k,
        incomeReceived: pct(i.received ?? i.incomeReceived, i.expected),
        incomePending: pct(i.pending ?? i.incomePending, i.expected),
        expensesPaid: 0,
        expensesPending: 0,
      });
    });
    A(statusExpense).forEach((e) => {
      const k = e.label ?? "";
      const row = map.get(k) || { label: k, incomeReceived: 0, incomePending: 0, expensesPaid: 0, expensesPending: 0 };
      row.expensesPaid = pct(e.paid ?? e.expensesPaid, e.expected);
      row.expensesPending = pct(e.pending ?? e.expensesPending, e.expected);
      map.set(k, row);
    });
    return Array.from(map.values());
  }, [statusIncome, statusExpense]);

  const softUpdating = loading && !!summary;

  return (
    <div className="space-y-6 min-h-screen">
      <Title text={t("dashboard.groupTitle")} subText={t("dashboard.subtitle")} />

      {/* KPIs acima do filtro */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard title={t("dashboard.kpis.totalIncome")}  value={fmtCurrency(summary?.totalIncome, currency)} />
          <StatCard title={t("dashboard.kpis.totalExpense")} value={fmtCurrency(summary?.totalExpense, currency)} />
          <StatCard title={t("dashboard.kpis.net")}          value={fmtCurrency(summary?.net, currency)} />
          <StatCard
            title={t("dashboard.kpis.progress")}
            value={`${Math.round((summary?.pctIncomeReceived ?? 0) * 100)}% / ${Math.round((summary?.pctExpensePaid ?? 0) * 100)}%`}
          />
          <StatCard
            title={t("dashboard.kpis.walletBalance")}
            value={fmtCurrency((summary?.totalIncome ?? 0) - (summary?.totalExpense ?? 0), currency)}
          />
        </div>
      )}

      {/* Filtros */}
      <DashboardFilterBar
        value={flt}
        onChange={(patch) => setFlt((p) => ({ ...p, ...patch }))}
        onSearch={doSearch}
        onClear={clearFilters}
        loading={loading}
        showGroup
        showUser
        showWallet
        showDateFrom
        showDateTo
        showGranularity
        showType
        options={{ groups, users, wallets }}
        t={t}
        defaultOpen
        showToggle
      />

      {/* Evolução */}
      <div
        className="rounded-2xl p-4"
        style={{
          border: `${BORDER_W}px solid ${FG}`, 
          background: bg,
          color: FG,
        }}
      >
        <div className="mb-3 font-medium flex items-center gap-2">
          <span>{t("charts.evolution")}</span>
          {softUpdating && <span className="text-xs opacity-60">· updating…</span>}
        </div>
        <EvolutionChart
          data={series}
          currency={currency}
          colors={{ grid: gridColor, textStrong: FG, income: success, expense: danger }}
          showIncome={showIncome}
          showExpense={showExpense}
          bg={bg}
          border={FG} 
        />
      </div>

      {/* Categorias */}
      <div
        className="rounded-2xl p-4"
        style={{
          border: `${BORDER_W}px solid ${FG}`, 
          background: bg,
          color: FG,
        }}
      >
        <div className="mb-3 font-medium flex items-center gap-2">
          <span>{t("charts.categories")}</span>
          {softUpdating && <span className="text-xs opacity-60">· updating…</span>}
        </div>
        <CategoriesPies
          incomeData={catsIncome}
          expenseData={catsExpense}
          currency={currency}
          titles={{
            income: t("charts.income"),
            expense: t("charts.expenses"),
          }}
          themeColors={{
            bg,
            border: FG, 
            text: FG,   
          }}
        />
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
}

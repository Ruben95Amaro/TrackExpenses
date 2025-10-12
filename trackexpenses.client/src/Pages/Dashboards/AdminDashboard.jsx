import React, { useEffect, useMemo, useRef, useState } from "react";
import EvolutionChart from "../../components/Charts/EvolutionChart";
import CategoriesPies from "../../components/Charts/CategoriesPies";
import StatCard from "../../components/UI/StatCard";
import Title from "../../components/Titles/TitlePage";
import DashboardFilterBar from "../../components/Filters/DashboardFilterBar";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

const toISO = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().split("T")[0];
};
const firstDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const lastDay  = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const A = (x) => (Array.isArray(x) ? x : x?.$values ? x.$values : []);
const N = (v) => (v == null ? 0 : Number(v));
const fmtCurrency = (v, cur = "EUR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(N(v));

/* === componente principal === */
export default function AdminDashboard() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [flt, setFlt] = useState({
    userId: "",
    walletId: "",
    from: toISO(firstDay()),
    to: toISO(lastDay()),
    granularity: "month",
    type: "both",
  });

  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState([]);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [catsIncome, setCatsIncome] = useState([]);
  const [catsExpense, setCatsExpense] = useState([]);
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");

  const c = theme.colors;
  const success = c?.success?.main || "#16a34a";
  const danger  = c?.error?.main   || "#ef4444";
  const border  = c?.secondary?.light || "#334155";
  const bg      = c?.background?.paper;

  const showIncome  = flt.type === "both" || flt.type === "income";
  const showExpense = flt.type === "both" || flt.type === "expense";

  /* --- Carregar utilizadores --- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await apiCall.get("Administrator/User/GetAllUsers", { validateStatus: () => true });
        const list = A(r?.data?.ListUsers ?? r?.data);
        if (!alive) return;
        const mapped = list
          .map((u) => ({
            id: u?.Id || u?.id || u?.UserId || "",
            name: (u?.Email || u?.email || "").toString(),
          }))
          .filter((x) => x.id);
        setUsers(mapped);
        if (mapped[0]) {
          setFlt((p) => ({ ...p, userId: mapped[0].id, walletId: "" }));
        }
      } catch {/* ignore */}
    })();
    return () => { alive = false; };
  }, []);

  /* --- Carregar carteiras quando muda o utilizador --- */
  useEffect(() => {
    let alive = true;
    if (!flt.userId) { setWallets([]); setFlt((p) => ({ ...p, walletId: "" })); return; }
    (async () => {
      try {
        const r = await apiCall.get("Group/UserWallets", {
          params: { userId: flt.userId },
          validateStatus: () => true,
        });
        const list = A(r?.data)
          .map((w) => ({
            id: w?.id || w?.Id || "",
            name: `${w?.name || w?.Name || "—"}${w?.isPrimary ? " (Primary)" : ""}`,
          }))
          .filter((x) => x.id);
        if (!alive) return;
        setWallets(list);
      } catch {
        if (alive) setWallets([]);
      }
    })();
    return () => { alive = false; };
  }, [flt.userId]);

  /* --- Fazer a 1ª pesquisa automaticamente --- */
  const didInitialSearch = useRef(false);
  useEffect(() => {
    if (!didInitialSearch.current && flt.userId) {
      didInitialSearch.current = true;
      (async () => { await doSearch(); })();
    }
  }, [flt.userId]);

  const buildParams = () => {
    const p = { from: flt.from, to: flt.to, granularity: flt.granularity };
    if (flt.userId)   p.userId = flt.userId;
    if (flt.walletId) p.walletId = flt.walletId;
    return p;
  };

  const doSearch = async () => {
    if (!flt.userId) return;
    setLoading(true);
    setError("");
    const params = buildParams();
    try {
      const [sumRes, tsRes, ciRes, ceRes] = await Promise.all([
        apiCall.get("AdminDashboard/Summary",    { params }),
        apiCall.get("AdminDashboard/TimeSeries", { params }),
        apiCall.get("AdminDashboard/Categories", { params: { ...params, type: "income" } }),
        apiCall.get("AdminDashboard/Categories", { params: { ...params, type: "expense" } }),
      ]);

      setSummary(sumRes?.data ?? null);
      setSeries(A(tsRes?.data).map((r) => ({
        label: r?.label ?? "",
        income: N(r?.income),
        expense: N(r?.expense),
      })));
      setCatsIncome(A(ciRes?.data).map((x) => ({ category: x?.category ?? "—", amount: N(x?.amount) })));
      setCatsExpense(A(ceRes?.data).map((x) => ({ category: x?.category ?? "—", amount: N(x?.amount) })));
      if (sumRes?.data?.currency) setCurrency(sumRes.data.currency);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed");
    } finally {
      setLoading(false);
    }
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

  const softUpdating = loading && !!summary;

  return (
    <div className="space-y-6 min-h-screen">
      <Title text={t?.("dashboard.title") || "Dashboard"} subText={t?.("dashboard.subtitle")} />

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard title={t?.("dashboard.kpis.totalIncome") || "Total income"}  value={fmtCurrency(summary?.totalIncome, currency)} />
          <StatCard title={t?.("dashboard.kpis.totalExpense") || "Total expense"} value={fmtCurrency(summary?.totalExpense, currency)} />
          <StatCard title={t?.("dashboard.kpis.net") || "Net"} value={fmtCurrency(summary?.net, currency)} />
          <StatCard title={t?.("dashboard.kpis.progress") || "Progress"} value={`${Math.round((summary?.pctIncomeReceived ?? 0) * 100)}% / ${Math.round((summary?.pctExpensePaid ?? 0) * 100)}%`} />
          <StatCard title={t?.("dashboard.kpis.walletBalance") || "Wallet balance"} value={fmtCurrency((summary?.totalIncome ?? 0) - (summary?.totalExpense ?? 0), currency)} />
        </div>
      )}

      {/* Filtros  */}
      <DashboardFilterBar
        value={flt}
        onChange={(patch) => setFlt((p) => ({ ...p, ...patch }))}
        onSearch={doSearch}
        onClear={clearFilters}
        loading={loading}
        t={t}
        showToggle
        defaultOpen
        options={{ users, wallets }}
      />

      {/* Evolução */}
      <div className="rounded-2xl border p-4" style={{ borderColor: border, background: bg }}>
        <div className="mb-3 font-medium flex items-center gap-2">
          <span>{t?.("dashboard.charts.evolution") || "Evolution"}</span>
          {softUpdating && <span className="text-xs opacity-60">· updating…</span>}
        </div>
        <EvolutionChart
          data={series}
          currency={currency}
          colors={{ grid: border, text: theme.colors.text?.secondary, income: success, expense: danger }}
          showIncome={showIncome}
          showExpense={showExpense}
          bg={bg}
          border={border}
        />
      </div>

      {/* Categorias */}
      <div className="rounded-2xl border p-4" style={{ borderColor: border, background: bg }}>
        <div className="mb-3 font-medium flex items-center gap-2">
          <span>{t?.("dashboard.charts.categories") || "Categories"}</span>
          {softUpdating && <span className="text-xs opacity-60">· updating…</span>}
        </div>
        <CategoriesPies
          incomeData={catsIncome}
          expenseData={catsExpense}
          currency={currency}
          titles={{
            income: t?.("dashboard.charts.income") || "Income",
            expense: t?.("dashboard.charts.expenses") || "Expenses",
          }}
          themeColors={{ bg, border, text: theme.colors.text?.primary }}
        />
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
}

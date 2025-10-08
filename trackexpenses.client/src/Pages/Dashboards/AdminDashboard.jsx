// src/pages/Admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import EvolutionChart from "../../components/Charts/EvolutionChart";
import StatusStackedBar from "../../components/Charts/StatusStackedBar";
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
const lastDay  = (d = new Date()) => new Date(d.getFullYear(), d.getMonth()+1, 0);
const A = (x) => (Array.isArray(x) ? x : x?.$values ? x.$values : []);
const N = (v) => (v == null ? 0 : Number(v));
const pct = (p, t) => (N(t) > 0 ? N(p) / N(t) : 0);
const fmtCurrency = (v, cur="EUR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(N(v));

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
  const [statusIncome, setStatusIncome] = useState([]);
  const [statusExpense, setStatusExpense] = useState([]);
  const [catsIncome, setCatsIncome] = useState([]);
  const [catsExpense, setCatsExpense] = useState([]);
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");

  // theme helpers
  const c = theme.colors;
  const success = c?.success?.main || "#16a34a";
  const danger  = c?.error?.main   || "#ef4444";
  const border  = c?.secondary?.light || "#334155";
  const bg      = c?.background?.paper;

  const showIncome  = flt.type === "both" || flt.type === "income";
  const showExpense = flt.type === "both" || flt.type === "expense";

  // ---- Load users once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await apiCall.get("Administrator/User/GetAllUsers", { validateStatus: () => true });
        const list = A(r?.data?.ListUsers ?? r?.data);
        if (!alive) return;
        const mapped = list
          .map(u => ({ id: u?.Id || u?.id || u?.UserId || "", name: (u?.Email || u?.email || "").toString() }))
          .filter(x => x.id);
        setUsers(mapped);
        if (mapped[0]) {
          // define user por omissão; NÃO dispara pesquisa aqui
          setFlt(p => ({ ...p, userId: mapped[0].id, walletId: "" }));
        }
      } catch {/* ignore */}
    })();
    return () => { alive = false; };
  }, []);

  // ---- Load wallets quando user muda (não pesquisa ainda)
  useEffect(() => {
    let alive = true;
    if (!flt.userId) { setWallets([]); setFlt(p => ({ ...p, walletId: "" })); return; }
    (async () => {
      try {
        const r = await apiCall.get("Group/UserWallets", {
          params: { userId: flt.userId },
          validateStatus: () => true
        });
        const list = A(r?.data)
          .map(w => ({ id: w?.id || w?.Id || "", name: `${w?.name || w?.Name || "—"}${w?.isPrimary ? " (Primary)" : ""}` }))
          .filter(x => x.id);
        if (!alive) return;
        setWallets(list);
      } catch {
        if (alive) setWallets([]);
      }
    })();
    return () => { alive = false; };
  }, [flt.userId]);

  // ---- FAZER 1ª PESQUISA AUTOMÁTICA SÓ UMA VEZ (para mostrar KPIs logo)
  const didInitialSearch = useRef(false);
  useEffect(() => {
    if (!didInitialSearch.current && flt.userId) {
      didInitialSearch.current = true;
      // usa os filtros por omissão (datas atuais) para popular KPIs/charts
      (async () => { await doSearch(); })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const [sumRes, tsRes, stIncRes, stExpRes, ciRes, ceRes] = await Promise.all([
        apiCall.get("AdminDashboard/Summary",     { params }),
        apiCall.get("AdminDashboard/TimeSeries",  { params }),
        apiCall.get("AdminDashboard/StatusSplit", { params: { ...params, type: "income",  granularity: flt.granularity } }),
        apiCall.get("AdminDashboard/StatusSplit", { params: { ...params, type: "expense", granularity: flt.granularity } }),
        apiCall.get("AdminDashboard/Categories",  { params: { ...params, type: "income" } }),
        apiCall.get("AdminDashboard/Categories",  { params: { ...params, type: "expense" } }),
      ]);

      setSummary(sumRes?.data ?? null);
      setSeries(A(tsRes?.data).map(r => ({ label: r?.label ?? "", income: N(r?.income), expense: N(r?.expense) })));
      setStatusIncome(A(stIncRes?.data));
      setStatusExpense(A(stExpRes?.data));
      setCatsIncome(A(ciRes?.data).map(x => ({ category: x?.category ?? "—", amount: N(x?.amount) })));
      setCatsExpense(A(ceRes?.data).map(x => ({ category: x?.category ?? "—", amount: N(x?.amount) })));
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
    // não pesquisamos aqui — só ao clicar Apply
  };

  const statusMerged = useMemo(() => {
    const map = new Map();
    A(statusIncome).forEach((i) => {
      const k = i.label ?? "";
      map.set(k, {
        label: k,
        incomeReceived: pct(i.received, i.expected),
        incomePending:  pct(i.pending,  i.expected),
        expensesPaid: 0,
        expensesPending: 0
      });
    });
    A(statusExpense).forEach((e) => {
      const k = e.label ?? "";
      const row = map.get(k) || { label: k, incomeReceived: 0, incomePending: 0, expensesPaid: 0, expensesPending: 0 };
      row.expensesPaid    = pct(e.paid,    e.expected);
      row.expensesPending = pct(e.pending, e.expected);
      map.set(k, row);
    });
    return Array.from(map.values());
  }, [statusIncome, statusExpense]);

  const softUpdating = loading && !!summary;

  return (
    <div className="space-y-6 min-h-screen">
      <Title text={t?.("dashboard.title") || "Dashboard"} subText={t?.("dashboard.subtitle")} />

      {/* KPIs SEMPRE VISÍVEIS (aparecem logo após 1ª pesquisa automática) */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard title={t?.("dashboard.kpis.totalIncome") || "Total income"}  value={fmtCurrency(summary?.totalIncome, currency)} />
          <StatCard title={t?.("dashboard.kpis.totalExpense") || "Total expense"} value={fmtCurrency(summary?.totalExpense, currency)} />
          <StatCard title={t?.("dashboard.kpis.net") || "Net"}          value={fmtCurrency(summary?.net, currency)} />
          <StatCard title={t?.("dashboard.kpis.progress") || "Progress"}     value={`${Math.round((summary?.pctIncomeReceived ?? 0) * 100)}% / ${Math.round((summary?.pctExpensePaid ?? 0) * 100)}%`} />
          <StatCard title={t?.("dashboard.kpis.walletBalance") || "Wallet balance"} value={fmtCurrency((summary?.totalIncome ?? 0)-(summary?.totalExpense ?? 0), currency)} />
        </div>
      )}

      {/* Filtros (mudam estado, mas só aplicam quando clicas Apply) */}
      <DashboardFilterBar
        value={flt}
        onChange={(patch) => setFlt((p) => ({ ...p, ...patch }))}
        onSearch={doSearch}     // <-- Apply
        onClear={clearFilters}  // <-- Clear (não busca)
        loading={loading}
        t={t}
        tone={{ bg, border }}
        showToggle
        defaultOpen
        options={{
          users: users,
          wallets: wallets,
        }}
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

      {/* Status */}
      <div className="rounded-2xl border p-4" style={{ borderColor: border, background: bg }}>
        <div className="mb-3 font-medium flex items-center gap-2">
          <span>{t?.("dashboard.charts.status") || "Status"}</span>
          {softUpdating && <span className="text-xs opacity-60">· updating…</span>}
        </div>
        <StatusStackedBar
          data={statusMerged}
          t={t}
          colors={{
            grid: border,
            text: theme.colors.text?.secondary,
            income: theme.colors.success?.main,
            incomePending: theme.colors.primary?.main || "#3b82f6",
            expense: theme.colors.error?.main,
            expensePending: "#94a3b8",
          }}
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
          titles={{ income: t?.("dashboard.charts.income") || "Income", expense: t?.("dashboard.charts.expenses") || "Expenses" }}
          themeColors={{ bg, border, text: theme.colors.text?.primary }}
        />
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
}

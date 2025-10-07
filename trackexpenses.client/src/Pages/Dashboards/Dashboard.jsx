import React, { useEffect, useMemo, useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";

import Title from "../../components/Titles/TitlePage";
import StatCard from "../../components/UI/StatCard";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import { useRequireWallet } from "../../services/Authentication/useRequireWallet";

import EvolutionChart from "../../components/Charts/EvolutionChart";
import StatusStackedBar from "../../components/Charts/StatusStackedBar";
import CategoriesPies from "../../components/Charts/CategoriesPies";
import DashboardFilterBar from "../../components/Filters/DashboardFilterBar";

const toISO = (d) => d.toISOString().slice(0, 10);
const firstDayOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const lastDayOfMonth  = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const A = (x) => (Array.isArray(x) ? x : x?.$values ? x.$values : []);
const N = (v) => (v == null ? 0 : Number(v));
const pct = (p, t) => (N(t) > 0 ? N(p) / N(t) : 0);
const fmtCurrency = (v, cur = "EUR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(N(v));

export default function Dashboard() {
  useRequireWallet();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [flt, setFlt] = useState({
    walletId: "",
    from: toISO(firstDayOfMonth()),
    to: toISO(lastDayOfMonth()),
    granularity: "month",
    type: "both",
  });

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

  const c = theme.colors;
  const primary = c?.primary?.main || "#3b82f6";
  const success = c?.success?.main || "#16a34a";
  const danger  = c?.error?.main   || "#ef4444";
  const border  = c?.secondary?.light || "#334155";
  const bg      = c?.background?.paper;

  const showIncome  = flt.type === "both" || flt.type === "income";
  const showExpense = flt.type === "both" || flt.type === "expense";

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await apiCall.get("wallets", { params: { includeArchived: false }, validateStatus: () => true });
        const list = (r?.status >= 200 && r?.status < 300) ? A(r?.data) : [];
        if (cancel) return;
        setWallets(list);
        const primaryW = list.find((w) => w.isPrimary) || list[0];
        setFlt((p) => ({ ...p, walletId: primaryW?.id || "" }));
        if (list[0]?.currency) setCurrency(list[0].currency);
      } catch { if (!cancel) setWallets([]); }
    })();
    return () => { cancel = true; };
  }, []);

  const doSearch = async () => {
    setLoading(true);
    setError("");
    const params = {
      from: flt.from,
      to: flt.to,
      granularity: flt.granularity,
    };
    if (flt.walletId) params.walletId = flt.walletId;

    try {
      const [sumRes, tsRes, stIncRes, stExpRes, ciRes, ceRes] =
        await Promise.all([
          apiCall.get("Dashboard/Summary", { params }),
          apiCall.get("Dashboard/TimeSeries", { params }),
          apiCall.get("Dashboard/StatusSplit",  { params: { ...params, type: "income",  groupBy: flt.granularity } }),
          apiCall.get("Dashboard/StatusSplit",  { params: { ...params, type: "expense", groupBy: flt.granularity } }),
          apiCall.get("Dashboard/Categories",   { params: { ...params, type: "income" } }),
          apiCall.get("Dashboard/Categories",   { params: { ...params, type: "expense" } }),
        ]);

      setSummary(sumRes?.data ?? null);
      setSeries(A(tsRes?.data).map((r) => ({ label: r?.label ?? "", income: N(r?.income), expense: N(r?.expense) })));
      setStatusIncome(A(stIncRes?.data));
      setStatusExpense(A(stExpRes?.data));
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
      from: toISO(firstDayOfMonth()),
      to: toISO(lastDayOfMonth()),
      granularity: "month",
      type: "both",
    }));
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
        expensesPending: 0,
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

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t("dashboard.title")} subText={t("dashboard.subtitle")} />
      </div>

      <DashboardFilterBar
        value={flt}
        onChange={(patch) => setFlt((p) => ({ ...p, ...patch }))}
        onSearch={doSearch}
        onClear={clearFilters}
        loading={loading}
        options={{ wallets }}
        t={t}
        tone={{ bg, border }}
        defaultOpen={true}
        hideToggle={false}
      />

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
          <StatCard
            title={t("dashboard.kpis.totalIncome")}
            value={fmtCurrency(summary?.totalIncome, currency)}
            trend={`${Math.round((summary?.trends?.income ?? 0) * 100)}%`}
            trendColor={(summary?.trends?.income ?? 0) >= 0 ? theme.colors.success?.main : theme.colors.error?.main}
          />
          <StatCard
            title={t("dashboard.kpis.totalExpense")}
            value={fmtCurrency(summary?.totalExpense, currency)}
            trend={`${Math.round((summary?.trends?.expense ?? 0) * 100)}%`}
            trendColor={(summary?.trends?.expense ?? 0) >= 0 ? theme.colors.error?.main : theme.colors.success?.main}
          />
          <StatCard
            title={t("dashboard.kpis.net")}
            value={fmtCurrency(summary?.net, currency)}
            trend={`${Math.round((summary?.trends?.net ?? 0) * 100)}%`}
            trendColor={(summary?.trends?.net ?? 0) >= 0 ? theme.colors.success?.main : theme.colors.error?.main}
          />
          <StatCard
            title={t("dashboard.kpis.progress")}
            value={`${Math.round((summary?.pctIncomeReceived ?? 0) * 100)}% / ${Math.round((summary?.pctExpensePaid ?? 0) * 100)}%`}
            trend={t("dashboard.kpis.progress_hint")}
            trendColor={theme.colors.text?.secondary}
          />
          <StatCard
            title={t("dashboard.kpis.walletBalance")}
            value={fmtCurrency((summary?.totalIncome ?? 0) - (summary?.totalExpense ?? 0), currency)}
            trend={t("dashboard.kpis.walletBalance_hint")}
            trendColor={theme.colors.text?.secondary}
            icon={WalletIcon}
          />
        </div>
      )}

      {/* Evolução */}
      <div className="rounded-2xl border p-4" style={{ borderColor: border, background: bg }}>
        <div className="mb-3 font-medium">{t("dashboard.charts.evolution")}</div>
        <EvolutionChart
          data={series}
          currency={currency}
          colors={{ grid: border, text: theme.colors.text?.secondary, income: success, expense: danger }}
          showIncome={showIncome}
          showExpense={showExpense}
          bg={bg}
          border={border}
          noHoverHighlight
          tooltipSize="md"
        />
      </div>

      {/* Status */}
      <div className="rounded-2xl border p-4" style={{ borderColor: border, background: bg }}>
        <div className="mb-3 font-medium">{t("dashboard.charts.status")}</div>
        <StatusStackedBar
          data={statusMerged}
          t={t}
          colors={{
            text: theme.colors.text?.secondary,
            income: success,
            incomePending: primary,
            expense: danger,
            expensePending: "#94a3b8",
          }}
          showIncome={showIncome}
          showExpense={showExpense}
          bg={bg}
          border={border}
          noHoverHighlight
          tooltipSize="md"
        />
      </div>

      {/* Categorias */}
      <div className="rounded-2xl border p-4" style={{ borderColor: border, background: bg }}>
        <div className="mb-3 font-medium">{t("dashboard.charts.categories")}</div>
        <CategoriesPies
          incomeData={catsIncome}
          expenseData={catsExpense}
          currency={currency}
          titles={{ income: t("dashboard.charts.income"), expense: t("dashboard.charts.expenses") }}
          themeColors={{ bg, border, text: theme.colors.text?.primary }}
          tooltipSize="md"
        />
      </div>

      {error && (
        <div className="rounded-xl p-4 border" style={{ borderColor: danger, background: bg }}>
          <div className="font-medium" style={{ color: danger }}>{t("dashboard.error_title")}</div>
          <div className="text-sm opacity-80">{error}</div>
        </div>
      )}
    </div>
  );
}

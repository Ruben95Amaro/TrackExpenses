// src/pages/Earnings/ListEarnings.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Button from "../../components/Buttons/Button";
import GenericFilter from "../../components/Tables/GenericFilter";
import GenericTable from "../../components/Tables/GenericTable";
import StatCard from "../../components/UI/StatCard";
// import Card from "../../components/UI/Card"; // <-- não usar aqui
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

const EP_LIST     = "Earnings/ListEarnings";
const EP_DELETE   = "Earnings/DeleteEarning";
const EP_WALLETS  = "/wallets?includeArchived=true";
const ROUTE_EDIT  = (id) => `/Earnings/Edit/${id}`;

const unwrap = (v) => (Array.isArray(v) ? v : (v?.$values ?? []));
const N = (v) => (v ?? "").toString().trim();

function Chip({ children }) {
  return (
    <span
      className="inline-block px-2 py-1 rounded-full text-xs"
      style={{ background: "rgba(148,163,184,0.18)", color: "#94A3B8" }}
    >
      {children}
    </span>
  );
}

export default function ListEarnings() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { auth } = useContext(AuthContext) || {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [flt, setFlt] = useState({ q: "", category: "all", wallet: "all", received: "all" });

  const walletMap = useMemo(() => {
    const map = {};
    (wallets || []).forEach((w) => { map[w.Id ?? w.id] = N(w.Name ?? w.name); });
    return map;
  }, [wallets]);

  const walletOptions = useMemo(() => ([
    { value: "all", label: t?.("wallets.all") || "All wallets" },
    ...wallets.map(w => ({ value: w.Id ?? w.id, label: N(w.Name ?? w.name) }))
  ]), [wallets, t]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const email = auth?.Email || "";
        if (!email) return;
        const res = await apiCall.get(EP_LIST, { params: { userEmail: email }, validateStatus: () => true });
        if (res?.status >= 200 && res?.status < 300) {
          const list = Array.isArray(res.data) ? res.data : unwrap(res.data);
          if (alive) setItems(list || []);
        } else if (alive) setErrorSubmit(res?.data?.message || t?.("earnings.empty") || "No data");
      } catch {
        if (alive) setErrorSubmit(t?.("earnings.empty") || "No data");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [auth?.Email, t]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await apiCall.get(EP_WALLETS, { validateStatus: () => true });
        if (!alive) return;
        const list = (r?.status >= 200 && r?.status < 300)
          ? (Array.isArray(r.data) ? r.data : unwrap(r.data))
          : [];
        setWallets(list || []);
      } catch {/* ignore */}
    })();
    return () => { alive = false; };
  }, []);

  const categoryOptions = useMemo(() => {
    const names = new Set((items || []).map((x) => N(x?.Category)).filter(Boolean));
    return [
      { value: "all", label: t?.("common.all") || "All" },
      ...[...names].sort().map((v) => ({ value: v, label: v })),
    ];
  }, [items, t]);

  const filtered = useMemo(() => {
    const q = (flt.q || "").toLowerCase();
    const c = (flt.category || "all").toLowerCase();
    const w = (flt.wallet || "all");
    const rec = (flt.received || "all").toLowerCase();

    return (items || [])
      .map((e) => ({ ...e, _instances: unwrap(e?.Instances) }))
      .filter((e) => {
        const title = N(e?.Title).toLowerCase();
        const cat   = N(e?.Category).toLowerCase();
        const walletOk = w === "all" || (e?.WalletId && String(e?.WalletId) === String(w));
        const textOk   = !q || title.includes(q) || cat.includes(q) || (walletMap[e?.WalletId] || "").toLowerCase().includes(q);
        const catOk    = c === "all" || cat === c;

        const recCount = e._instances.filter(i => (i.IsReceived || i.ReceivedAtUtc)).length;
        const totCount = e._instances.length || 0;
        const full     = totCount > 0 && recCount === totCount;
        const recOk    = rec === "all" || (rec === "received" && full) || (rec === "pending" && !full);

        return walletOk && textOk && catOk && recOk;
      });
  }, [items, flt, walletMap]);

  const totalPlanned  = useMemo(() => filtered.reduce((a, e) => a + Number(e?.Amount || 0), 0), [filtered]);
  const totalReceived = useMemo(() => filtered.reduce((a, e) => a + unwrap(e?.Instances).filter(i => (i.IsReceived || i.ReceivedAtUtc)).length, 0), [filtered]);
  const totalInst     = useMemo(() => filtered.reduce((a, e) => a + unwrap(e?.Instances).length, 0), [filtered]);

  const columns = [
    { key: "title", headerKey: "earnings.table.title", accessor: (e) => N(e?.Title) || "-" },
    { key: "wallet", headerKey: "wallets.one", accessor: (e) => walletMap[e?.WalletId] ? <Chip>{walletMap[e?.WalletId]}</Chip> : "-" },
    { key: "category", headerKey: "earnings.table.category", accessor: (e) => N(e?.Category) ? <Chip>{N(e?.Category)}</Chip> : "-" },
    { key: "value", headerKey: "earnings.table.total", accessor: (e) => <span style={{ color: theme.colors.success.main, fontWeight: 600 }}>{Number(e?.Amount || 0).toLocaleString(undefined, { style: "currency", currency: "EUR" })}</span> },
    {
      key: "received",
      headerKey: "earnings.table.instances",
      accessor: (e) => {
        const inst = unwrap(e?.Instances);
        const rec  = inst.filter(i => i.IsReceived || i.ReceivedAtUtc).length;
        const tot  = inst.length || 0;
        return `${rec}/${tot}`;
      },
    },
  ];

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header + criar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t?.("earnings.list") || "Earnings"} />
        <Button onClick={() => navigate("/CreateEarning")}>
          {t?.("earnings.new") || "New earning"}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t?.("earnings.table.total") || "Total planned"} value={totalPlanned.toLocaleString(undefined,{style:"currency",currency:"EUR"})} />
        <StatCard title={t?.("earnings.status.received") || "Received"} value={`${totalReceived}/${totalInst}`} />
        <StatCard title={t?.("earnings.status.not_received") || "Pending"} value={`${Math.max(0,totalInst-totalReceived)}/${totalInst}`} />
      </div>

      {/* Filtro: botão de toggle FORA do painel (sem Card) */}
      <GenericFilter
        className="mt-2"
        value={flt}
        onChange={setFlt}
        t={t}
        theme={theme}
        showToggle
        defaultOpen
        showSearch
        searchPlaceholder={t?.("earnings.searchPlaceholder") || "Search name, description or category..."}
        filters={[
          { key: "category", type: "select", options: categoryOptions },
          { key: "wallet",   type: "select", options: walletOptions },
          {
            key: "received",
            type: "select",
            options: [
              { value: "all",      label: t?.("common.all") || "All" },
              { value: "received", label: t?.("earnings.status.received") || "Received" },
              { value: "pending",  label: t?.("earnings.status.not_received") || "Pending" },
            ],
          },
        ]}
      />

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="relative overflow-x-auto">
          <GenericTable
            filteredData={filtered}
            columns={columns}
            theme={theme}
            t={t}
            loading={loading}
            rowKey={(e) => e?.Id}
            stickyHeader
            emptyMessage={t?.("earnings.empty") || "No results"}
            edit={{ enabled: true, onEdit: (e) => navigate(ROUTE_EDIT(e?.Id)) }}
            remove={{
              enabled: true,
              confirmMessage: t?.("earnings.deleteConfirm") || "Delete?",
              doDelete: async (e) => {
                const res = await apiCall.post(EP_DELETE, { Id: e?.Id }, { validateStatus: () => true });
                if (res?.status >= 200 && res?.status < 300) {
                  setItems((prev) => prev.filter((x) => x.Id !== e.Id));
                  return true;
                }
                return false;
              },
              onError: (err) => setErrorSubmit(err?.message || "Delete failed"),
            }}
          />
        </div>
      </div>

      {errorSubmit && <div className="text-sm text-red-600">{errorSubmit}</div>}
    </div>
  );
}

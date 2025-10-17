// src/pages/Earnings/ListEarnings.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import Title from "../../components/Titles/TitlePage";
import Button from "../../components/Buttons/Button";
import GenericFilter from "../../components/Tables/GenericFilter";
import GenericTable from "../../components/Tables/GenericTable";
import StatCard from "../../components/UI/StatCard";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

const EP_LIST = "Earnings/ListEarnings";
const EP_DELETE = "Earnings/DeleteEarning";
const EP_WALLETS = "/wallets?includeArchived=true";
const ROUTE_EDIT = (id) => `/Earnings/Edit/${id}`;

const unwrap = (v) => (Array.isArray(v) ? v : v?.$values ?? []);
const N = (v) => (v ?? "").toString().trim();
const norm = (v) => String(v ?? "").trim().toUpperCase();

function Badge({ children, tone = "info" }) {
  const map =
    {
      ok: { bg: "rgba(16,185,129,0.15)", fg: "#10B981" },
      err: { bg: "rgba(239,68,68,0.15)", fg: "#EF4444" },
      info: { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6" },
      warn: { bg: "rgba(245,158,11,0.15)", fg: "#F59E0B" },
    }[tone] || { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6" };

  return (
    <span
      className="inline-block px-2 py-1 rounded-full text-xs"
      style={{ background: map.bg, color: map.fg, whiteSpace: "nowrap" }}
    >
      {children}
    </span>
  );
}

export default function ListEarnings() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { auth, roles } = useContext(AuthContext) || {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [flt, setFlt] = useState({ q: "", category: "all", wallet: "all", received: "all" });

  const roleList = Array.isArray(roles) ? roles : roles ? [roles] : auth?.Roles || [];
  const canModify = !roleList.map(norm).some((r) => r === "USER" || r === "GROUPMEMBER" || r === "GROUP_MEMBER");

  const walletMap = useMemo(() => {
    const map = {};
    (wallets || []).forEach((w) => {
      map[w.Id ?? w.id] = N(w.Name ?? w.name);
    });
    return map;
  }, [wallets]);

  const walletOptions = useMemo(
    () => [
      { value: "all", label: t?.("wallets.all") || "All wallets" },
      ...wallets.map((w) => ({ value: w.Id ?? w.id, label: N(w.Name ?? w.name) })),
    ],
    [wallets, t]
  );

  /* --------------------------- fetch earnings --------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrorSubmit(null);
        const email = auth?.Email || "";
        if (!email) return;
        const res = await apiCall.get(EP_LIST, {
          params: { userEmail: email },
          validateStatus: () => true,
        });
        if (res?.status >= 200 && res?.status < 300) {
          const list = Array.isArray(res.data) ? res.data : unwrap(res.data);
          if (alive) setItems(list || []);
        } else if (alive) {
          setErrorSubmit(res?.data?.message || t?.("earnings.empty") || "No data");
        }
      } catch {
        if (alive) setErrorSubmit(t?.("earnings.empty") || "No data");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [auth?.Email, t]);

  /* --------------------------- fetch wallets ---------------------------- */
  useEffect(() => {
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
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ---------------------------- category opts --------------------------- */
  const categoryOptions = useMemo(() => {
    const names = new Set((items || []).map((x) => N(x?.Category)).filter(Boolean));
    return [
      { value: "all", label: t?.("common.allCategories") || "All categories" },
      ...[...names].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v })),
    ];
  }, [items, t]);

  /* ----------------------------- apply filters -------------------------- */
  const filtered = useMemo(() => {
    const q = (flt.q || "").toLowerCase().trim();
    const c = (flt.category || "all").toLowerCase();
    const w = flt.wallet || "all";
    const rec = (flt.received || "all").toLowerCase();

    return (items || [])
      .map((e) => ({ ...e, _instances: unwrap(e?.Instances) }))
      .filter((e) => {
        const title = N(e?.Title).toLowerCase();
        const desc = N(e?.Description).toLowerCase();
        const cat = N(e?.Category).toLowerCase();
        const matchesText = !q || title.includes(q) || desc.includes(q) || cat.includes(q);
        const matchesCat = c === "all" || cat === c;
        const matchesWallet = w === "all" || (e?.WalletId && String(e.WalletId) === String(w));

        const recCount = e._instances.filter((i) => i.IsReceived || i.ReceivedAtUtc).length;
        const totCount = e._instances.length || 0;
        const isFullyReceived = totCount > 0 && recCount === totCount;
        const matchesRec =
          rec === "all" ||
          (rec === "received" && isFullyReceived) ||
          (rec === "pending" && !isFullyReceived);

        return matchesText && matchesCat && matchesWallet && matchesRec;
      });
  }, [items, flt]);

  /* ----------------------------- KPI cards ------------------------------ */
  const totalPlanned = useMemo(
    () => filtered.reduce((acc, e) => acc + Number(e?.Amount || 0), 0),
    [filtered]
  );
  // Mantemos KPIs de recebidas/pendentes como contagem de instâncias
  const totalInst = useMemo(
    () => filtered.reduce((a, e) => a + unwrap(e?.Instances).length, 0),
    [filtered]
  );
  const totalReceivedInst = useMemo(
    () =>
      filtered.reduce(
        (a, e) => a + unwrap(e?.Instances).filter((i) => i.IsReceived || i.ReceivedAtUtc).length,
        0
      ),
    [filtered]
  );

  /* ------------------------------ table cols ---------------------------- */
  const columns = [
    { key: "title", headerKey: "earnings.table.title", accessor: (e) => N(e?.Title) || "-" },
    {
      key: "wallet",
      headerKey: "wallet",
      accessor: (e) => {
        const nm = walletMap[e?.WalletId] || "-";
        return nm !== "-" ? <Badge tone="info">{nm}</Badge> : "-";
      },
    },
    {
      key: "category",
      headerKey: "earnings.table.category",
      accessor: (e) => (N(e?.Category) ? <Badge tone="warn">{N(e?.Category)}</Badge> : "-"),
    },
    {
      key: "value",
      headerKey: "earnings.table.total",
      accessor: (e) => (
        <span style={{ color: theme.colors.success.main, fontWeight: 600 }}>
          {Number(e?.Amount || 0).toLocaleString(undefined, {
            style: "currency",
            currency: "EUR",
          })}
        </span>
      ),
    },
    {
      key: "received",
      headerKey: "earnings.table.instances",
      accessor: (e) => {
        const inst = unwrap(e?.Instances);
        const rec = inst.filter((i) => i.IsReceived || i.ReceivedAtUtc).length;
        const tot = inst.length || 0;
        const full = tot ? rec === tot : false;
        return <Badge tone={full ? "ok" : "err"}>{tot ? `${rec}/${tot}` : "0/0"}</Badge>;
      },
    },
  ];

  /* ------------------------------- render ------------------------------- */
  return (
    <div className="space-y-6 min-h-screen">
      {/* Header: título + ação com tooltip como em ListExpenses */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t?.("earnings.list") || "Earnings"} />

        <div className="relative group inline-flex self-center">
          <Button
            variant="primary"
            size="md"
            fullWidth={false}
            onClick={() => canModify && navigate("/CreateEarning")}
            disabled={!canModify}
            className="shrink-0"
            aria-describedby="tip-earn-create"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t?.("earnings.new") || "New earning"}
            </span>
          </Button>

          {!canModify && (
            <span
              id="tip-earn-create"
              className="
                pointer-events-none absolute right-0 
                top-[calc(100%+0.25rem)]
                text-xs px-2 py-1 rounded-md shadow-lg
                opacity-0 group-hover:opacity-100 transition-opacity duration-200
              "
              style={{
                backgroundColor: theme?.colors?.background?.paper,
                color: theme?.colors?.text?.secondary,
                border: `1px solid ${theme?.colors?.secondary?.light}`,
                whiteSpace: "nowrap",
              }}
              role="status"
            >
              {t?.("common.noPermission") || "Sem permissão para criar/deseditar."}
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={t?.("earnings.table.total") || "Total planned"}
          value={totalPlanned.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
        />
        <StatCard
          title={t?.("earnings.status.received") || "Received"}
          value={`${totalReceivedInst}/${totalInst}`}
        />
        <StatCard
          title={t?.("earnings.status.not_received") || "Pending"}
          value={`${Math.max(0, totalInst - totalReceivedInst)}/${totalInst}`}
        />
      </div>

      {/* Filtros fora de Card, como em ListWallets/ListExpenses */}
      <GenericFilter
        className="mt-2"
        value={flt}
        onChange={setFlt}
        t={t}
        theme={theme}
        showToggle
        defaultOpen
        showSearch
        searchPlaceholder={
          t?.("earnings.searchPlaceholder") || "Search name, description or category..."
        }
        filters={[
          { key: "category", type: "select", label: t?.("earnings.category") || "Category", options: categoryOptions },
          { key: "wallet",   type: "select", label: t?.("earnings.wallet")   || "Wallet",   options: walletOptions },
          {
            key: "received",
            type: "select",
            label: t?.("earnings.receivedStatus") || "Received status",
            options: [
              { value: "all", label: t?.("common.all") || "All" },
              { value: "received", label: t?.("earnings.status.received") || "Received" },
              { value: "pending", label: t?.("earnings.status.not_received") || "Pending" },
            ],
          },
        ]}
      />

      {/* Tabela como em ListExpenses (sem Card), com minTableWidth e truncate */}
      <GenericTable
        filteredData={filtered}
        columns={columns}
        theme={theme}
        t={t}
        loading={loading}
        rowKey={(e) => e?.Id}
        stickyHeader
        truncateKeys={["title", "category", "wallet"]}
        minTableWidth="76rem"
        emptyMessage={t?.("earnings.empty") || "No results"}
        edit={{
          enabled: canModify,
          onEdit: (e) => navigate(ROUTE_EDIT(e?.Id)),
        }}
        remove={{
          enabled: canModify,
          confirmMessage: t?.("earnings.deleteConfirm") || "Are you sure you want to delete this earning?",
          doDelete: async (e) => {
            const res = await apiCall.post(
              EP_DELETE,
              { Id: e?.Id },
              { validateStatus: () => true }
            );
            if (res?.status >= 200 && res?.status < 300) {
              setItems((prev) => prev.filter((x) => x.Id !== e.Id));
              return true;
            }
            return false;
          },
          onError: (err) => setErrorSubmit(err?.message || "Delete failed"),
        }}
      />

      {errorSubmit && (
        <div className="text-sm text-red-600" role="alert">
          {errorSubmit}
        </div>
      )}
    </div>
  );
}

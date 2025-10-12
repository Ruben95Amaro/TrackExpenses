// src/pages/Expenses/ListExpenses.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Button from "../../components/Buttons/Button";
import GenericFilter from "../../components/Tables/GenericFilter";
import GenericTable from "../../components/Tables/GenericTable";
import StatCard from "../../components/UI/StatCard";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

const EP_LIST = "Expenses/ListExpenses";
const EP_DELETE = "Expenses/DeleteExpense";
const EP_WALLETS = "/wallets?includeArchived=true";
const ROUTE_EDIT = (id) => `/Expenses/Edit/${id}`;

const unwrap = (v) => (Array.isArray(v) ? v : v?.$values ?? []);
const N = (v) => (v ?? "").toString().trim();

function Chip({ children }) {
  return (
    <span
      className="inline-block px-2 py-1 rounded-full text-xs"
      style={{ background: "rgba(148,163,184,0.18)", color: "#94A3B8", whiteSpace: "nowrap" }}
    >
      {children}
    </span>
  );
}

export default function ListExpenses() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { auth } = useContext(AuthContext) || {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [flt, setFlt] = useState({ q: "", category: "all", wallet: "all", paid: "all" });

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

  /* --------------------------- fetch expenses --------------------------- */
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
          setErrorSubmit(res?.data?.message || "Could not load expenses.");
        }
      } catch {
        if (alive) setErrorSubmit("Could not load expenses.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [auth?.Email]);

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
      ...[...names]
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ value: v, label: v })),
    ];
  }, [items, t]);

  /* ----------------------------- apply filters -------------------------- */
  const filtered = useMemo(() => {
    const q = (flt.q || "").toLowerCase().trim();
    const c = (flt.category || "all").toLowerCase();
    const w = flt.wallet || "all";
    const paidFilter = (flt.paid || "all").toLowerCase();

    return (items || [])
      .map((e) => ({ ...e, _instances: unwrap(e?.Instances) }))
      .filter((e) => {
        const name = N(e?.Name).toLowerCase();
        const desc = N(e?.Description).toLowerCase();
        const cat = N(e?.Category).toLowerCase();
        const matchesText = !q || name.includes(q) || desc.includes(q) || cat.includes(q);
        const matchesCat = c === "all" || cat === c;
        const matchesWallet = w === "all" || (e?.WalletId && String(e.WalletId) === String(w));

        const paidCount = e._instances.filter((i) => i.IsPaid).length;
        const totalCount = e._instances.length || 0;
        const isFullyPaid = totalCount > 0 && paidCount === totalCount;
        const matchesPaid =
          paidFilter === "all" ||
          (paidFilter === "paid" && isFullyPaid) ||
          (paidFilter === "unpaid" && !isFullyPaid);

        return matchesText && matchesCat && matchesWallet && matchesPaid;
      });
  }, [items, flt]);

  /* ----------------------------- KPI cards ------------------------------ */
  const totalPlanned = useMemo(
    () => filtered.reduce((acc, e) => acc + Number(e?.Value || 0), 0),
    [filtered]
  );
  const totalAlreadyPaid = useMemo(
    () => filtered.reduce((acc, e) => acc + Number(e?.PayAmount || 0), 0),
    [filtered]
  );
  const remaining = Math.max(0, totalPlanned - totalAlreadyPaid);

  /* ------------------------------ table cols ---------------------------- */
  const columns = [
    { key: "name", headerKey: "name", accessor: (w) => N(w?.Name) || "-" },
    {
      key: "wallet",
      headerKey: "wallet",
      accessor: (w) => {
        const nm = walletMap[w?.WalletId] || "-";
        return nm !== "-" ? <Chip>{nm}</Chip> : "-";
      },
    },
    {
      key: "category",
      headerKey: "category",
      accessor: (w) => N(w?.Category) ? <Chip>{N(w?.Category)}</Chip> : "-",
    },
    {
      key: "value",
      headerKey: "amount",
      accessor: (w) => (
        <span style={{ color: theme.colors.error.main, fontWeight: 600 }}>
          {Number(w?.Value || 0).toLocaleString(undefined, {
            style: "currency",
            currency: "EUR",
          })}
        </span>
      ),
    },
    {
      key: "paid",
      headerKey: "paid",
      accessor: (w) => {
        const inst = unwrap(w?.Instances);
        const paid = inst.filter((i) => i.IsPaid).length;
        const tot = inst.length || 0;
        return tot ? `${paid}/${tot}` : "0/0";
      },
    },
    {
      key: "next",
      headerKey: "date",
      accessor: (w) => {
        const next = unwrap(w?.Instances)
          .filter((i) => !i.IsPaid)
          .sort((a, b) => new Date(a.DueDate) - new Date(b.DueDate))[0];
        return next?.DueDate
          ? new Date(next.DueDate).toLocaleDateString()
          : "-";
      },
    },
  ];

  /* ------------------------------- render ------------------------------- */
  return (
    <div className="space-y-6 min-h-screen">
      {/* header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t?.("expenses.list") || "Expenses"} />
        <Button onClick={() => navigate("/CreateExpense")}>
          {t?.("expenses.new") || "New expense"}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={t?.("expenses.kpis.planned") || "Planned (all)"}
          value={totalPlanned.toLocaleString(undefined, {
            style: "currency",
            currency: "EUR",
          })}
        />
        <StatCard
          title={t?.("expenses.kpis.paid") || "Already paid"}
          value={totalAlreadyPaid.toLocaleString(undefined, {
            style: "currency",
            currency: "EUR",
          })}
        />
        <StatCard
          title={t?.("expenses.kpis.remain") || "Remaining"}
          value={remaining.toLocaleString(undefined, {
            style: "currency",
            currency: "EUR",
          })}
        />
      </div>

      {/* filters */}
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
          t?.("expenses.searchPlaceholder") ||
          "Search name, description or category..."
        }
        filters={[
          {
            key: "category",
            type: "select",
            label: t?.("expenses.category") || "Category",
            options: categoryOptions,
          },
          {
            key: "wallet",
            type: "select",
            label: t?.("expenses.wallet") || "Wallet",
            options: walletOptions,
          },
          {
            key: "paid",
            type: "select",
            label: t?.("expenses.paymentStatus") || "Payment status",
            options: [
              { value: "all", label: t?.("common.all") || "All" },
              { value: "paid", label: t?.("expenses.filter.fullyPaid") || "Fully paid" },
              { value: "unpaid", label: t?.("expenses.filter.notPaid") || "Not fully paid" },
            ],
          },
        ]}
      />

      {/* table */}
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
            truncateKeys={["name", "category", "wallet"]}
            minTableWidth="76rem"
            headClassName="bg-gray-50"
            emptyMessage={t?.("common.noResults") || "No results"}
            edit={{
              enabled: true,
              onEdit: (e) => navigate(ROUTE_EDIT(e?.Id)),
            }}
            remove={{
              enabled: true,
              confirmMessage:
                t?.("common.confirmDelete") ||
                "Are you sure you want to delete this expense?",
              doDelete: async (w) => {
                const res = await apiCall.post(
                  EP_DELETE,
                  { Id: w?.Id },
                  { validateStatus: () => true }
                );
                if (res?.status >= 200 && res?.status < 300) {
                  setItems((prev) => prev.filter((x) => x.Id !== w.Id));
                  return true;
                }
                return false;
              },
              onError: (err) =>
                setErrorSubmit(
                  err?.message || "Error deleting expense."
                ),
            }}
          />
        </div>
      </div>

      {errorSubmit && (
        <div className="text-sm text-red-600" role="alert">
          {errorSubmit}
        </div>
      )}
    </div>
  );
}

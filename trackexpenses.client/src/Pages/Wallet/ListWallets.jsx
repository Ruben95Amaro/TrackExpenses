// src/pages/Wallets/ListWallets.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import Title from "../../components/Titles/TitlePage";
import Button from "../../components/Buttons/Button";
import GenericFilter from "../../components/Tables/GenericFilter";
import GenericTable from "../../components/Tables/GenericTable";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

/* ----------------------------- UI helpers ----------------------------- */
function Badge({ children, tone = "info" }) {
  const map = {
    ok:   { bg: "rgba(16,185,129,0.15)", fg: "#10B981" },
    err:  { bg: "rgba(239,68,68,0.15)", fg: "#EF4444" },
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

/* ----------------------------- premium check ----------------------------- */
const norm = (v) => String(v ?? "").trim().toUpperCase();
function isUserPremium({ roles, auth }) {
  if (Array.isArray(roles) && roles.some((r) => norm(r) === "PREMIUM")) return true;
  const flag = auth?.isPremium ?? auth?.IsPremium ?? auth?.premium ?? auth?.Premium;
  if (typeof flag === "boolean") return flag;
  const plan = norm(auth?.subscription?.plan ?? auth?.Subscription?.Plan ?? auth?.plan ?? auth?.Plan);
  return ["PREMIUM", "PRO", "PLUS"].includes(plan);
}

/* =============================== PAGE =============================== */
export default function ListWallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorSubmit, setErrorSubmit] = useState(null);

  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { roles, auth } = useContext(AuthContext) || {};

  const [flt, setFlt] = useState({ q: "", status: "all" });

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const res = await apiCall.get("/wallets?includeArchived=true");
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : data?.$values ?? [];
      setWallets(list);
    } catch (e) {
      setErrorSubmit(e?.message || "Erro ao carregar carteiras.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const statusOptions = useMemo(
    () => [
      { value: "all",      label: t?.("common.all")       || "Todos" },
      { value: "active",   label: t?.("common.active")    || "Ativas" },
      { value: "archived", label: t?.("common.archived")  || "Arquivadas" },
      { value: "primary",  label: t?.("common.primary")   || "Primária" },
    ],
    [t]
  );

  const handleClear = () => setFlt({ q: "", status: "all" });

  const filteredWallets = useMemo(() => {
    const q = (flt.q || "").toLowerCase().trim();
    const status = (flt.status || "all").toLowerCase();

    return (wallets || []).filter((w) => {
      const name = (w?.name || "").toLowerCase();
      const currency = (w?.currency || "EUR").toLowerCase();
      const isArchived = !!w?.isArchived;
      const isPrimary = !!w?.isPrimary;

      const matchesText = !q || name.includes(q) || currency.includes(q);
      const matchesStatus =
        status === "all" ||
        (status === "active" && !isArchived) ||
        (status === "archived" && isArchived) ||
        (status === "primary" && isPrimary);

      return matchesText && matchesStatus;
    });
  }, [wallets, flt]);

  /* ---------- regra de criação ---------- */
  const premium = isUserPremium({ roles, auth });
  const activeCount = useMemo(
    () => (wallets || []).filter((w) => !w?.isArchived).length,
    [wallets]
  );
  const canCreate = premium || activeCount < 1;

  const columns = [
    {
      key: "name",
      headerKey: "name",
      accessor: (w) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{w?.name || "-"}</span>
          {w?.isPrimary && <Badge tone="info">{t?.("common.primary") || "Primary"}</Badge>}
        </div>
      ),
    },
    {
      key: "currency",
      headerKey: "currency",
      accessor: () => <Badge tone="info">EUR (€)</Badge>,
    },
    {
      key: "status",
      headerKey: "status",
      accessor: (w) =>
        w?.isArchived
          ? <Badge tone="err">{t?.("common.archived") || "Archived"}</Badge>
          : <Badge tone="ok">{t?.("common.active") || "Active"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t?.("wallets.list") || "Carteiras"} />

        {/* Botão: quando desativado, mostrar texto no hover (sem tooltip) */}
        <div className="relative group inline-flex flex-col items-end">
          <Button
            variant="primary"
            size="md"
            fullWidth={false}
            onClick={() => canCreate && navigate("/CreateWallet")}
            disabled={!canCreate}
            className="shrink-0"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t?.("wallets.new") || "Nova Wallet"}
            </span>
          </Button>

          {!canCreate && (
            <span
              className="
                mt-2 text-xs text-gray-600 dark:text-gray-300
                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                select-none
              "
              role="status"
            >
              {t?.("wallets.limitReachedTip") ||
                "Precisas de Premium para criar mais carteiras."}
            </span>
          )}
        </div>
      </div>

      <GenericFilter
        className="mt-2"
        value={flt}
        onChange={setFlt}
        onClear={handleClear}
        t={t}
        theme={theme}
        showToggle
        defaultOpen
        showSearch
        searchPlaceholder={t?.("wallets.searchPlaceholder") || "Pesquisar carteiras..."}
        filters={[
          {
            key: "status",
            type: "select",
            label: t?.("wallets.status") || "Status",   // <- LABEL ADICIONADO
            options: statusOptions,
            defaultValue: "all",
          },
        ]}
      />

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="relative overflow-x-auto overflow-hidden">
          <GenericTable
            filteredData={filteredWallets}
            columns={columns}
            theme={theme}
            t={t}
            loading={loading}
            rowKey={(w) => w?.id}
            stickyHeader
            truncateKeys={["name"]}
            minTableWidth="48rem"
            headClassName="bg-gray-50 !rounded-none"
            headerCellClassName="!rounded-none"
            emptyMessage={t?.("common.noResults") || "Sem resultados"}
            edit={{
              enabled: true,
              navigate,
              navigateTo: (w) => `/EditWallet/${w.id}`,
            }}
            remove={{
              enabled: true,
              confirmMessage:
                t?.("common.confirmDelete") ||
                "Tens a certeza que queres apagar esta carteira?",
              doDelete: async (w) => {
                try {
                  await apiCall.delete(`/wallets/${w.id}`);
                  setWallets((prev) => prev.filter((x) => x.id !== w.id));
                  return true;
                } catch {
                  return false;
                }
              },
              onError: (err) =>
                setErrorSubmit(err?.message || "Erro ao apagar carteira."),
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

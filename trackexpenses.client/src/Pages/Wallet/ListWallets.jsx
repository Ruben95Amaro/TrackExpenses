import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import Title from "../../components/Titles/TitlePage";
import Button from "../../components/Buttons/Button";
import GenericFilter from "../../components/Tables/GenericFilter";
import GenericTable from "../../components/Tables/GenericTable";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utils/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

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

const norm = (v) => String(v ?? "").trim().toUpperCase();
function isUserPremium({ roles, auth }) {
  if (Array.isArray(roles) && roles.some((r) => norm(r) === "PREMIUM")) return true;
  const flag = auth?.isPremium ?? auth?.IsPremium ?? auth?.premium ?? auth?.Premium;
  if (typeof flag === "boolean") return flag;
  const plan = norm(
    auth?.subscription?.plan ?? auth?.Subscription?.Plan ?? auth?.plan ?? auth?.Plan
  );
  return ["PREMIUM", "PRO", "PLUS"].includes(plan);
}

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
      console.log('AAAAAAAAAAAAAAAAAAAAAAAA');
      const res = await apiCall.get("/wallets?includeArchived=true");
      console.log('res', res);
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : data?.$values ?? [];
      setWallets(list);
    } catch (e) {
      setErrorSubmit(e?.message || t("wallets.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("common.all") },
      { value: "active", label: t("common.active") },
      { value: "archived", label: t("common.archived") },
      { value: "primary", label: t("common.primary") },
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
          {w?.isPrimary && (
            <Badge tone="info">{t("common.primary")}</Badge>
          )}
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
        w?.isArchived ? (
          <Badge tone="err">{t("common.archived")}</Badge>
        ) : (
          <Badge tone="ok">{t("common.active")}</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t("wallets.list")} />

        <div className="relative group inline-flex self-center">
          <Button
            variant="primary"
            size="md"
            fullWidth={false}
            onClick={() => canCreate && navigate("/CreateWallet")}
            disabled={!canCreate}
            className="shrink-0"
            aria-describedby="tip-wallet-limit"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("wallets.new")}
            </span>
          </Button>

          {!canCreate && (
            <span
              id="tip-wallet-limit"
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
              {t("wallets.limitReachedTip")}
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
        searchPlaceholder={t("wallets.searchPlaceholder")}
        filters={[
          {
            key: "status",
            type: "select",
            options: statusOptions,
            defaultValue: "all",
          },
        ]}
      />

      <GenericTable
        filteredData={filteredWallets}
        columns={columns}
        theme={theme}
        t={t}
        i18nPrefix="common"   
        loading={loading}
        rowKey={(w) => w?.id}
        stickyHeader
        truncateKeys={["name"]}
        minTableWidth="48rem"
        emptyMessage={t("common.noResults")}
        edit={{
          enabled: true,
          navigate,
          navigateTo: (w) => `/EditWallet/${w.id}`,
        }}
        remove={{
          enabled: true,
          getConfirmMessage: (w) =>
            w?.isPrimary
              ? t("wallets.deletePrimaryWarn")
              : t("common.confirmDelete"),
          doDelete: async (w) => {
            const res = await apiCall.delete(`/wallets/${w.id}`);
            if (res?.ok) {
              setWallets((prev) => prev.filter((x) => x.id !== w.id));
              return true;
            }
            const msg = res?.error?.message || t("wallets.deleteError");
            window.alert(msg);
            throw new Error(msg);
          },
          onError: (err) =>
            setErrorSubmit(err?.message || t("wallets.deleteError")),
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

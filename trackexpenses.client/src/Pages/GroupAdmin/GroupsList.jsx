// src/pages/Groups/ListGroups.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Button from "../../components/Buttons/Button";
import GenericFilter from "../../components/Tables/GenericFilter";
import GenericTable from "../../components/Tables/GenericTable";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

/** Badge simples */
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

export default function ListGroups() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { auth } = useContext(AuthContext) || {};

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorSubmit, setErrorSubmit] = useState(null);

  const [flt, setFlt] = useState({ q: "", scope: "all" });

  const unwrap = (v) => (Array.isArray(v) ? v : v?.$values ?? []);
  const getAdmin = (g) => g?.admin ?? g?.Admin ?? null;
  const getMembers = (g) => unwrap(g?.members ?? g?.Members);

  const rolesArr = useMemo(() => {
    const raw = (auth?.Roles ?? auth?.Role ?? auth?.roles ?? auth?.role) ?? [];
    return (Array.isArray(raw) ? raw : [raw]).map((x) =>
      String(x || "").toUpperCase()
    );
  }, [auth]);
  const isGroupAdmin = rolesArr.includes("GROUPADMINISTRATOR");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrorSubmit(null);
        const email = auth?.Email || "";
        const res = await apiCall.get("/Group/List", {
          params: email ? { email } : undefined,
          validateStatus: () => true,
        });
        if (res?.status >= 200 && res?.status < 300) {
          const raw = res?.data;
          const list = Array.isArray(raw) ? raw : raw?.$values ?? [];
          if (alive) setGroups(list);
        } else if (alive) {
          setErrorSubmit(res?.data?.message || "Could not load groups.");
        }
      } catch {
        if (alive) setErrorSubmit("Could not load groups.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [auth?.Email]);

  const scopeOptions = useMemo(
    () => [
      { value: "all", label: t?.("common.all") || "All" },
      { value: "with", label: t?.("groups.withMembers") || "With members" },
      { value: "empty", label: t?.("groups.noMembers") || "No members" },
    ],
    [t]
  );

  const filtered = useMemo(() => {
    const q = (flt.q || "").toLowerCase().trim();
    const scope = (flt.scope || "all").toLowerCase();
    return (groups || []).filter((g) => {
      const name = (g?.name ?? g?.Name ?? "").toLowerCase();
      const admin = getAdmin(g);
      const adminText = `${admin?.fullName ?? admin?.FullName ?? ""} ${
        admin?.email ?? admin?.Email ?? ""
      }`
        .trim()
        .toLowerCase();
      const membersCount = getMembers(g).length;
      const matchesText = !q || name.includes(q) || adminText.includes(q);
      const matchesScope =
        scope === "all" ||
        (scope === "with" && membersCount > 0) ||
        (scope === "empty" && membersCount === 0);
      return matchesText && matchesScope;
    });
  }, [groups, flt]);

  const doEdit = (g) => {
    const id = g?.id ?? g?.Id;
    if (!id) return;
    navigate(`/Groups/Edit/${id}`);
  };

  const columns = [
    {
      key: "name",
      headerKey: "name",
      accessor: (g) => g?.name ?? g?.Name ?? "-",
    },
    {
      key: "admin",
      headerKey: "groups.admin",
      accessor: (g) => {
        const a = getAdmin(g);
        const name = a?.fullName ?? a?.FullName ?? "";
        const email = a?.email ?? a?.Email ?? "";
        return (name || email) ? `${name} ${email}`.trim() : "-";
      },
    },
    {
      key: "members",
      headerKey: "groups.members",
      accessor: (g) => {
        const count = getMembers(g).length;
        return (
          <div className="flex justify-center">
            <Badge tone={count ? "info" : "warn"}>
              {(count || 0) + " " + (t?.("groups.members") || "Members")}
            </Badge>
          </div>
        );
      },
      cellClassName: "text-center",
    },
  ];

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t?.("groups.list") || "Groups"} />
        <Button
          variant="primary"
          size="md"
          fullWidth={false}
          onClick={() => navigate("/CreateGroup")}
          className="shrink-0"
        >
          {t?.("groups.new") || "New group"}
        </Button>
      </div>

      {/* Filtro com labels alinhados (Search + Groups) */}
      <GenericFilter
        className="mt-2"
        value={flt}
        onChange={setFlt}
        t={t}
        theme={theme}
        showToggle
        defaultOpen
        showSearch
        searchPlaceholder={t?.("groups.searchPlaceholder") || "Search groups..."}
        filters={[
          {
            key: "scope",
            type: "select",
            label: t?.("groups.label") || t?.("common.groups") || "Groups",
            options: scopeOptions,
          },
        ]}
      />

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="relative overflow-x-auto">
          <GenericTable
            filteredData={filtered}
            columns={columns}
            theme={theme}
            t={t}
            loading={loading}
            rowKey={(g) => g?.id || g?.Id}
            stickyHeader
            truncateKeys={["name", "admin"]}
            minTableWidth="56rem"
            headClassName="bg-gray-50"
            headerCellClassName=""
            emptyMessage={t?.("common.noResults") || "No results"}
            edit={{
              enabled: isGroupAdmin,
              onEdit: doEdit,
            }}
            remove={{
              enabled: true,
              confirmMessage: isGroupAdmin
                ? (t?.("groups.confirm_delete") ||
                    "Are you sure you want to delete this group?")
                : (t?.("groups.confirm_leave") || "Leave this group?"),
              doDelete: async (g) => {
                const id = g?.id ?? g?.Id;
                if (!id) return false;
                const endpoint = isGroupAdmin ? "/Group/Delete" : "/Group/Leave";
                const res = await apiCall.delete(endpoint, {
                  params: { id },
                  validateStatus: () => true,
                });
                if (res?.status >= 200 && res?.status < 300) {
                  setGroups((prev) =>
                    prev.filter((x) => (x.id ?? x.Id) !== id)
                  );
                  return true;
                }
                return false;
              },
              onError: (err) =>
                window.alert(
                  err?.message ||
                    (isGroupAdmin
                      ? "Could not delete the group."
                      : "Could not leave the group.")
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

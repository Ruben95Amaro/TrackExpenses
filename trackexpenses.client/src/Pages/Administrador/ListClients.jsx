import React, { useMemo, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import GenericTable from "../../components/Tables/GenericTable";
import GenericFilter from "../../components/Tables/GenericFilter";
import Title from "../../components/Titles/TitlePage";

import apiCall from "../../services/ApiCallGeneric/apiCall";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import AuthContext from "../../services/Authentication/AuthContext";
import { useTheme } from "../../styles/Theme/Theme";
import { Plus } from "lucide-react";
import Button from "../../components/Buttons/Button";

export default function UsersTable() {
  const [users, setUsers] = useState([]);             
  const [usersWithRoles, setUsersWithRoles] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [errorSubmit, setErrorSubmit] = useState(null);

  const navigate = useNavigate();
  const { t } = useLanguage();
  const { auth, isAuthenticated, roles } = useContext(AuthContext);
  const { theme } = useTheme();

  // 1) Buscar utilizadores
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiCall.get("Administrator/User/GetAllUsers");
        console.log('res', res?.data?.ListUsers);
        const list = res?.data?.ListUsers?.$values ?? res?.data?.ListUsers ?? [];
        if (alive) setUsers(Array.isArray(list) ? list : []);
      } catch (e) {
        if (alive) setErrorSubmit(e?.message || "Erro ao carregar utilizadores.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!users?.length) {
      setUsersWithRoles([]);
      return;
    }
    let cancelled = false;

    (async () => {
      const enriched = await Promise.all(
        users.map(async (u) => {
          const email = u?.Email ?? u?.email;
          if (!email) return { ...u, Roles: [] };
          try {
            const res = await apiCall.post("RolesController/UserRoles",  {UserEmail: email} );
            // aceitar vários formatos de retorno
            const raw = res?.data?.Roles;
            const rolesArr = Array.isArray(raw)
              ? raw
              : Array.isArray(raw?.$values)
              ? raw.$values
              : [];
            return { ...u, Roles: rolesArr };
          } catch {
            return { ...u, Roles: [] };
          }
        })
      );
      if (!cancelled) setUsersWithRoles(enriched);
    })();

    return () => { cancelled = true; };
  }, [users]);

  // filtro
  const [flt, setFlt] = useState({ q: "", group: "all" });

  // 3) Opções de grupo (síncrono)
  const groupOptions = useMemo(() => {
    const names = new Set(
      (usersWithRoles ?? [])
        .map((u) => (u?.GroupOfUsers?.Name || "").trim())
        .filter(Boolean)
    );
    return [
      { value: "all", label: t ? t("common.allGroups") : "Todos" },
      ...[...names].sort((a, b) => a.localeCompare(b)).map((g) => ({ value: g, label: g })),
    ];
  }, [usersWithRoles, t]);

  // 4) Filtrar utilizadores
  const filteredUsers = useMemo(() => {
    const q = (flt.q || "").toLowerCase().trim();
    const groupFilter = (flt.group || "all").toLowerCase();
    return (usersWithRoles || []).filter((u) => {
      const name = `${u?.FirstName || ""} ${u?.FamilyName || ""}`.toLowerCase();
      const email = (u?.Email || "").toLowerCase();
      const group = (u?.GroupOfUsers?.Name || "").toLowerCase();
      const matchesText = !q || name.includes(q) || email.includes(q) || group.includes(q);
      const matchesGroup = groupFilter === "all" || group === groupFilter;
      return matchesText && matchesGroup;
    });
  }, [usersWithRoles, flt]);

  // 5) Colunas
  const columns = [
    {
      key: "fullName",
      headerKey: "fullName",
      accessor: (u) => `${u.FirstName || ""} ${u.FamilyName || ""}`.trim() || "-",
    },
    { key: "email", headerKey: "email", accessor: (u) => u.Email },
    {
      key: "group",
      headerKey: "group",
      accessor: (u) => u.GroupOfUsers?.Name || "-",
    },
    {
      key: "Roles",
      headerKey: "roles",
      accessor: (u) =>
        Array.isArray(u.Roles) && u.Roles.length ? u.Roles.join(", ") : "-",
    },
    {
      key: "birthday",
      headerKey: "birthday",
      accessor: (u) =>
        u.Birthday ? new Date(u.Birthday).toLocaleDateString() : "-",
    },
  ];

  // 6) Permissão para apagar
  const toRoleArray = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((r) => String(r).trim().toUpperCase()).filter(Boolean);
    if (typeof input === "string")
      return input.split(/[,\s;]+/).map((r) => r.trim().toUpperCase()).filter(Boolean);
    if (Array.isArray(input?.$values))
      return input.$values.map((r) => String(r).trim().toUpperCase()).filter(Boolean);
    return [];
  };

  const canDelete = () =>
    (typeof isAuthenticated === "boolean" ? isAuthenticated : !!auth?.Email) &&
    toRoleArray(roles ?? auth?.Roles ?? auth?.role).includes("ADMINISTRATOR");

  return (
    <div className="space-y-6 min-h-screen">
      {/* header com título + botão */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t("common.users")} />
<Button
  variant="primary"
  size="md"           
  fullWidth={false}    
  onClick={() => navigate("/users/new")}
  className="shrink-0"
>
  <span className="inline-flex items-center gap-2">
    <Plus className="h-4 w-4" />
    {t("common.add_user") || "User"}
  </span>
</Button>
      </div>

      <GenericFilter
        className="
          mt-2
          grid items-center gap-3
          grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto]
          [&_input]:h-11 [&_select]:h-11 [&_button]:h-11
        "
        value={flt}
        onChange={setFlt}
        t={t}
        theme={theme}
        searchPlaceholder={t ? t("common.searchUsers") : "Search users..."}
        filters={[{ key: "group", type: "select", options: groupOptions }]}
      />

      {/* cartão com a tabela */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="relative overflow-x-auto">
          <GenericTable
            filteredData={filteredUsers}
            columns={columns}
            theme={theme}
            t={t}
            loading={loading}
            rowKey={(u) => u.Id || u.Email}
            stickyHeader
            truncateKeys={["fullName", "email"]}
            minTableWidth="56rem"
            headClassName="bg-gray-50"
            headerCellClassName=""
            emptyMessage={t ? t("common.noResults") : "Sem resultados"}
            edit={{
              enabled: true,
              navigate,
              navigateTo: (u) => `/users/edit/${u.Id}/${encodeURIComponent(u.Email)}`,
            }}
            remove={{
              enabled: true,
              confirmMessage:
                t?.("common.confirmDelete") ||
                "Tens a certeza que queres apagar este utilizador?",
              doDelete: async (u) => {
                if (!canDelete()) return false;
                const res = await apiCall.post(
                  "Administrator/User/DeleteUser",
                  u.Id
                );
                if (res?.status === 200) {
                  setUsers((prev) => prev.filter((x) => x.Id !== u.Id));
                  setUsersWithRoles((prev) => prev.filter((x) => x.Id !== u.Id));
                  return true;
                }
                return false;
              },
              onError: (err) =>
                setErrorSubmit(err?.message || "Erro ao apagar utilizador."),
            }}
          />
        </div>
      </div>

      {errorSubmit && <div className="text-sm text-red-600">{errorSubmit}</div>}
    </div>
  );
}

import React, { useContext, useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthContext from "./AuthContext";

/**
 * Uso:
 * <Route element={<RequireRoles allow={["GROUPADMINISTRATOR","GROUPMEMBER"]} />}>
 *   <Route path="/GroupsList" element={<GroupsPage />} />
 * </Route>
 */

const N = (v) => String(v ?? "").trim().toUpperCase();
const toArray = (r) =>
  Array.isArray(r) ? r : typeof r === "string" ? r.split(/[,\s]+/) : [];

// normaliza sem colapsar todos os "GROUP*"
const normalizeRole = (raw) => {
  const v = N(raw).replace(/\s+/g, ""); // remove espaços internos
  if (!v) return "USER";

  // Admin
  if (["ADMIN", "ADM", "ADMINISTRATOR"].includes(v)) return "ADMINISTRATOR";

  // Group Admin
  if (["GROUPADMINISTRATOR", "GROUP-ADMIN", "GROUP_ADMIN", "GROUPADMIN"].includes(v))
    return "GROUPADMINISTRATOR";

  // Group Member
  if (["GROUPMEMBER", "GROUP-MEMBER", "GROUP_MEMBER", "MEMBER"].includes(v))
    return "GROUPMEMBER";

  // Premium
  if (["PREMIUM", "PRO", "PLUS"].includes(v)) return "PREMIUM";

  // User
  if (v === "USER") return "USER";

  // outros roles custom mantêm-se
  return v;
};

export default function RequireRoles({ allow = [], redirectTo = "/" }) {
  const { roles } = useContext(AuthContext);
  const loc = useLocation();

  // roles do utilizador
  const userRoles = useMemo(
    () => Array.from(new Set(toArray(roles).map(normalizeRole).filter(Boolean))),
    [roles]
  );

  // admin tem acesso a tudo
  const isAdmin = userRoles.includes("ADMINISTRATOR");

  // roles requeridos (se vazio => USER)
  const requiredInput = toArray(allow);
  const required = (requiredInput.length ? requiredInput : ["USER"]).map(normalizeRole);

  // regra: admin passa; senão precisa de pelo menos 1 role requerido ou USER
  const ok = isAdmin || required.some((r) => r === "USER" || userRoles.includes(r));

  return ok ? (
    <Outlet />
  ) : (
    <Navigate to={redirectTo} replace state={{ from: loc, forbidden: true }} />
  );
}

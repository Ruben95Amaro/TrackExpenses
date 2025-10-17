import React, { useContext, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "./AuthContext";

const N = (v) => String(v ?? "").trim().toUpperCase();
const toArray = (r) =>
  Array.isArray(r) ? r : typeof r === "string" ? r.split(/[,\s]+/) : [];

// mesma normalização que no RequireRoles
const normalizeRole = (raw) => {
  const v = N(raw).replace(/\s+/g, "");
  if (!v) return "USER";

  if (["ADMIN", "ADM", "ADMINISTRATOR"].includes(v)) return "ADMINISTRATOR";
  if (["GROUPADMINISTRATOR", "GROUP-ADMIN", "GROUP_ADMIN", "GROUPADMIN"].includes(v))
    return "GROUPADMINISTRATOR";
  if (["GROUPMEMBER", "GROUP-MEMBER", "GROUP_MEMBER", "MEMBER"].includes(v))
    return "GROUPMEMBER";
  if (["PREMIUM", "PRO", "PLUS"].includes(v)) return "PREMIUM";
  if (v === "USER") return "USER";
  return v;
};

export default function RoleRoute({ roles: allow = [], children, redirectTo = "/" }) {
  const { roles } = useContext(AuthContext);
  const loc = useLocation();

  const userRoles = useMemo(
    () => Array.from(new Set(toArray(roles).map(normalizeRole).filter(Boolean))),
    [roles]
  );

  const isAdmin = userRoles.includes("ADMINISTRATOR");
  const requiredInput = toArray(allow);
  const required = (requiredInput.length ? requiredInput : ["USER"]).map(normalizeRole);

  const ok = isAdmin || required.some((r) => r === "USER" || userRoles.includes(r));

  return ok ? children : <Navigate to={redirectTo} replace state={{ from: loc, forbidden: true }} />;
}

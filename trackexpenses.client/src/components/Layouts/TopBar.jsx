// src/layout/AppShell/TopBar.jsx
import React, { useState, useEffect, useMemo, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Menu as MenuIcon,
  Wallet,
  Settings,
  LogOut,
  DollarSign,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import AuthContext from "../../services/Authentication/AuthContext";
import useLogout from "../../services/Authentication/Logout";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

export default function TopBar({ title = "TRACKEXPENSES", menuItems = [] }) {
  // Este menu (hamburger + dropdown) **só** aparece em < md
  const [mobileOpen, setMobileOpen] = useState(false);

  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { auth, roles: ctxRoles, isAuthenticated } =
    useContext(AuthContext) || {};
  const logout = useLogout();

  const c = theme?.colors || {};
  const topBg = c.background?.default || "#0B1020";
  const topText = c.text?.primary || "#E5E7EB";
  const ddBg = c.background?.paper || "#0F172A";
  const ddText = c.text?.primary || "#E5E7EB";
  const ddMuted = c.text?.secondary || "#94A3B8";
  const ddBorder = c.menu?.border || "rgba(148,163,184,0.2)";
  const ddHover = c.menu?.hoverBg || "rgba(255,255,255,0.06)";
  const iconCol = c.primary?.main || "#5B5BF5";
  const topBorder = c.menu?.border || "rgba(255,255,255,0.08)";

  // fechar menu no ESC + bloquear scroll quando aberto
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // roles
  const userRoles = useMemo(() => {
    if (Array.isArray(ctxRoles)) return ctxRoles;
    if (typeof ctxRoles === "string")
      return ctxRoles.split(/[,\s]+/).filter(Boolean);
    return [];
  }, [ctxRoles]);

  const hasAnyRole = (need) => {
    const list = Array.isArray(need) ? need : [need];
    if (!list.length || list.includes("USER")) return true;
    return list.some((r) => userRoles.includes(r));
  };

  const sectionOf = (allow) => {
    const r = Array.isArray(allow) ? allow[0] : allow;
    switch (r) {
      case "ADMINISTRATOR":
        return "ADMIN";
      case "GROUPADMINISTRATOR":
        return "GROUPADMIN";
      case "PREMIUM":
        return "PREMIUM";
      case "GROUPMEMBER":
        return "GROUP";
      case "USER":
      default:
        return "USER";
    }
  };

  const groups = useMemo(() => {
    const g = { ADMIN: [], GROUPADMIN: [], PREMIUM: [], GROUP: [], USER: [] };
    (menuItems || []).forEach((i) => {
      if (!i || i.visible === false) return;
      const sec = sectionOf(i.role);
      if (sec === "USER") g.USER.push(i);
      else if (hasAnyRole(i.role)) g[sec].push(i);
    });
    return g;
  }, [menuItems, userRoles]);

  // perfil (nome/foto)
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: "",
  });

  const withVersion = (url, stamp = Date.now()) => {
    if (!url) return "";
    try {
      const u = new URL(url, window.location.origin);
      u.searchParams.set("v", String(stamp));
      return u.toString();
    } catch {
      const [base, q] = String(url).split("?");
      const params = new URLSearchParams(q || "");
      params.set("v", String(stamp));
      return `${base}?${params.toString()}`;
    }
  };

  useEffect(() => {
    const email = (auth?.Email || auth?.email || "").trim();
    if (!email) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await apiCall.get(
          `/User/GetPhotoProfileAndName/${encodeURIComponent(email)}`,
          { signal: controller.signal, validateStatus: () => true }
        );
        const fn = res?.data?.FirstName ?? res?.data?.firstName ?? "";
        const ln = res?.data?.FamilyName ?? res?.data?.familyName ?? "";
        const photoPath = res?.data?.PhotoPath ?? res?.data?.photoPath ?? "";
        let avatarUrl = "";
        if (photoPath && photoPath !== "NoPhoto") {
          const base = (
            import.meta.env.VITE_FILES_BASE_URL ||
            import.meta.env.VITE_API_BASE_URL ||
            ""
          ).replace(/\/+$/, "");
          const rel = String(photoPath).replace(/^\/+/, "");
          avatarUrl = withVersion(`${base}/${rel}`);
        }
        setProfile((p) => ({
          ...p,
          firstName: fn,
          lastName: ln,
          email,
          avatarUrl: avatarUrl || p.avatarUrl,
        }));
      } catch {}
    })();
    return () => controller.abort();
  }, [auth?.Email, auth?.email]);

  useEffect(() => {
    const newPath = auth?.path || auth?.Path;
    if (!newPath) return;
    setProfile((p) => ({ ...p, avatarUrl: withVersion(newPath) }));
  }, [auth?.path, auth?.Path]);

  const initials = useMemo(() => {
    const f = profile?.firstName?.[0] || "";
    const l = profile?.lastName?.[0] || "";
    return ((f + l) || (profile.email?.[0] || "?")).toUpperCase();
  }, [profile]);

  const Section = ({ title, items }) =>
    !items?.length ? null : (
      <div className="py-2 text-center">
        <div
          className="w-full px-2 py-1.5 text-sm font-bold uppercase text-center"
          style={{ color: ddMuted }}
        >
          {title}
        </div>
        {items.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex justify-center items-center gap-3 px-4 py-3 border-t transition-colors"
            style={{ borderColor: ddBorder, color: ddText }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = ddHover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            onClick={() => setMobileOpen(false)}
          >
            {Icon && <Icon className="h-5 w-5" style={{ color: iconCol }} />}
            <span className="truncate">{t?.(label) || label}</span>
          </Link>
        ))}
      </div>
    );

  return (
    <nav
      className="relative z-[200]"
      style={{
        backgroundColor: topBg,
        color: topText,
        borderBottom: `1px solid ${topBorder}`,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 12px rgba(0,0,0,0.18), 0 4px 16px rgba(255,255,255,0.25)",
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center h-16">
        {/* HAMBURGUER SÓ EM < md (quando a SideBar está escondida) */}
        <button
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: topText }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        {/* TÍTULO (TopBar está sempre visível) */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <Link
            to="/Welcome"
            className="flex items-center gap-2 pointer-events-auto"
          >
            <Wallet className="h-6 w-6" />
            <span className="font-bold text-xl">{title}</span>
          </Link>
        </div>

        {/* LADO DIREITO DESLIGADO EM ≥ md (não mostra botões quando Sidebar está visível) */}
        <div className="ml-auto flex md:hidden items-center gap-3">
          {/* Mantemos vazio aqui — os botões ficam só no dropdown mobile */}
        </div>
      </div>

      {/* DROPDOWN MOBILE (apenas quando a SideBar está oculta, < md) */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[205] bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="md:hidden fixed top-16 left-0 right-0 z-[210] max-h-[70vh] overflow-auto rounded-b-2xl ring-1 shadow-2xl"
            style={{ backgroundColor: ddBg, borderColor: ddBorder }}
          >
            {!isAuthenticated ? (
              <div className="py-4 px-5 flex flex-col items-center gap-3">
                <button
                  onClick={() => {
                    toggleTheme();
                    setMobileOpen(false);
                  }}
                  className="w-48 h-12 rounded-full border text-[0.95rem] font-medium flex items-center justify-center"
                  style={{
                    borderColor: ddBorder,
                    color: ddText,
                    backgroundColor: "transparent",
                  }}
                >
                  {isDarkMode ? "Dark" : "Light"}
                </button>

                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-48 h-12 rounded-full border text-[0.95rem] font-medium flex items-center justify-center gap-2"
                  style={{
                    borderColor: ddBorder,
                    color: ddText,
                    backgroundColor: "transparent",
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Signup
                </Link>

                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-48 h-12 rounded-full text-[0.95rem] font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: iconCol, color: "#fff" }}
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </div>
            ) : (
              <>
                <Section title={t?.("common.admin")} items={groups.ADMIN} />
                <Section
                  title={t?.("common.adminGroup")}
                  items={groups.GROUPADMIN}
                />
                <Section title={t?.("common.premium")} items={groups.PREMIUM} />
                <Section
                  title={t?.("common.groupMember")}
                  items={groups.GROUP}
                />
                <Section title={t?.("common.user")} items={groups.USER} />

                <div
                  className="w-full px-2 py-1.5 text-sm font-bold uppercase text-center"
                  style={{ color: ddMuted }}
                >
                  {t?.("common.account") ?? "Account"}
                </div>

                <Link
                  to="/Premium"
                  className="flex justify-center items-center gap-2 px-4 py-3 border-t"
                  style={{ borderColor: ddBorder, color: ddText }}
                  onClick={() => setMobileOpen(false)}
                >
                  <DollarSign className="h-5 w-5" />{" "}
                  {t?.("common.premium") ?? "Premium"}
                </Link>

                <Link
                  to="/Settings"
                  className="flex justify-center items-center gap-2 px-4 py-3 border-t"
                  style={{ borderColor: ddBorder, color: ddText }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Settings className="h-5 w-5" />{" "}
                  {t?.("common.settings") ?? "Settings"}
                </Link>

                <button
                  className="w-full flex justify-center items-center gap-2 px-4 py-3 border-t"
                  style={{ borderColor: ddBorder, color: ddText }}
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="h-5 w-5" />{" "}
                  {t?.("common.logout") ?? "Logout"}
                </button>

                <Link
                  to="/Profile"
                  className="flex justify-center items-center gap-3 px-4 py-3 border-t"
                  style={{ borderColor: ddBorder, color: ddText }}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-gray-600">
                    {profile.avatarUrl ? (
                      <img
                        key={profile.avatarUrl}
                        src={profile.avatarUrl}
                        alt="avatar"
                        className="h-full w-full object-cover"
                        onError={() =>
                          setProfile((p) => ({ ...p, avatarUrl: "" }))
                        }
                      />
                    ) : (
                      <div
                        className="h-full w-full flex items-center justify-center font-semibold"
                        style={{ backgroundColor: "#6D28D9", color: "#fff" }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-semibold truncate">
                      {profile.firstName && profile.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : auth?.preferred_username ||
                          profile.email ||
                          "Profile"}
                    </div>
                    <div className="text-xs truncate" style={{ color: ddMuted }}>
                      {profile.email}
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  );
}

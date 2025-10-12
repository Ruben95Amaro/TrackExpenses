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

  /* ESC fecha menu */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* roles helpers */
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

  /* profile */
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
      <div className="relative w-full h-16 flex items-center px-4 sm:px-6 lg:px-8">
        {/* Hamburguer (visível até <xl) */}
        <button
          className="xl:hidden p-2 rounded-lg transition-colors"
          style={{ color: topText }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        {/* TÍTULO */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 select-none">
          {/* mobile trigger */}
          <button
            type="button"
            className="flex xl:hidden items-center gap-3 pointer-events-auto"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
          >
            <Wallet className="h-6 w-6 shrink-0" />
            <span className="font-bold text-base whitespace-nowrap">
              {title}
            </span>
          </button>

          {/* desktop link */}
          <Link
            to="/Welcome"
            className="hidden xl:flex items-center gap-3 pointer-events-auto"
          >
            <Wallet className="h-6 w-6 shrink-0" />
            <span className="font-bold text-base whitespace-nowrap">
              {title}
            </span>
          </Link>
        </div>

        {/* BOTÕES DIREITA */}
        {!isAuthenticated && (
          <div className="hidden xl:flex items-center gap-4 ml-auto">
            <button
              onClick={toggleTheme}
              className="h-10 px-5 rounded-full border text-sm font-medium inline-flex items-center justify-center transition duration-200 ease-out hover:shadow-md active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              style={{
                borderColor: ddBorder,
                color: topText,
                backgroundColor: "transparent",
              }}
            >
              {isDarkMode ? "Dark" : "Light"}
            </button>

            <Link
              to="/register"
              className="h-10 px-5 rounded-full border text-sm font-medium inline-flex items-center justify-center gap-2 transition duration-200 ease-out hover:shadow-md active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              style={{
                borderColor: ddBorder,
                color: topText,
                backgroundColor: "transparent",
              }}
            >
              <UserPlus className="h-4 w-4" />
              SignUp
            </Link>

            <Link
              to="/login"
              className="h-10 px-5 rounded-full text-sm font-medium inline-flex items-center justify-center gap-2 transition duration-200 ease-out hover:brightness-110 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              style={{ backgroundColor: iconCol, color: "#fff" }}
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </div>
        )}
      </div>

      {/* MENU MOBILE */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[205] bg-black/40 xl:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="xl:hidden fixed top-16 left-0 right-0 z-[210] max-h-[70vh] overflow-auto rounded-b-2xl ring-1 shadow-2xl"
            style={{ backgroundColor: ddBg, borderColor: ddBorder }}
          >
            {!isAuthenticated ? (
              <div className="py-4 px-5 flex flex-col items-center gap-3">
                <button
                  onClick={() => {
                    toggleTheme();
                    setMobileOpen(false);
                  }}
                  className="w-48 h-12 rounded-full border text-sm font-medium flex items-center justify-center transition duration-200 ease-out hover:shadow-md active:scale-[.97]"
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
                  className="w-48 h-12 rounded-full border text-sm font-medium flex items-center justify-center gap-2 transition duration-200 ease-out hover:shadow-md active:scale-[.97]"
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
                  className="w-48 h-12 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition duration-200 ease-out hover:brightness-110 active:scale-[.97]"
                  style={{ backgroundColor: iconCol, color: "#fff" }}
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </div>
            ) : (
              <>
                <Section title={t?.("common.user")} items={groups.USER} />
              </>
            )}
          </div>
        </>
      )}
    </nav>
  );
}

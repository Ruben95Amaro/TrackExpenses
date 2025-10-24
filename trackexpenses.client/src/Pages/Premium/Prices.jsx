// src/Pages/Premium/PremiumChoicePage.jsx
import React, { useContext, useMemo, useState } from "react";
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Button from "../../components/Buttons/Button";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utils/Translate/LanguageContext";
import AuthContext from "../../services/Authentication/AuthContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

const AUTH_KEY = "auth";

/* ---------------- helpers ---------------- */
function asArray(x) {
  if (Array.isArray(x)) return x;
  if (typeof x === "string") return x.split(/[,\s]+/).filter(Boolean);
  return [];
}

function unique(arr) {
  return [...new Set(asArray(arr))];
}

function isUserPremium(auth, roles) {
  const r = asArray(roles).map((s) => String(s).toUpperCase());
  if (r.includes("PREMIUM")) return true;

  const tier =
    auth?.subscription?.tier ??
    auth?.Subscription?.Tier ??
    auth?.user?.subscription?.tier ??
    auth?.user?.Subscription?.Tier;

  const plan =
    auth?.subscription?.plan ??
    auth?.Subscription?.Plan ??
    auth?.plan ??
    auth?.Plan;

  const bool =
    auth?.isPremium ?? auth?.IsPremium ?? auth?.premium ?? auth?.Premium;

  if (bool === true) return true;

  const norm = (v) => String(v || "").trim().toUpperCase();
  return ["PREMIUM", "PRO", "PLUS"].includes(norm(tier)) ||
         ["PREMIUM", "PRO", "PLUS"].includes(norm(plan));
}

function mergeIntoAuth(prevAuth, patch) {
  const next = { ...(prevAuth || {}) };

  // subscription (normalizamos para "subscription")
  const curSub =
    next.subscription ??
    next.Subscription ??
    next.user?.subscription ??
    next.user?.Subscription ??
    {};
  const patchSub = patch?.subscription || {};
  const mergedSub = { ...curSub, ...patchSub };
  next.subscription = mergedSub;
  if (next.user) next.user.subscription = { ...(next.user.subscription || {}), ...patchSub };

  // roles (normalizamos e espelhamos onde for preciso)
  if (patch?.roles) {
    const rolesArr = unique(patch.roles);
    next.roles = rolesArr;
    next.Roles = rolesArr;
    if (next.user) {
      next.user.roles = rolesArr;
      next.user.Roles = rolesArr;
    }
  }

  return next;
}

/* ---------------- component ---------------- */
export default function PremiumChoicePage() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth, setAuth, roles, setRoles } = useContext(AuthContext);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const premium = useMemo(() => isUserPremium(auth, roles), [auth, roles]);

  // theme fallbacks
  const c = theme?.colors || {};
  const col = {
    text: c.text?.primary || "#E5E7EB",
    subText: c.text?.secondary || "#94A3B8",
    paper: c.background?.paper || "#111827",
    border: c.menu?.border || "rgba(255,255,255,0.12)",
    activeBg: c.menu?.activeBg || "rgba(99,102,241,0.12)",
    primary: c.primary?.main || "#2563EB",
    premiumGold: c.premium?.gold || "#EAB308",
    error: c.error?.main || "#EF4444",
  };

  // storage helpers
  const readAuth = () => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}"); } catch { return {}; }
  };
  const writeAuth = (next) => localStorage.setItem(AUTH_KEY, JSON.stringify(next));

  const patchAuthEverywhere = (patch) => {
    const curLocal = readAuth();
    const mergedLocal = mergeIntoAuth(curLocal, patch);
    writeAuth(mergedLocal);
    setAuth((prev) => mergeIntoAuth(prev, patch));
  };

  // roles helpers (garante que o "auth" fica atualizado também)
  const updateRolesEverywhere = (newRoles) => {
    const rolesArr = unique(newRoles);
    setRoles?.(rolesArr);
    patchAuthEverywhere({ roles: rolesArr });
  };

  // request ok?
  const is2xx = (s) => typeof s === "number" && s >= 200 && s < 300;

  async function handleUpgrade() {
    if (busy) return;
    setErrorMsg("");
    setBusy(true);
    try {
      const res = await apiCall.post(
        "/Premium/Subscribe",
        { UserEmail: auth?.Email },
        { validateStatus: () => true }
      );
      if (!is2xx(res?.status)) {
        setErrorMsg(res?.data?.message || t("premium.errors.enableFail") || "Failed to enable premium.");
        return;
      }

      const data = res?.data || {};

      // roles vindos da API (ou adiciona PREMIUM aos atuais)
      const apiRoles = data.Roles || data.roles;
      const currentRoles = unique(
        apiRoles || roles || auth?.Roles || auth?.roles || []
      );
      const withPremium = unique([...currentRoles, "PREMIUM"]);
      updateRolesEverywhere(withPremium);

      // subscription patch
      const subPatch = data.subscription || data.Subscription || { tier: "premium" };
      patchAuthEverywhere({ subscription: subPatch });
    } catch {
      setErrorMsg(t("premium.errors.enableFail") || "Failed to enable premium.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (busy) return;
    setErrorMsg("");
    setBusy(true);
    try {
      const res = await apiCall.post(
        "/Premium/Cancel",
        { UserEmail: auth?.Email },
        { validateStatus: () => true }
      );
      if (!is2xx(res?.status)) {
        setErrorMsg(res?.data?.message || t("premium.errors.cancelFail") || "Failed to cancel premium.");
        return;
      }

      const data = res?.data || {};

      // roles vindos da API (ou remove PREMIUM dos atuais)
      const apiRoles = data.Roles || data.roles;
      let finalRoles;
      if (apiRoles) {
        finalRoles = unique(apiRoles);
      } else {
        const current = unique(roles || auth?.Roles || auth?.roles || []);
        finalRoles = current.filter((r) => String(r).toUpperCase() !== "PREMIUM");
      }
      updateRolesEverywhere(finalRoles);

      // subscription patch
      const subPatch = data.subscription || data.Subscription || { tier: "free" };
      patchAuthEverywhere({ subscription: subPatch });
    } catch {
      setErrorMsg(t("premium.errors.cancelFail") || "Failed to cancel premium.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- UI bits ---------------- */
  function Feature({ text, enabled = true, divider = true }) {
    return (
      <div className={`flex items-center justify-between py-2 ${divider ? "border-b" : ""}`}
           style={{ borderColor: col.border }}>
        <span className="text-sm opacity-90" style={{ color: col.text }}>{text}</span>
        <span className="text-sm" style={{ opacity: enabled ? 1 : 0.5, color: col.text }}>
          {enabled ? "✔" : "—"}
        </span>
      </div>
    );
  }

  function PlanCardFree() {
    return (
      <Card
        className="w-full p-7 rounded-3xl ring-1"
        style={{
          backgroundColor: col.paper,
          ringColor: col.border,
          boxShadow: `0 20px 60px -20px ${col.primary}33`,
        }}
      >
        <h3 className="text-xl font-bold" style={{ color: col.text }}>
          {t("premium.free") || "Free"}
        </h3>

        <div className="text-3xl font-bold" style={{ color: col.primary }}>
          €0 <span className="text-sm font-medium">/{t("premium.free") || "Free"}</span>
        </div>

        <div className="mt-5">
          <Feature text={t("premium.features.expenseTracking") || "Expense tracking"} />
          <Feature text={t("premium.features.monthlySummary") || "Monthly summary"} />
          <Feature text={t("premium.features.export") || "Export"} enabled={false} />
          <Feature text={t("premium.features.groupSharing") || "Group sharing"} enabled={false} />
          <Feature text={t("premium.features.prioritySupport") || "Priority support"} enabled={false} divider={false} />
        </div>
      </Card>
    );
  }

  function PlanCardPremium() {
    return (
      <div className="relative">
        <div
          className="absolute -inset-2 rounded-[28px] blur-2xl opacity-40"
          style={{ background: `radial-gradient(40% 40% at 50% 0%, ${col.premiumGold}33 0%, transparent 100%)` }}
          aria-hidden
        />
        <Card
          className="relative w-full p-7 rounded-3xl ring-1"
          style={{
            background: `linear-gradient(180deg, ${c.menu?.bg || "#0F172A"}, ${col.paper})`,
            ringColor: col.border,
            boxShadow: `0 24px 80px -28px ${col.premiumGold}55`,
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold" style={{ color: col.premiumGold }}>
              {t("premium.premium") || "Premium"}
            </h3>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                color: col.premiumGold,
                backgroundColor: col.activeBg,
                border: `1px solid ${col.border}`,
              }}
            >
              {premium ? (t("premium.active") || "Active") : (t("premium.mostPopular") || "Most popular")}
            </span>
          </div>

          <div className="text-3xl font-bold" style={{ color: col.premiumGold }}>
            €4.99 <span className="text-sm font-medium">/{t("premium.free") || "Free"}</span>
          </div>

          <div className="mt-5">
            <Feature text={t("premium.features.expenseTracking") || "Expense tracking"} />
            <Feature text={t("premium.features.monthlySummary") || "Monthly summary"} />
            <Feature text={t("premium.features.export") || "Export"} />
            <Feature text={t("premium.features.groupSharing") || "Group sharing"} />
            <Feature text={t("premium.features.prioritySupport") || "Priority support"} divider={false} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            {!premium ? (
              <Button
                fullWidth
                disabled={busy}
                onClick={handleUpgrade}
                className="h-11 rounded-xl text-white hover:opacity-90"
                style={{
                  backgroundColor: col.premiumGold,
                  boxShadow: `0 4px 14px ${col.premiumGold}66`,
                }}
              >
                {busy
                  ? (t("premium.enabling") || "Enabling...")
                  : (t("premium.upgrade") || "Upgrade to Premium")}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="danger"
                disabled={busy}
                onClick={handleCancel}
                className="h-11 rounded-xl"
              >
                {busy
                  ? (t("premium.canceling") || "Canceling...")
                  : (t("premium.cancel") || "Cancel Premium")}
              </Button>
            )}
          </div>

          {errorMsg && (
            <p className="text-sm mt-3" style={{ color: col.error }}>
              {errorMsg}
            </p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[72rem] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Title text={t("common.premium") || "Premium"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlanCardFree />
        <PlanCardPremium />
      </div>

      <div
        className="text-center text-xs mt-6 opacity-70"
        style={{ color: c.text?.secondary || "#94A3B8" }}
      >
        {t("premium.footer") || "You can cancel anytime from your account settings."}
      </div>
    </div>
  );
}

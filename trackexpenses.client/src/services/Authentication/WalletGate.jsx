import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useRequireWallet } from "./useRequireWallet";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

export default function WalletGate({
  redirectTo = "/CreateWallet",
  delayMs = 2200,
  skipPaths = ["/CreateWallet"],
  includeArchived = false,
}) {
  const { pathname } = useLocation();
  const { t } = useLanguage();

  const shouldSkip = useMemo(
    () => skipPaths.some((p) => pathname.startsWith(p)),
    [pathname, skipPaths]
  );
  if (shouldSkip) return <Outlet />;

  const { loading, noWallets, fetchedOnce } = useRequireWallet({
    includeArchived,
    redirectIfNone: true,
    redirectTo,
    delayMs,
  });

  const totalSeconds = Math.max(1, Math.round(delayMs / 1000));
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);


  useEffect(() => {
    if (!noWallets || !fetchedOnce) return;
    setSecondsLeft(totalSeconds);
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [noWallets, fetchedOnce, totalSeconds, pathname]);

  const fmt = (key, fallback, vars = {}) => {
    const raw = (typeof t === "function" ? t(key, vars) : null) || fallback;
    return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
  };

  if (loading || !fetchedOnce) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-32 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (noWallets) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" key={pathname}>
          <div className="w-full max-w-md rounded-xl border bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-full p-2 bg-yellow-100 text-yellow-800">👛</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {fmt("walletGate.title", "A wallet is required")}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {fmt(
                    "walletGate.message",
                    "We couldn't find any active wallet in your account. You'll be redirected to create your first wallet."
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2" aria-live="polite">
                  {fmt("walletGate.redirectIn", "Redirecting in {seconds} second(s)…", {
                    seconds: secondsLeft,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <Outlet />;
}

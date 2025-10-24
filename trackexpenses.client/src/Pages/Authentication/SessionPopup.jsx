// src/Pages/Autentication/SessionPopup.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AuthTimer_forceRefreshNow } from "../../services/MicroServices/AuthTime";
import useLogout from "../../services/Authentication/Logout";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utils/Translate/LanguageContext";

function readExpAt() {
  try {
    return (
      JSON.parse(localStorage.getItem("auth") || "{}")?.meta?.accessExpAt ??
      null
    );
  } catch {
    return null;
  }
}
function formatLeft(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function SessionPopup() {
  const { theme } = useTheme();
  const logout = useLogout();

  const [open, setOpen] = useState(false);
  const [expAt, setExpAt] = useState(() => readExpAt());
  const [now, setNow] = useState(() => Date.now());
  const [autoLoggingOut, setAutoLoggingOut] = useState(false); // ⬅️ NOVO
  const {t} = useLanguage();
  const left = useMemo(() => (expAt ? expAt - now : 0), [expAt, now]);

  useEffect(() => {
    const onDue = () => {
      setExpAt(readExpAt());
      setNow(Date.now());
      setOpen(true);
    };
    const onRefreshed = () => {
      setExpAt(readExpAt());
      setNow(Date.now());
      setOpen(false);
      setAutoLoggingOut(false);
    };

    const onExpiredHard = async () => {
      setOpen(false);
      if (!autoLoggingOut) {
        setAutoLoggingOut(true);
        await logout();
      }
    };

    window.addEventListener("token-due", onDue);
    window.addEventListener("token-refreshed", onRefreshed);
    window.addEventListener("token-expired-hard", onExpiredHard);

    return () => {
      window.removeEventListener("token-due", onDue);
      window.removeEventListener("token-refreshed", onRefreshed);
      window.removeEventListener("token-expired-hard", onExpiredHard);
    };
  }, [autoLoggingOut, logout]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (open && left <= 0 && !autoLoggingOut) {
      (async () => {
        setAutoLoggingOut(true);
        setOpen(false);
        await logout();
      })();
    }
  }, [open, left, autoLoggingOut, logout]);

  const renew = async () => {
    try {
      await AuthTimer_forceRefreshNow();
      setOpen(false);
    } catch {
      setOpen(false);
      await logout();
    }
  };

  const terminate = async () => {
    setOpen(false);
    await logout();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
      <div
        className="w-[92%] max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: theme?.colors?.background?.paper }}
        role="dialog"
        aria-modal="true"
      >
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: theme?.colors?.text?.primary }}
        >
          {t("session.almostExpire")}
          
        </h3>
        <p
          className="text-sm mb-3"
          style={{ color: theme?.colors?.text?.secondary }}
        >
          {t("session.chose_Renew_Or_Logout")}
          
        </p>
        <div
          className="mb-4 text-sm"
          style={{ color: theme?.colors?.text?.primary }}
        >
          {t("session.time_Left")}:{" "}

          <span className="font-semibold">{formatLeft(left)}</span>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={terminate}
            className="px-4 py-2 rounded-lg border"
            style={{
              borderColor: theme?.colors?.secondary?.light,
              color: theme?.colors?.text?.primary,
              backgroundColor: theme?.colors?.background?.default,
            }}
          >
          {t("session.logout")}
          </button>
          <button
            onClick={renew}
            className="px-4 py-2 rounded-lg text-white"
            style={{
              background: `linear-gradient(135deg, ${theme?.colors?.primary?.main}, ${theme?.colors?.primary?.dark})`,
            }}
          >
          {t("session.renew")}

          </button>
        </div>
      </div>
    </div>
  );
}

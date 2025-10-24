import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import TitlePage from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utils/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

export default function CreateWallet() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const save = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg(t?.("wallets.nameRequired") || "O nome é obrigatório.");
      return;
    }

    try {
      setBusy(true);

      const res = await apiCall.post("/wallets", {
        Name: trimmed,
        Currency: "EUR",
      });

      const status = res?.status ?? 0;

      // só navega se (200–299)
      if (status >= 200 && status < 300) {
        navigate("/ListWallets");
        return;
      }

      // status fora de 2xx: mostra erro e fica na página
      const serverMsg =
        res?.data?.message ||
        res?.data?.error ||
        res?.message ||
        t?.("common.errorSaving") ||
        "Não foi possível criar a wallet.";
      setErrorMsg(serverMsg);
    } catch (err) {
      // axios lança em 4xx/5xx → vem parar aqui
      const serverMsg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        t?.("common.errorSaving") ||
        "Não foi possível criar a wallet.";
      setErrorMsg(serverMsg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <TitlePage title={t?.("wallets.new") || "Nova Wallet"} subtitle="EUR (€)" />

      <Card>
        <form onSubmit={save} className="space-y-4">
          <Input
            label={t?.("common.name") || "Nome"}
            placeholder={t?.("wallets.placeholderName") || "Minha Wallet"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="text-sm">
            <div className="mb-1 font-medium">{t?.("common.currency") || "Moeda"}</div>
            <span
              className="inline-block px-2 py-1 rounded-full text-xs"
              style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}
            >
              EUR (€)
            </span>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="text-sm px-3 py-2 rounded-md"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
            >
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate("/ListWallets")}
              className="px-4 py-2 rounded-xl"
              style={{
                background: theme.colors.button.secondary.bg,
                color: theme.colors.button.secondary.text,
              }}
            >
              {t?.("common.cancel") || "Cancelar"}
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="px-4 py-2 rounded-xl"
              style={{
                background: theme.colors.button.primary.bg,
                color: theme.colors.button.primary.text,
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? (t?.("common.saving") || "A guardar...") : (t?.("common.save") || "Guardar")}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

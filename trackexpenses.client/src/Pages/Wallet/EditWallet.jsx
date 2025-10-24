import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TitlePage from "../../components/Titles/TitlePage"
import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utils/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";


export default function EditWallet() {
  const { id } = useParams();             // "new" para criar
  const isNew = !id || id.toLowerCase() === "new";
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (isNew) return;
      try {
        const res = await apiCall.get(`/wallets/${encodeURIComponent(id)}`);
        const data = res?.data ?? res;
        if (alive && data) setName(data.name || "");
      } catch (e) {
        alert(e?.message || "Erro a carregar.");
      }
    })();
    return () => { alive = false; };
  }, [id, isNew]);

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setBusy(true);
      if (isNew) {
        await apiCall.put(`/wallets/${encodeURIComponent(id)}`, {name, currency: "EUR",});
        console.log("AAAAAAAAAAAAAAAAAAA");
      } else {
        await apiCall.put(`/Wallet/Update/${id}`, { Name: name.trim(), Currency: "EUR" });
      }
      navigate("/ListWallets");
    } catch (e2) {
      alert(e2?.message || "Erro a guardar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <TitlePage
        title={isNew ? (t("wallets.new") || "Nova Wallet") : (t("wallets.edit") || "Editar Wallet")}
        subtitle="EUR (€)"
      />

      <Card>
        <form onSubmit={save} className="space-y-4">
          <Input
            label={t("common.name") || "Nome"}
            placeholder="Minha Wallet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="text-sm">
            <div className="mb-1 font-medium">{t("common.currency") || "Moeda"}</div>
            <span
              className="inline-block px-2 py-1 rounded-full text-xs"
              style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}
            >
              EUR (€)
            </span>
          </div>

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
              {t("common.cancel") || "Cancelar"}
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
              {busy ? (t("common.saving") || "A guardar...") : (t("common.save") || "Guardar")}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
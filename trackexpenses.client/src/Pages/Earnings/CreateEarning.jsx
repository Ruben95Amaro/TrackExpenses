import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import Title from "../../components/Titles/TitlePage";
import StatCard from "../../components/UI/StatCard";
import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import TextArea from "../../components/Form/TextArea";
import Select from "../../components/Form/Select";
import Button from "../../components/Buttons/Button";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";
import { useLanguage } from "../../utils/Translate/LanguageContext";
import { useTheme } from "../../styles/Theme/Theme";

const EP_CREATE     = "Earnings/CreateEarningsWithImage";
const EP_WALLETS    = "/wallets?includeArchived=true";
const EP_LIST_EARN  = "Earnings/ListEarnings";

const unwrap = (v) => (Array.isArray(v) ? v : (v?.$values ?? []));
const N = (v) => (v ?? "").toString().trim();
const LAST_WALLET_KEY = "te:lastWalletId:earnings";
const CURRENCY = "EUR";

const DEFAULT_EARNING_CATEGORIES = [
  { key: "salary",         value: "Salary" },
  { key: "freelance",      value: "Freelance" },
  { key: "investments",    value: "Investments" },
  { key: "business",       value: "Business" },
  { key: "rental_income",  value: "Rental Income" },
  { key: "gifts",          value: "Gifts" },
  { key: "bonuses",        value: "Bonuses" },
  { key: "interest",       value: "Interest" },
  { key: "dividends",      value: "Dividends" },
  { key: "other",          value: "Other" },
];

// map para o backend: DAY/WEEK/MONTH/YEAR
const PERIODICITY_TO_UNIT = {
  Daily: "DAY",
  Weekly: "WEEK",
  Monthly: "MONTH",
  Yearly: "YEAR",
};

export default function CreateEarning() {
  const { auth } = useContext(AuthContext) || {};
  const { t } = useLanguage ? useLanguage() : { t: () => undefined };
  const { theme, isDarkMode } = useTheme();
  const CONTRAST = isDarkMode ? "#FFFFFF" : "#000000";
  const PAPER = theme?.colors?.background?.paper ?? (isDarkMode ? "rgba(2,6,23,0.92)" : "rgba(255,255,255,0.9)");

  const [kind, setKind] = useState("one");

  const [form, setForm] = useState({
    Title: t?.("earnings.form.defaultTitle") || "Earning",
    Notes: "",
    Amount: "",
    FirstDate: new Date().toISOString().slice(0, 10),
    InstallmentsCount: "",
    Periodicity: "Monthly",
    RepeatCount: "",
    Category: "",
    WalletId: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // foto
  const [photo, setPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const photoInputRef = useRef(null);
  const openPhotoPicker = () => photoInputRef.current?.click();
  const handlePhotoPick = (file) => {
    setPhoto(file || null);
    setPhotoPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return file ? URL.createObjectURL(file) : null; });
  };
  useEffect(() => () => { if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl); }, [photoPreviewUrl]);

  // wallets
  const [wallets, setWallets] = useState([]);
  const walletOptions = useMemo(
    () => [{ id: "", name: t?.("wallets.select") || "Select wallet" },
      ...wallets.map(w => ({ id: w.Id ?? w.id, name: N(w.Name ?? w.name) }))],
    [wallets, t]
  );
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await apiCall.get(EP_WALLETS, { validateStatus: () => true });
        if (!alive) return;
        const list = (r?.status >= 200 && r?.status < 300) ? (Array.isArray(r.data) ? r.data : unwrap(r.data)) : [];
        setWallets(list || []);
        const last = localStorage.getItem(LAST_WALLET_KEY);
        const firstId = (list?.[0]?.Id ?? list?.[0]?.id) || "";
        setForm((f) => ({ ...f, WalletId: f.WalletId || last || firstId }));
      } catch {/* ignore */ }
    })();
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (form.WalletId) localStorage.setItem(LAST_WALLET_KEY, form.WalletId); }, [form.WalletId]);

  // categorias do histórico
  const [historyCategories, setHistoryCategories] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const email = auth?.Email || "";
        if (!email) return;
        const res = await apiCall.get(`${EP_LIST_EARN}?userEmail=${encodeURIComponent(email)}`, { validateStatus: () => true });
        if (!alive) return;
        const list = (res?.status >= 200 && res?.status < 300)
          ? (Array.isArray(res.data) ? res.data : unwrap(res.data))
          : [];
        const cats = Array.from(new Set(list.map(e => N(e?.Category)).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b));
        setHistoryCategories(cats);
      } catch {/* ignore */ }
    })();
    return () => { alive = false; };
  }, [auth?.Email]);

  const mergedCategories = useMemo(() => {
    const baseValuesLower = new Set(DEFAULT_EARNING_CATEGORIES.map(c => c.value.toLowerCase()));
    const extras = historyCategories.filter(c => !baseValuesLower.has(c.toLowerCase()));
    const defaults = DEFAULT_EARNING_CATEGORIES.map(c => ({
      value: c.value,
      labelKey: `categories.${c.key}`,
      labelFallback: c.value,
    }));
    const extraItems = extras.map(x => ({ value: x, labelKey: null, labelFallback: x }));
    return [...defaults, ...extraItems];
  }, [historyCategories]);

  // validação / KPIs
  const validAmount = Number(String(form.Amount).replace(",", ".")) > 0;
  const formValid = validAmount && !!form.FirstDate && N(form.Title) && N(form.WalletId);

  const total = Number(form.Amount || 0);
  const installmentsCount = Math.max(1, Number(form.InstallmentsCount || 0) || 1);
  const perInstallment = kind === "installments" ? (installmentsCount > 0 ? total / installmentsCount : 0) : 0;

  // submit
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const buildFormData = () => {
    const amt = Number(String(form.Amount).replace(",", ".")) || 0;
    const fd = new FormData();

    fd.append("UserEmail", auth?.Email || "");
    fd.append("Title", form.Title || (t?.("earnings.form.defaultTitle") || "Earning"));
    fd.append("Notes", form.Notes || "");
    fd.append("Amount", String(amt));
    fd.append("Currency", CURRENCY);
    fd.append("Category", form.Category || "");
    if (form.WalletId) fd.append("WalletId", String(form.WalletId));
    if (photo) fd.append("ImageFile", photo);

    fd.append("Date", form.FirstDate);

    if (kind === "one") {
      fd.append("Method", "ONE_OFF");
    } else if (kind === "installments") {
      fd.append("Method", "RECURRING");
      fd.append("RepeatEvery", "1");
      fd.append("RepeatUnit", "MONTH");
      fd.append("Occurrences", String(installmentsCount));
      // SplitMode default: SPLIT_TOTAL
    } else if (kind === "recurring") {
      const reps = form.RepeatCount ? Number(form.RepeatCount) : 12;
      fd.append("Method", "RECURRING");
      fd.append("RepeatEvery", "1");
      fd.append("RepeatUnit", PERIODICITY_TO_UNIT[form.Periodicity] || "MONTH");
      fd.append("Occurrences", String(reps));
    }

    return fd;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setErr(null);
    if (!formValid) return;
    setSubmitting(true);
    try {
      const res = await apiCall.post(EP_CREATE, buildFormData(), {
        headers: { "Content-Type": "multipart/form-data" },
        validateStatus: () => true,
      });
      if (res?.status >= 200 && res?.status < 300) {
        window.location.assign("/Earnings");
        return;
      }
      setErr(res?.data?.message || res?.error?.message || (t?.("errors.createEarning") || "Could not create earning."));
    } catch {
      setErr(t?.("errors.network") || "Network error while creating earning.");
    } finally {
      setSubmitting(false);
    }
  };

  const knownValuesLower = useMemo(
    () => new Set(DEFAULT_EARNING_CATEGORIES.map(c => c.value.toLowerCase()).concat(historyCategories.map(h => h.toLowerCase()))),
    [historyCategories]
  );
  const hasSelectedCustom = form.Category && !knownValuesLower.has(form.Category.toLowerCase());

  return (
    <div className="space-y-6" style={{ color: CONTRAST }}>
      <Title text={t?.("earnings.new") || "New earning"} />

      {/* KPIs  */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t?.("earnings.total") || "Total"} value={total.toLocaleString(undefined, { style: "currency", currency: CURRENCY })} />
        <StatCard title={t?.("earnings.installments") || "Installments"} value={kind === "installments" ? String(installmentsCount) : (kind === "recurring" ? (form.RepeatCount || "—") : "—")} />
        <StatCard title={t?.("earnings.perInstallment") || "Per installment"} value={(kind === "installments" ? perInstallment : 0).toLocaleString(undefined, { style: "currency", currency: CURRENCY })} />
      </div>

      {/* Seleção do método */}
      <Card style={{ background: PAPER, boxShadow: `inset 0 0 0 2px ${CONTRAST}` }}>
        <div className="flex flex-wrap items-center justify-evenly py-4">
          <Button type="button" variant={kind === "one" ? "primary" : "secondary"} onClick={() => setKind("one")} className="h-12 w-60 text-base rounded-lg">
            {t?.("earnings.method.oneoff") || "One-off"}
          </Button>
          <Button type="button" variant={kind === "installments" ? "primary" : "secondary"} onClick={() => setKind("installments")} className="h-12 w-60 text-base rounded-lg">
            {t?.("earnings.method.installments") || "Installments (credit)"}
          </Button>
          <Button type="button" variant={kind === "recurring" ? "primary" : "secondary"} onClick={() => setKind("recurring")} className="h-12 w-60 text-base rounded-lg">
            {t?.("earnings.method.recurring") || "Recurring"}
          </Button>
        </div>

        {kind === "installments" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t?.("earnings.installments.count") || "Number of installments"}
              type="number"
              min="1"
              value={form.InstallmentsCount}
              onChange={(e) => set("InstallmentsCount", e.target.value)}
            />
            <div className="self-end text-sm opacity-75 md:col-span-2" style={{ color: CONTRAST }}>
              {(t?.("earnings.installments.each") || "Each installment ≈")} {isFinite(perInstallment) ? perInstallment.toFixed(2) : "—"} {CURRENCY}
            </div>
          </div>
        )}

        {kind === "recurring" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label={t?.("earnings.recurring.periodicity") || "Periodicity"}
              value={form.Periodicity}
              onChange={(e) => set("Periodicity", e.target.value)}
            >
              {["Daily","Weekly","Monthly","Yearly"].map((p, i) => (
                <option key={`p-${i}`} value={p}>{t?.(`periodicity.${p.toLowerCase()}`) || p}</option>
              ))}
            </Select>
            <Input
              label={t?.("earnings.recurring.repeatCount") || "Repetitions (optional)"}
              type="number"
              min="1"
              value={form.RepeatCount}
              onChange={(e) => set("RepeatCount", e.target.value)}
            />
          </div>
        )}
      </Card>

      {/* Foto / Recibo  */}
      <Card style={{ background: PAPER, boxShadow: `inset 0 0 0 2px ${CONTRAST}` }}>
        <div className="flex items-start gap-4">
          <button
            type="button"
            className="w-28 h-28 rounded-md overflow-hidden flex items-center justify-center shrink-0"
            onClick={() => photoPreviewUrl && setLightboxOpen(true)}
            title={photoPreviewUrl ? (t?.("receipt.clickToEnlarge") || "Click to enlarge") : ""}
            style={{
              color: CONTRAST,
              background: "transparent",
              boxShadow: `inset 0 0 0 1px ${CONTRAST}`,
            }}
          >
            {photoPreviewUrl ? (
              <img src={photoPreviewUrl} alt={t?.("receipt.previewAlt") || "Preview"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs opacity-60 px-2 text-center">{t?.("receipt.noPreview") || "No preview"}</span>
            )}
          </button>
          <div className="flex-1">
            <label className="block mb-1 text-sm font-medium" style={{ color: CONTRAST }}>
              {t?.("earnings.photo._") || "Earning photo (optional)"}
            </label>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={(e) => handlePhotoPick(e.target.files?.[0] || null)} className="hidden" />
            <div className="flex items-center gap-2">
              <Button type="button" onClick={openPhotoPicker} className="h-11 rounded-md px-4">
                {photoPreviewUrl ? (t?.("receipt.change") || "Change photo") : (t?.("receipt.add") || "Add photo")}
              </Button>
              {photoPreviewUrl && (
                <Button type="button" variant="secondary" onClick={() => handlePhotoPick(null)} className="h-11 rounded-md px-4">
                  {t?.("receipt.remove") || "Remove"}
                </Button>
              )}
            </div>
            <p className="text-xs opacity-70 mt-2">
              {t?.("earnings.photoNote") || "Stored on the earning header. Instances can have their own photos later."}
            </p>
          </div>
        </div>
      </Card>

      {/* Form principal  */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card style={{ background: PAPER, boxShadow: `inset 0 0 0 2px ${CONTRAST}` }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t?.("earnings.form.title") || "Title"} value={form.Title} onChange={(e) => set("Title", e.target.value)} required />
            <Select label={t?.("earnings.form.wallet") || "Wallet"} value={form.WalletId} onChange={(e) => set("WalletId", e.target.value)} required>
              {walletOptions.map((w, i) => (<option key={w.id || `w-${i}`} value={w.id}>{w.name || "—"}</option>))}
            </Select>

            <Input label={t?.("earnings.form.total") || "Total amount"} type="number" step="0.01" value={form.Amount} onChange={(e) => set("Amount", e.target.value)} required />
            <Input label={t?.("earnings.form.firstDate") || (kind === "one" ? "Date" : "Start date")} type="date" value={form.FirstDate} onChange={(e) => set("FirstDate", e.target.value)} required />

            <Select label={t?.("earnings.form.category") || "Category"} value={form.Category} onChange={(e) => set("Category", e.target.value)}>
              <option value="">{t?.("common.select_option") || "Select an option"}</option>
              {mergedCategories.map((c, i) => (
                <option key={`cat-${i}`} value={c.value}>
                  {c.labelKey ? (t?.(c.labelKey) || c.labelFallback) : c.labelFallback}
                </option>
              ))}
              {hasSelectedCustom && <option value={form.Category}>{form.Category}</option>}
            </Select>
          </div>

          <TextArea label={t?.("earnings.form.notes") || "Notes"} rows={4} value={form.Notes} onChange={(e) => set("Notes", e.target.value)} />
        </Card>

        {err && <div className="text-sm text-red-600">{err}</div>}
      </form>

      <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${CONTRAST}` }}>
        <Button type="button" variant="secondary" onClick={() => window.history.back()} disabled={submitting} className="h-11 rounded-md px-4">
          {t?.("common.cancel") || "Cancel"}
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={submitting || !formValid} title={!formValid ? (t?.("common.fixErrors") || "Fix the errors above to continue") : ""} className="h-11 rounded-md px-4">
          {submitting ? (t?.("common.saving") || "Saving...") : (t?.("common.create") || "Create")}
        </Button>
      </div>

      {/* Lightbox */}
      {lightboxOpen && photoPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <img src={photoPreviewUrl} alt={t?.("receipt.modalAlt") || "Image (enlarged)"} className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}/>
        </div>
      )}
    </div>
  );
}

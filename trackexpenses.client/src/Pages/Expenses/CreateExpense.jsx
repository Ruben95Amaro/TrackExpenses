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
import QRCodeFromPhoto from "../../components/QR/QRCodeFromPhoto";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

const EP_CREATE   = "Expenses/CreateExpensesWithImage";
const EP_WALLETS  = "/wallets?includeArchived=true";
const EP_LIST_EXP = "Expenses/ListExpenses";

const unwrap = (v) => (Array.isArray(v) ? v : (v?.$values ?? []));
const N = (v) => (v ?? "").toString().trim();
const LAST_WALLET_KEY = "te:lastWalletId";

const DEFAULT_EXPENSE_CATEGORIES = [
  { key: "house",          value: "House" },
  { key: "car",            value: "Car" },
  { key: "bills",          value: "Bills" },
  { key: "utilities",      value: "Utilities" },
  { key: "health",         value: "Health" },
  { key: "education",      value: "Education" },
  { key: "personalCare",   value: "Personal Care" },
  { key: "entertainment",  value: "Entertainment" },
  { key: "subscriptions",  value: "Subscriptions" },
  { key: "debtPayments",   value: "Debt Payments" },
  { key: "others",         value: "Others" },
];

/** Ícones */
const QrIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
    <path d="M4 4h6v6H4V4Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 4h6v6h-6V4Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 14h6v6H4v-6Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 14h3v3m3-6v3m-6 3h3m0 0v3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const CamIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
    <path d="M9 7l1.2-1.6c.2-.3.5-.4.8-.4h2c.3 0 .6.1.8.4L15 7h3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3h3Z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="14" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

function QRUploadTile({ onDecoded, title, subtitle, label }) {
  const shellRef = useRef(null);
  const trigger = () => {
    const btn = shellRef.current?.querySelector("button, [role='button'], input[type='button']");
    btn?.click();
  };
  return (
    <div className="flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <p className="text-xs opacity-70">{subtitle}</p>
      </div>

      <div className="ml-auto mr-2 md:mr-4 lg:mr-6">
        <button
          type="button"
          onClick={trigger}
          className="shrink-0 w-32 h-32 rounded-md border-2 border-dashed border-white/30 bg-white/5 
                     hover:bg-white/10 hover:border-white/50 flex flex-col items-center justify-center gap-2 transition"
          title={title}
        >
          <span className="relative">
            <QrIcon className="w-9 h-9 opacity-90" />
            <span className="absolute -bottom-1 -right-1">
              <CamIcon className="w-5 h-5 opacity-90" />
            </span>
          </span>
          <span className="text-xs opacity-80">{label}</span>
        </button>
      </div>

      <div ref={shellRef} className="[&_button]:hidden [&_[role='button']]:hidden" aria-hidden>
        <QRCodeFromPhoto buttonLabel="hidden" onDecoded={onDecoded} />
      </div>
    </div>
  );
}

export default function CreateExpense() {
  const { auth } = useContext(AuthContext) || {};
  const { t } = useLanguage ? useLanguage() : { t: () => undefined };

  const [kind, setKind] = useState("one");

  const [form, setForm] = useState({
    Name: t?.("expenses.form.defaultName") || "Expense",
    Description: "",
    Value: "",
    PayAmount: "",
    StartDate: new Date().toISOString().slice(0, 10),
    EndDate: "",
    RepeatCount: "",
    Periodicity: "Monthly",
    Category: "",
    WalletId: "",
    Image: null,
    UploadType: "ExpenseImage",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // validação
  const [fieldErrors, setFieldErrors] = useState({});
  const [formValid, setFormValid] = useState(true);

  // Preview + lightbox
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const receiptInputRef = useRef(null);
  const openReceiptPicker = () => receiptInputRef.current?.click();
  const handleReceiptPick = (file) => {
    set("Image", file || null);
    setReceiptPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return file ? URL.createObjectURL(file) : null; });
  };
  useEffect(() => () => { if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl); }, [receiptPreviewUrl]);

  // Wallets
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

  // Categorias do histórico 
  const [historyCategories, setHistoryCategories] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const email = auth?.Email || "";
        if (!email) return;
        const res = await apiCall.get(EP_LIST_EXP, {
          params: { userEmail: email },
          validateStatus: () => true,
        });
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
    const baseValuesLower = new Set(DEFAULT_EXPENSE_CATEGORIES.map(c => c.value.toLowerCase()));
    const extras = historyCategories.filter(c => !baseValuesLower.has(c.toLowerCase()));
    const defaults = DEFAULT_EXPENSE_CATEGORIES.map(c => ({
      value: c.value,                  
      labelKey: `categories.${c.key}`,
      labelFallback: c.value,
    }));
    const extraItems = extras.map(x => ({
      value: x,
      labelKey: null,
      labelFallback: x,
    }));
    return [...defaults, ...extraItems];
  }, [historyCategories]);

  // ----------- validações (live) -----------
  const runValidation = (state) => {
    const F = state || form;
    const e = {};
    const totalNum = Number(F.Value);
    const paidNum = Number(F.PayAmount || 0);

    if (!N(F.Name))      e.Name = (t?.("errors.required") || "Required");
    if (!N(F.WalletId))  e.WalletId = (t?.("errors.required") || "Required");
    if (!N(F.StartDate)) e.StartDate = (t?.("errors.required") || "Required");

    if (!(totalNum > 0)) e.Value = (t?.("errors.invalidTotal") || "Total must be greater than zero.");
    if (paidNum < 0)     e.PayAmount = (t?.("errors.invalidPayAmount") || "Paid amount cannot be negative.");
    if (paidNum > totalNum) e.PayAmount = (t?.("errors.invalidPayAmount") || "Paid amount cannot exceed total value.");

    if (F.EndDate) {
      const s = new Date(F.StartDate), en = new Date(F.EndDate);
      if (en < s) e.EndDate = t?.("errors.invalidEndDate") || "End date cannot be before start date.";
    }

    setFieldErrors(e);
    const ok = Object.keys(e).length === 0;
    setFormValid(ok);
    return ok;
  };
  useEffect(() => {
    runValidation(form);
  }, [form.Name, form.WalletId, form.StartDate, form.EndDate, form.Value, form.PayAmount]);

  // KPIs
  const total = Number(form.Value || 0);
  const upfront = Number(form.PayAmount || 0);
  const remaining = Math.max(0, total - upfront);
  const installmentsCount = Math.max(1, Number(form.RepeatCount || 0) || 1);
  const perInstallment = kind === "installments" ? (installmentsCount > 0 ? remaining / installmentsCount : 0) : 0;

  const onQRDecoded = (text) => {
    const parts = String(text || "").split("*").map(s => s.trim()).filter(Boolean);
    const map = {};
    for (const p of parts) {
      const i = p.indexOf(":");
      if (i > 0) map[p.slice(0, i).trim()] = p.slice(i + 1).trim();
    }
    const dateRaw = map.F;
    const date = /^\d{8}$/.test(dateRaw)
      ? `${dateRaw.slice(0,4)}-${dateRaw.slice(4,6)}-${dateRaw.slice(6,8)}`
      : undefined;
    const totalParsed = map.O ? Number(String(map.O).replace(",", ".")) : undefined;
    const atcud = map.H;
    const docNo = map.G;
    const sellerNIF = map.A;
    const desc = [docNo ? `#${docNo}` : null, atcud ? `ATCUD:${atcud}` : null, sellerNIF ? `NIF:${sellerNIF}` : null]
      .filter(Boolean).join(" • ");

    setForm((f) => ({
      ...f,
      Description: desc ? `Fatura ${desc}` : f.Description,
      StartDate: date || f.StartDate,
      Value: totalParsed != null ? String(totalParsed) : f.Value,
    }));

    setKind("one");
  };

  // submit
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const toIsoIfSet = (d) => (d ? new Date(d).toISOString() : "");

  const buildFormData = () => {
    let Periodicity = "OneTime";
    let StartDate = form.StartDate;
    let EndDate = form.EndDate || "";
    let RepeatCount = 1;

    if (kind === "installments") {
      Periodicity = "Monthly";
      RepeatCount = installmentsCount;
      if (StartDate && RepeatCount) {
        const d = new Date(StartDate);
        d.setMonth(d.getMonth() + RepeatCount - 1);
        EndDate = d.toISOString().slice(0, 10);
      }
    } else if (kind === "recurring") {
      Periodicity = form.Periodicity || "Monthly";
      RepeatCount = form.RepeatCount ? Number(form.RepeatCount) : (Periodicity === "Endless" ? undefined : 12);
    }

    const fd = new FormData();
    fd.append("UserEmail", auth?.Email || "");
    fd.append("Name", form.Name || (t?.("expenses.form.defaultName") || "Expense"));
    fd.append("Description", form.Description || "");
    fd.append("Value", String(Number(total || 0).toFixed(2)));
    fd.append("PayAmount", String(Number(form.PayAmount || 0).toFixed(2)));
    fd.append("StartDate", toIsoIfSet(StartDate));
    if (EndDate) fd.append("EndDate", toIsoIfSet(EndDate));
    if (RepeatCount != null) fd.append("RepeatCount", String(RepeatCount || 1));
    fd.append("Periodicity", Periodicity);
    fd.append("Category", form.Category || "");
    fd.append("WalletId", form.WalletId || "");
    // fd.append("ShouldNotify", String(false));

    if (form.Image) {
      fd.append("UploadType", form.UploadType || "ExpenseImage");
      fd.append("Image", form.Image);
    }
    return fd;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setErr(null);
    if (!runValidation(form)) return;
    setSubmitting(true);
    try {
      const res = await apiCall.post(EP_CREATE, buildFormData(), {
        headers: { "Content-Type": "multipart/form-data" },
        validateStatus: () => true,
      });
      if (res?.status >= 200 && res?.status < 300) {
        window.location.assign("/Expenses");
        return;
      }
      setErr(res?.data?.message || res?.error?.message || (t?.("errors.createExpense") || "Could not create expense."));
    } catch {
      setErr(t?.("errors.network") || "Network error while creating expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const knownValuesLower = useMemo(
    () => new Set(DEFAULT_EXPENSE_CATEGORIES.map(c => c.value.toLowerCase()).concat(historyCategories.map(h => h.toLowerCase()))),
    [historyCategories]
  );
  const hasSelectedCustom = form.Category && !knownValuesLower.has(form.Category.toLowerCase());

  return (
    <div className="space-y-6">
      <Title text={t?.("expenses.new") || "New expense"} />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t?.("expenses.total") || "Total"} value={total.toLocaleString(undefined, { style: "currency", currency: "EUR" })} />
        <StatCard title={t?.("expenses.paid") || "Already paid"} value={Number(form.PayAmount || 0).toLocaleString(undefined, { style: "currency", currency: "EUR" })} />
        <StatCard title={t?.("expenses.remaining") || "Remaining"} value={remaining.toLocaleString(undefined, { style: "currency", currency: "EUR" })} />
      </div>

      {/* QR + Photo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <QRUploadTile
            onDecoded={onQRDecoded}
            title={t?.("qr.title") || "Read invoice QR (Portugal)"}
            subtitle={t?.("qr.subtitle") || "Upload a clear photo of the QR. I'll auto-fill date, value and description."}
            label={t?.("qr.scanFromPhoto") || "Scan from photo"}
          />
        </Card>

        <Card>
          <div className="flex items-start gap-4">
            {/* Preview (click to enlarge) */}
            <button
              type="button"
              className="w-28 h-28 rounded-md overflow-hidden ring-1 ring-white/10 bg-white/5 flex items-center justify-center shrink-0"
              onClick={() => receiptPreviewUrl && setLightboxOpen(true)}
              title={receiptPreviewUrl ? (t?.("receipt.clickToEnlarge") || "Click to enlarge") : ""}
            >
              {receiptPreviewUrl ? (
                <img src={receiptPreviewUrl} alt={t?.("receipt.previewAlt") || "Receipt preview"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs opacity-60 px-2 text-center">{t?.("receipt.noPreview") || "No preview"}</span>
              )}
            </button>

            {/* Uploader via botão */}
            <div className="flex-1">
              <label className="block mb-1 text-sm font-medium">{t?.("receipt.label") || "Receipt / expense photo"}</label>

              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleReceiptPick(e.target.files?.[0] || null)}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <Button type="button" onClick={openReceiptPicker} className="h-11 rounded-md px-4">
                  {receiptPreviewUrl ? (t?.("receipt.change") || "Change photo") : (t?.("receipt.add") || "Add photo")}
                </Button>

                {receiptPreviewUrl && (
                  <Button type="button" variant="secondary" onClick={() => handleReceiptPick(null)} className="h-11 rounded-md px-4">
                    {t?.("receipt.remove") || "Remove"}
                  </Button>
                )}
              </div>

              <p className="text-xs opacity-70 mt-2">
                {t?.("receipt.note") || "This is stored on the expense (not the QR reading)."}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-evenly py-4">
          <Button
            type="button"
            variant={kind === "one" ? "primary" : "secondary"}
            onClick={() => setKind("one")}
            className="h-12 w-60 text-base rounded-lg"
          >
            {t?.("expenses.method.one") || "One-off"}
          </Button>
          <Button
            type="button"
            variant={kind === "installments" ? "primary" : "secondary"}
            onClick={() => setKind("installments")}
            className="h-12 w-60 text-base rounded-lg"
          >
            {t?.("expenses.method.installments") || "Installments (credit)"}
          </Button>
          <Button
            type="button"
            variant={kind === "recurring" ? "primary" : "secondary"}
            onClick={() => setKind("recurring")}
            className="h-12 w-60 text-base rounded-lg"
          >
            {t?.("expenses.method.recurring") || "Recurring"}
          </Button>
        </div>

        {kind === "installments" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label={t?.("expenses.installments.count") || "Number of installments"} type="number" min="1" value={form.RepeatCount} onChange={(e) => set("RepeatCount", e.target.value)} />
            <div className="self-end text-sm opacity-75 md:col-span-2">
              {(t?.("expenses.installments.each") || "Each installment ≈")} {isFinite(perInstallment) ? perInstallment.toFixed(2) : "—"} €
              <span className="ml-2 opacity-60">{t?.("expenses.installments.note") || "(uses “Paid already” as the down payment)"}</span>
            </div>
          </div>
        )}

        {kind === "recurring" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label={t?.("expenses.recurring.periodicity") || "Periodicity"} value={form.Periodicity} onChange={(e) => set("Periodicity", e.target.value)}>
              {["Daily","Weekly","Monthly","Yearly","Endless"].map((p, i) => (
                <option key={`p-${i}`} value={p}>{t?.(`periodicity.${p.toLowerCase()}`) || p}</option>
              ))}
            </Select>
            <Input label={t?.("expenses.recurring.repeatCount") || "Repetitions (optional)"} type="number" min="1" value={form.RepeatCount} onChange={(e) => set("RepeatCount", e.target.value)} />
          </div>
        )}
      </Card>

      {/* Main form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t?.("expenses.form.name") || "Name"} value={form.Name} onChange={(e) => set("Name", e.target.value)} required />
            <Select label={t?.("expenses.form.wallet") || "Wallet"} value={form.WalletId} onChange={(e) => set("WalletId", e.target.value)} required>
              {walletOptions.map((w, i) => (<option key={w.id || `w-${i}`} value={w.id}>{w.name || "—"}</option>))}
            </Select>

            <Input label={t?.("expenses.form.total") || "Total amount"} type="number" step="0.01" value={form.Value} onChange={(e) => set("Value", e.target.value)} required />
            <Input label={t?.("expenses.form.paidAlready") || "Paid already (optional)"} type="number" step="0.01" value={form.PayAmount} onChange={(e) => set("PayAmount", e.target.value)} />

            <Input label={t?.("expenses.form.startDate") || "Start date"} type="date" value={form.StartDate} onChange={(e) => set("StartDate", e.target.value)} required />
            <Input label={t?.("expenses.form.endDate") || "End date (optional)"} type="date" value={form.EndDate} onChange={(e) => set("EndDate", e.target.value)} />

            {/* Category */}
            <Select label={t?.("expenses.form.category") || "Category"} value={form.Category} onChange={(e) => set("Category", e.target.value)}>
              <option value="">{t?.("common.select_option") || "Select an option"}</option>
              {mergedCategories.map((c, i) => (
                <option key={`cat-${i}`} value={c.value}>
                  {c.labelKey ? (t?.(c.labelKey) || c.labelFallback) : c.labelFallback}
                </option>
              ))}
              {hasSelectedCustom && <option value={form.Category}>{form.Category}</option>}
            </Select>
          </div>

          <TextArea label={t?.("expenses.form.description") || "Description"} rows={4} value={form.Description} onChange={(e) => set("Description", e.target.value)} />
        </Card>

        {err && <div className="text-sm text-red-600">{err}</div>}
      </form>

      {/* Footer buttons */}
      <div className="mt-6 pt-4 flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={() => window.history.back()} disabled={submitting} className="h-11 rounded-md px-4">
          {t?.("common.cancel") || "Cancel"}
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={submitting || !formValid} title={!formValid ? (t?.("common.fixErrors") || "Fix the errors above to continue") : ""} className="h-11 rounded-md px-4">
          {submitting ? (t?.("common.saving") || "Saving...") : (t?.("common.create") || "Create")}
        </Button>
      </div>

      {/* Lightbox */}
      {lightboxOpen && receiptPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <img src={receiptPreviewUrl} alt={t?.("receipt.modalAlt") || "Receipt (enlarged)"} className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}/>
        </div>
      )}
    </div>
  );
}

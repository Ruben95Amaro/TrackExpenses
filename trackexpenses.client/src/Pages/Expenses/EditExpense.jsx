// src/pages/Expenses/EditExpense.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

/* Components */
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Form/Input";
import TextArea from "../../components/Form/TextArea";
import StatCard from "../../components/UI/StatCard";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

/* API */
import apiCall from "../../services/ApiCallGeneric/apiCall";

/* ───────────────── helpers ───────────────── */
const unwrap = (v) => (Array.isArray(v) ? v : v?.$values ?? (v ?? []));
const N = (v) => (v ?? "").toString().trim();
const ok2xx = (r) => r && r.status >= 200 && r.status < 300;
const hasBody = (r) => r && r.status !== 204 && r.data != null;

const getBackendBase = () => {
  const raw = apiCall?.defaults?.baseURL || "";
  if (!raw) return window.location.origin + "/";
  return raw.replace(/\/api\/?$/i, "/");
};
const getPublicUrl = (relativePath) => {
  if (!relativePath) return null;
  const rel = String(relativePath).replace(/^\/+/, "");
  try {
    return new URL(rel, getBackendBase()).toString();
  } catch {
    return `/${rel}`;
  }
};
const validateImageFile = (f) => {
  if (!f) return "No file selected.";
  if (!/^image\//i.test(f.type)) return "Please choose an image (JPG, PNG, HEIC…).";
  if (f.size > 10 * 1024 * 1024) return "Maximum size: 10 MB.";
  return null;
};
const makeTransparentPngBlob = () => {
  const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9W8cPDoAAAAASUVORK5CYII=";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: "image/png" });
};

/* ───────────────── endpoints ───────────────── */
const EP_GET_EXPENSE = (id) => `Expenses/GetExpenseById/${id}`;
const EP_UPDATE_EXPENSE = "Expenses/UpdateExpense";
const EP_GET_EXPENSE_IMAGE = (expenseId) => `Expenses/GetExpenseImage/${expenseId}`;
const EP_UPLOAD_EXPENSE_IMAGE = (expenseId) => `Expenses/UploadImage/${expenseId}`;
const EP_GET_INSTANCE = (instanceId) => `Expenses/GetExpenseInstanceById?id=${instanceId}`;
const EP_UPDATE_INSTANCE = "Expenses/UpdateExpenseInstance";
const EP_UPLOAD_INSTANCE_IMAGE = (instanceId) => `Expenses/Instance/UploadImage/${instanceId}`;
const EP_LIST_INSTANCES_WITH_PATH = (expenseId) => `Expenses/InstancesByExpense/${expenseId}`;

export default function EditExpense() {
  const { id: routeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();

  // ✅ id robusto (rota, state, query)
  const stateId = location.state?.id ?? location.state?.expenseId ?? null;
  const queryId = new URLSearchParams(location.search).get("id");
  const safeId = routeId ?? stateId ?? queryId ?? null;

  const c = theme?.colors || {};
  const CONTRAST = isDarkMode ? "#FFFFFF" : "#000000";
  const BORDER_WIDTH = "2px";
  const PAPER = c.background?.paper ?? (isDarkMode ? "rgba(2,6,23,0.92)" : "rgba(255,255,255,0.9)");
  const ROWSEP = isDarkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.22)";
  const thumbRing = isDarkMode ? "ring-white/20 bg-white/5" : "ring-black/20 bg-black/5";
  const rowHover = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5";
  const thickCardStyle = { border: `${BORDER_WIDTH} solid ${CONTRAST}` };

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [expense, setExpense] = useState(null);

  const [lightboxUrl, setLightboxUrl] = useState(null);

  // instance modal
  const [instModalOpen, setInstModalOpen] = useState(false);
  const [instEditing, setInstEditing] = useState(null);
  const [instPaidAmount, setInstPaidAmount] = useState("");
  const [instDate, setInstDate] = useState("");
  const [instFile, setInstFile] = useState(null);
  const [instUploading, setInstUploading] = useState(false);
  const [instPreviewUrl, setInstPreviewUrl] = useState(null);
  const instFileInputRef = useRef(null);

  // expense photo
  const [expenseFile, setExpenseFile] = useState(null);
  const [expensePreview, setExpensePreview] = useState(null);
  const [expenseUploading, setExpenseUploading] = useState(false);
  const expenseFileInputRef = useRef(null);

  // ordered instances
  const instances = useMemo(() => {
    const arr = unwrap(expense?.Instances);
    return arr.slice().sort((a, b) => new Date(a?.DueDate ?? 0) - new Date(b?.DueDate ?? 0));
  }, [expense]);

  const totalPlanned = Number(expense?.Value || 0);
  const alreadyPaid = useMemo(
    () => instances.reduce((acc, i) => acc + Number(i?.PaidAmount || 0), 0),
    [instances]
  );
  const remaining = Math.max(0, totalPlanned - alreadyPaid);

  /* ───────────────── load ───────────────── */
  useEffect(() => {
    let alive = true;
    (async () => {
      // 🛡️ não chama API se não houver id
      if (!safeId) {
        if (alive) {
          setErr(t?.("expenses.editPage.errLoadExpense") || "Could not load expense.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setErr(null);

        // expense + instances
        const res = await apiCall.get(EP_GET_EXPENSE(safeId), { validateStatus: () => true });
        if (!ok2xx(res) || !hasBody(res))
          throw new Error(res?.data?.message || t?.("expenses.editPage.errLoadExpense") || "Could not load expense.");
        let exp = { ...res.data, Instances: unwrap(res.data?.Instances) };

        // instance image paths
        const instPaths = await apiCall.get(EP_LIST_INSTANCES_WITH_PATH(safeId), { validateStatus: () => true });
        if (ok2xx(instPaths) && Array.isArray(instPaths.data)) {
          const map = new Map(
            instPaths.data.map((x) => [String(x.Id ?? x.id), x.imagePath ?? x.ImagePath ?? null])
          );
          exp = {
            ...exp,
            Instances: exp.Instances.map((it) => {
              const rel = map.get(String(it.Id)) || it?.Image?.Name || null;
              return { ...it, _imageRel: rel, _imageUrl: rel ? getPublicUrl(rel) : null };
            }),
          };
        } else {
          // fallback
          exp = {
            ...exp,
            Instances: exp.Instances.map((it) => {
              const rel = it?.Image?.Name || null;
              return { ...it, _imageRel: rel, _imageUrl: rel ? getPublicUrl(rel) : null };
            }),
          };
        }

        if (alive) setExpense(exp);

        // expense image
        const imgRes = await apiCall.get(EP_GET_EXPENSE_IMAGE(safeId), { validateStatus: () => true });
        if (ok2xx(imgRes) && hasBody(imgRes)) {
          const rel = imgRes?.data?.imagePath;
          setExpensePreview(rel && rel !== "NoPhoto" ? getPublicUrl(rel) : null);
        }
      } catch (e) {
        if (alive) setErr(e?.message || t?.("expenses.editPage.errLoadExpense") || "Could not load expense.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [safeId, t]);

  // local previews
  useEffect(() => {
    if (!expenseFile) return;
    const url = URL.createObjectURL(expenseFile);
    setExpensePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [expenseFile]);

  useEffect(() => {
    if (!instFile) return;
    const url = URL.createObjectURL(instFile);
    setInstPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [instFile]);

  /* ───────────────── instance ───────────────── */
  const openInstanceModal = async (instId) => {
    try {
      const r = await apiCall.get(EP_GET_INSTANCE(instId), { validateStatus: () => true });
      if (!ok2xx(r) || !hasBody(r)) throw new Error(t?.("expenses.editPage.errLoadInstallment") || "Could not load installment.");

      const inst = r.data;
      setInstEditing(inst);
      setInstPaidAmount(inst?.PaidAmount ?? 0);
      setInstDate(
        inst?.DueDate
          ? new Date(inst.DueDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setInstFile(null);

      const existingRel = inst?.imagePath || inst?.ImagePath || inst?.Image?.Name || null;
      const existingUrl = existingRel ? getPublicUrl(existingRel) : null;
      setInstPreviewUrl(existingUrl);

      setInstModalOpen(true);
    } catch (e) {
      alert(e?.message || t?.("expenses.editPage.errOpenInstallment") || "Could not open installment.");
    }
  };

  const refreshExpense = async () => {
    if (!safeId) return;
    const e = await apiCall.get(EP_GET_EXPENSE(safeId), { validateStatus: () => true });
    if (ok2xx(e) && hasBody(e)) {
      let exp = { ...e.data, Instances: unwrap(e.data?.Instances) };
      setExpense(exp);
    }
  };

  const saveInstance = async () => {
    if (!instEditing) return;

    const paidAmountNum = Number(instPaidAmount || 0);
    const valueNum = Number(instEditing?.Value || 0);
    const isPaid = valueNum > 0 && paidAmountNum >= valueNum;

    try {
      const payload = {
        Id: instEditing.Id,
        DueDate: new Date(instDate).toISOString(),
        IsPaid: isPaid,
        Value: valueNum,
        PaidAmount: paidAmountNum,
      };

      const r = await apiCall.post(EP_UPDATE_INSTANCE, payload, { validateStatus: () => true });
      if (!ok2xx(r)) throw new Error(t?.("expenses.editPage.errUpdateInstallment") || "Could not update installment.");

      if (instFile) {
        const errMsg = validateImageFile(instFile);
        if (errMsg) return alert(errMsg);

        setInstUploading(true);
        const fd = new FormData();
        fd.append("image", instFile);
        const up = await apiCall.post(EP_UPLOAD_INSTANCE_IMAGE(instEditing.Id), fd, { validateStatus: () => true });
        setInstUploading(false);

        if (ok2xx(up)) {
          const rel = up?.data?.imagePath;
          if (rel) setInstPreviewUrl(getPublicUrl(rel) + `?t=${Date.now()}`);
        } else {
          console.error("Upload instance image failed:", up?.status, up?.data);
        }
      }

      await refreshExpense();
      setInstModalOpen(false);
    } catch (e) {
      setInstUploading(false);
      alert(e?.message || t?.("expenses.editPage.errSaveInstallment") || "Could not save installment.");
    }
  };

  /** “Remove” instance photo by uploading a tiny transparent PNG. */
  const removeInstancePhoto = async () => {
    if (!instEditing) return;
    try {
      setInstUploading(true);
      const blank = makeTransparentPngBlob();
      const fd = new FormData();
      fd.append("image", new File([blank], "blank.png", { type: "image/png" }));
      await apiCall.post(EP_UPLOAD_INSTANCE_IMAGE(instEditing.Id), fd, { validateStatus: () => true });
      setInstUploading(false);

      setInstPreviewUrl(null);
      if (instFileInputRef.current) instFileInputRef.current.value = "";
      await refreshExpense();
      alert(t?.("expenses.editPage.photoRemoved") || "Photo removed from installment.");
    } catch (e) {
      setInstUploading(false);
      alert(e?.message || t?.("expenses.editPage.errRemovePhoto") || "Could not remove photo.");
    }
  };

  /* ───────────────── expense photo ───────────────── */
  const onSelectExpenseFile = (f) => {
    const errMsg = validateImageFile(f);
    if (errMsg) return alert(errMsg);
    setExpenseFile(f);
  };

  const uploadExpenseImage = async () => {
    if (!expenseFile || !expense?.Id) return;
    try {
      setExpenseUploading(true);
      const fd = new FormData();
      fd.append("Image", expenseFile);
      const r = await apiCall.post(EP_UPLOAD_EXPENSE_IMAGE(expense.Id), fd, { validateStatus: () => true });
      setExpenseUploading(false);

      if (ok2xx(r)) {
        const rel = r?.data?.imagePath ?? r?.data?.path ?? r?.data;
        if (rel) setExpensePreview(getPublicUrl(rel) + `?t=${Date.now()}`);
        setExpenseFile(null);
        if (expenseFileInputRef.current) expenseFileInputRef.current.value = "";
      } else {
        throw new Error(r?.data?.message || "Upload failed");
      }
    } catch (e) {
      setExpenseUploading(false);
      alert(e?.message || t?.("expenses.editPage.errUploadExpensePhoto") || "Could not upload expense photo.");
    }
  };

  const clearExpensePhotoSelection = () => {
    setExpenseFile(null);
    if (expenseFileInputRef.current) expenseFileInputRef.current.value = "";
  };

  /** “Remove” expense photo by uploading a tiny transparent PNG. */
  const removeExpensePhoto = async () => {
    if (!expense?.Id) return;
    try {
      setExpenseUploading(true);
      const blank = makeTransparentPngBlob();
      const fd = new FormData();
      fd.append("Image", new File([blank], "blank.png", { type: "image/png" }));
      const r = await apiCall.post(EP_UPLOAD_EXPENSE_IMAGE(expense.Id), fd, { validateStatus: () => true });
      setExpenseUploading(false);

      if (ok2xx(r)) {
        setExpensePreview(null);
        if (expenseFileInputRef.current) expenseFileInputRef.current.value = "";
        alert(t?.("expenses.editPage.expensePhotoRemoved") || "Expense photo removed.");
      } else {
        throw new Error(r?.data?.message || "Remove failed");
      }
    } catch (e) {
      setExpenseUploading(false);
      alert(e?.message || t?.("expenses.editPage.errRemoveExpensePhoto") || "Could not remove expense photo.");
    }
  };

  const saveExpense = async () => {
    if (!expense) return;
    try {
      const payload = {
        Id: expense.Id,
        Name: N(expense.Name) || "Expense",
        Description: expense.Description || "",
        Value: Number(expense.Value || 0),
        PayAmount: Number(alreadyPaid.toFixed(2)),
        StartDate: expense.StartDate ? new Date(expense.StartDate).toISOString() : null,
        EndDate: expense.EndDate ? new Date(expense.EndDate).toISOString() : null,
        RepeatCount: expense.RepeatCount ?? 0,
        Periodicity: expense.Periodicity || "Monthly",
        Category: expense.Category || "",
        GroupId: expense.GroupId ?? null,
        WalletId: expense.WalletId ?? null,
      };

      const r = await apiCall.put(EP_UPDATE_EXPENSE, payload, { validateStatus: () => true });
      if (ok2xx(r)) {
        if (expenseFile) await uploadExpenseImage();
        alert(t?.("expenses.editPage.updated") || "Expense updated.");
      } else {
        throw new Error(r?.data?.message || "Update failed");
      }
    } catch (e) {
      alert(e?.message || t?.("expenses.editPage.errUpdateExpense") || "Could not update expense.");
    }
  };

  // ───────────── early returns ─────────────
  if (!safeId) {
    return (
      <div className="p-6">
        <div className="mb-4" style={{ color: isDarkMode ? "#fecaca" : "#b91c1c" }}>
          {t?.("expenses.editPage.errLoadExpense") || "Could not load expense."}
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          {t?.("common.back") || "Back"}
        </Button>
      </div>
    );
  }

  if (loading) return <div className="p-6" style={{ color: CONTRAST }}>{t?.("common.loading") || "Loading…"}</div>;
  if (err) return <div className="p-6" style={{ color: CONTRAST }}>{err}</div>;
  if (!expense) return <div className="p-6" style={{ color: CONTRAST }}>{t?.("common.notFound") || "Not found."}</div>;

  return (
    <div className="space-y-6" style={{ color: CONTRAST }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Title text={t?.("expenses.editPage.title") || "Edit Expense"} />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            {t?.("common.back") || "Back"}
          </Button>
          <Button onClick={saveExpense}>{t?.("common.save") || "Save"}</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={t?.("expenses.editPage.kpiPlanned") || "Planned (total)"}
          value={totalPlanned.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
        />
        <StatCard
          title={t?.("expenses.editPage.kpiAlreadyPaid") || "Already paid"}
          value={alreadyPaid.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
        />
        <StatCard
          title={t?.("expenses.editPage.kpiRemaining") || "Remaining"}
          value={remaining.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
        />
      </div>

      {/* Base data */}
      <Card style={{ ...thickCardStyle, background: PAPER }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t?.("expenses.form.name") || "Name"} value={expense.Name || ""} onChange={(e) => setExpense((x) => ({ ...x, Name: e.target.value }))} />
          <Input label={t?.("expenses.form.totalAmount") || "Total amount"} type="number" step="0.01" value={expense.Value ?? ""} onChange={(e) => setExpense((x) => ({ ...x, Value: e.target.value }))} />
          <Input
            label={t?.("expenses.form.startDate") || "Start date"}
            type="date"
            value={expense.StartDate ? new Date(expense.StartDate).toISOString().slice(0, 10) : ""}
            onChange={(e) => setExpense((x) => ({ ...x, StartDate: new Date(e.target.value).toISOString() }))}
          />
          <Input
            label={t?.("expenses.form.endDate") || "End date"}
            type="date"
            value={expense.EndDate ? new Date(expense.EndDate).toISOString().slice(0, 10) : ""}
            onChange={(e) =>
              setExpense((x) => ({ ...x, EndDate: e.target.value ? new Date(e.target.value).toISOString() : null }))
            }
          />
          <Input label={t?.("expenses.form.category") || "Category"} value={expense.Category ?? ""} onChange={(e) => setExpense((x) => ({ ...x, Category: e.target.value }))} />
        </div>

        <TextArea label={t?.("expenses.form.description") || "Description"} rows={3} value={expense.Description ?? ""} onChange={(e) => setExpense((x) => ({ ...x, Description: e.target.value }))} />
      </Card>

      {/* Expense photo */}
      <Card style={{ ...thickCardStyle, background: PAPER }}>
        <div className="flex items-start gap-4">
          <button
            type="button"
            className={`w-28 h-28 rounded-lg overflow-hidden ring-2 ${thumbRing} flex items-center justify-center shrink-0`}
            onClick={() => expensePreview && setLightboxUrl(expensePreview)}
            title={expensePreview ? (t?.("common.clickToEnlarge") || "Click to enlarge") : ""}
          >
            {expensePreview ? (
              <img src={expensePreview} alt={t?.("expenses.editPage.expensePhotoAlt") || "Expense photo"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs opacity-70 px-2 text-center">{t?.("common.noPhoto") || "No photo"}</span>
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label className="block mb-1 text-sm font-medium" style={{ color: CONTRAST }}>
                {t?.("expenses.editPage.receiptPhoto") || "Receipt / expense photo"}
              </label>
              <span
                className={`ml-2 text-[11px] px-2 py-0.5 rounded ${
                  expensePreview ? "bg-green-600/15 text-green-700" : "bg-red-600/15 text-red-700"
                }`}
              >
                {expensePreview ? (t?.("common.hasPhoto") || "Has photo") : (t?.("common.noPhoto") || "No photo")}
              </span>
            </div>

            <input
              ref={expenseFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => onSelectExpenseFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs opacity-80 mt-1">{t?.("expenses.editPage.photoHintExpense") || "This is stored on the expense (not the QR reading)."}</p>

            <div className="mt-2 flex flex-wrap gap-2">
              <Button onClick={uploadExpenseImage} disabled={!expenseFile || expenseUploading}>
                {expenseUploading ? (t?.("common.uploading") || "Uploading…") : (t?.("common.upload") || "Upload")}
              </Button>
              <Button variant="secondary" onClick={clearExpensePhotoSelection} disabled={!expenseFile}>
                {t?.("common.clearSelection") || "Clear selection"}
              </Button>
              <Button variant="secondary" onClick={removeExpensePhoto} disabled={expenseUploading || !expensePreview}>
                {t?.("common.removeCurrent") || "Remove current"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Instances */}
      <Card style={{ ...thickCardStyle, background: PAPER }}>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm table-auto"
            style={{
              minWidth: "56rem",
              borderCollapse: "separate",
              borderSpacing: 0,
              color: CONTRAST,
              background: "transparent",
            }}
          >
            <thead
              className="sticky top-0 z-10"
              style={{
                background: "inherit",
                color: CONTRAST,
                backgroundClip: "padding-box",
              }}
            >
              <tr>
                {[t?.("common.date") || "Date",
                  t?.("common.amount") || "Amount",
                  t?.("expenses.editPage.paid") || "Paid",
                  t?.("common.status") || "Status",
                  t?.("common.photo") || "Photo",
                  t?.("common.actions") || "Actions"].map((h) => (
                  <th
                    key={h}
                    className="py-2 px-4 uppercase text-xs font-semibold tracking-wider text-center"
                    style={{ borderBottom: `1px solid ${CONTRAST}` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {instances.map((inst, idx) => {
                const paid = Number(inst?.PaidAmount || 0);
                const value = Number(inst?.Value || 0);
                const isPaid = value > 0 && paid >= value;
                const rel = inst?._imageRel || inst?.imagePath || inst?.ImagePath || inst?.Image?.Name || null;
                const photoUrl = inst?._imageUrl || (rel ? getPublicUrl(rel) : null);
                const hasPhoto = !!(photoUrl || rel || inst?.ImageId);
                const isLast = idx === instances.length - 1;

                return (
                  <tr
                    key={inst.Id}
                    className={`transition-colors ${rowHover}`}
                    style={{
                      borderBottom: isLast ? `${BORDER_WIDTH} solid ${CONTRAST}` : `1px solid ${ROWSEP}`,
                    }}
                  >
                    <td className="py-2 px-4 text-center">
                      {inst?.DueDate ? new Date(inst.DueDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {Number(inst?.Value || 0).toLocaleString(undefined, { style: "currency", currency: "EUR" })}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {Number(inst?.PaidAmount || 0).toLocaleString(undefined, { style: "currency", currency: "EUR" })}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs inline-block ${
                          isPaid ? "bg-green-600/15 text-green-700" : "bg-red-600/15 text-red-700"
                        }`}
                      >
                        {isPaid ? (t?.("expenses.editPage.statusPaid") || "Paid") : (t?.("expenses.editPage.statusNotPaid") || "Not paid")}
                      </span>
                    </td>

                    <td className="py-2 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs inline-block ${
                          hasPhoto ? "bg-green-600/15 text-green-700" : "bg-red-600/15 text-red-700"
                        }`}
                      >
                        {hasPhoto ? (t?.("common.hasPhoto") || "Has photo") : (t?.("common.noPhoto") || "No photo")}
                      </span>
                      {hasPhoto && photoUrl && (
                        <div className="mt-1">
                          <Button variant="secondary" onClick={() => setLightboxUrl(photoUrl)} className="!w-auto px-3 !h-8 text-xs">
                            {t?.("common.view") || "View"}
                          </Button>
                        </div>
                      )}
                    </td>

                    <td className="py-2 px-4 text-center">
                      <Button variant="secondary" onClick={() => openInstanceModal(inst.Id)}>
                        {t?.("common.edit") || "Edit"}
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {!instances.length && (
                <tr>
                  <td className="py-6 px-4 opacity-60 text-center" colSpan={6} style={{ borderBottom: `${BORDER_WIDTH} solid ${CONTRAST}` }}>
                    {t?.("expenses.editPage.noInstances") || "No instances."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt={t?.("common.previewAlt") || "Preview"} className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Instance modal */}
      {instModalOpen && instEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setInstModalOpen(false)}>
          <div
            className="rounded-xl w-full max-w-lg p-4"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: PAPER,
              color: CONTRAST,
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              border: `${BORDER_WIDTH} solid ${CONTRAST}`,
            }}
          >
            <h3 className="text-lg font-semibold mb-3">{t?.("expenses.editPage.modalTitle") || "Edit installment"}</h3>

            <div className="grid gap-3">
              <Input label={t?.("expenses.editPage.dueDate") || "Due date"} type="date" value={instDate} onChange={(e) => setInstDate(e.target.value)} />
              <Input label={t?.("expenses.editPage.paidAmount") || "Paid amount"} type="number" step="0.01" value={instPaidAmount} onChange={(e) => setInstPaidAmount(e.target.value)} />

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className={`w-20 h-20 rounded-lg overflow-hidden ring-2 ${thumbRing} flex items-center justify-center shrink-0`}
                  onClick={() => instPreviewUrl && setLightboxUrl(instPreviewUrl)}
                  title={instPreviewUrl ? (t?.("common.clickToEnlarge") || "Click to enlarge") : ""}
                >
                  {instPreviewUrl ? (
                    <img src={instPreviewUrl} alt={t?.("expenses.editPage.instancePhotoAlt") || "Instance"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] opacity-70 px-2 text-center">{t?.("common.noPhoto") || "No photo"}</span>
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm mb-1" style={{ color: CONTRAST }}>
                      {t?.("expenses.editPage.receiptPhotoOptional") || "Receipt photo (optional)"}
                    </label>
                    <span
                      className={`ml-2 text-[11px] px-2 py-0.5 rounded ${instPreviewUrl ? "bg-green-600/15 text-green-700" : "bg-red-600/15 text-red-700"}`}
                    >
                      {instPreviewUrl ? (t?.("common.hasPhoto") || "Has photo") : (t?.("common.noPhoto") || "No photo")}
                    </span>
                  </div>

                  <input ref={instFileInputRef} type="file" accept="image/*" onChange={(e) => setInstFile(e.target.files?.[0] || null)} />

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={removeInstancePhoto} disabled={instUploading || !instPreviewUrl}>
                      {t?.("common.removeCurrent") || "Remove current"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="secondary" onClick={() => setInstModalOpen(false)}>
                {t?.("common.cancel") || "Cancel"}
              </Button>
              <Button onClick={saveInstance} disabled={instUploading}>
                {instUploading ? (t?.("common.saving") || "Saving…") : (t?.("common.save") || "Save")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

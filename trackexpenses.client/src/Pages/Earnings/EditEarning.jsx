import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* Components */
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import StatCard from "../../components/UI/StatCard";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Form/Input";
import TextArea from "../../components/Form/TextArea";

/* API */
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

/* Endpoints (match backend) */
const EP_GET = (id) => `Earnings/GetById/${id}`;
const EP_UPDATE = (id) => `Earnings/UpdateEarningWithImage/${id}`;
const EP_GET_IMG = (id) => `Earnings/GetEarningImage/${id}`;
const EP_UPLOAD_IMG = (id) => `Earnings/UploadImage/${id}`;
const EP_GET_INSTANCE = (iid) => `Earnings/GetEarningInstanceById?id=${iid}`;
const EP_LIST_INST = (eid) => `Earnings/InstancesByEarning/${eid}`;
const EP_UPD_INST = `Earnings/UpdateEarningInstance`;
const EP_INST_IMG = (iid) => `Earnings/Instance/UploadImage/${iid}`;
const CURRENCY = "EUR";

/* Helpers */
const unwrap = (v) => (Array.isArray(v) ? v : v?.$values ?? (v ?? []));
const N = (v) => (v ?? "").toString().trim();
const ok2xx = (r) => r && r.status >= 200 && r.status < 300;
const hasBody = (r) => r && r.status !== 204 && r.data != null;

const backendBase = () => {
  const raw = apiCall?.defaults?.baseURL || "";
  return raw ? raw.replace(/\/api\/?$/i, "/") : window.location.origin + "/";
};
const publicUrl = (rel) => (rel ? new URL(String(rel).replace(/^\/+/, ""), backendBase()).toString() : null);

const dateOnly = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d) ? String(s).slice(0, 10) : d.toISOString().slice(0, 10);
};

// parse “1.234,56” / “1234.56”
const parseMoney = (val) => {
  if (val == null) return 0;
  let s = String(val).trim();
  if (!s) return 0;
  s = s.replace(/[^\d.,-]/g, "");
  const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".");
  let dec = -1;
  if (lastComma >= 0 && lastDot >= 0) dec = Math.max(lastComma, lastDot);
  else if (lastComma >= 0) dec = lastComma;
  else if (lastDot >= 0) dec = lastDot;
  if (dec >= 0) {
    const intPart = s.slice(0, dec).replace(/[.,]/g, "");
    const frac = s.slice(dec + 1).replace(/[^\d]/g, "");
    s = `${intPart}.${frac}`;
  } else {
    s = s.replace(/[.,]/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

/** tiny transparent png (to “remove” photos through upload) */
const makeTransparentPngBlob = () => {
  const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9W8cPDoAAAAASUVORK5CYII=";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: "image/png" });
};

/* ───────────────── pills ───────────────── */
const Pill = ({ tone = "neutral", children }) => {
  const styles = {
    neutral: "bg-slate-600/20 text-slate-300",
    success: "bg-emerald-600/15 text-emerald-300",
    danger: "bg-rose-600/15 text-rose-400",
  }[tone];
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${styles}`}>
      {children}
    </span>
  );
};

/* ───────────────── Instance Modal ───────────────── */
const InstanceModal = React.memo(function InstanceModal({
  open,
  initial,
  onClose,
  onSave,
  onRemovePhoto,
}) {
  const [date, setDate] = useState("");
  const [received, setReceived] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setDate(initial?.ExpectedDate || "");
    setReceived("");
    setFile(null);
    setPreviewUrl(initial?.PhotoUrl || null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }, [open, initial]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open) return null;

  const expectedAmount = Number(initial?.Amount || 0);
  const receivedNum = parseMoney(received);
  const exceeds = expectedAmount > 0 && receivedNum > expectedAmount;
  const equals = expectedAmount > 0 && Math.abs(receivedNum - expectedAmount) < 1e-9;

  const doSave = async () => {
    if (busy) return;
    if (exceeds) {
      setError("Received amount cannot exceed the instance amount.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(
        {
          Id: initial.Id,
          ExpectedDate: date ? new Date(date).toISOString() : null,
          Amount: expectedAmount,
          IsReceived: equals,
          ReceivedAtUtc: equals ? new Date().toISOString() : null,
          __clientReceivedHint: !equals && receivedNum > 0 ? receivedNum : 0,
        },
        file
      );
      setBusy(false);
      onClose();
    } catch (e) {
      setBusy(false);
      setError(e?.message || "Could not save instance.");
    }
  };

  const removePhoto = async () => {
    if (!initial?.Id || busy) return;
    try {
      setBusy(true);
      await onRemovePhoto(initial.Id);
      setBusy(false);
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setBusy(false);
      setError(e?.message || "Could not remove photo.");
    }
  };

  const fileName = file?.name || "";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-3">Edit instance</h3>

        {!!error && (
          <div className="mb-3 text-sm rounded px-3 py-2 bg-red-600/10 text-red-400 ring-1 ring-red-700/30">
            {error}
          </div>
        )}

        <div className="grid gap-3">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            label={`Received amount (expected ${expectedAmount.toLocaleString(undefined, { style: "currency", currency: CURRENCY })})`}
            inputMode="decimal"
            value={received}
            onChange={(e) => setReceived(e.target.value)}
          />

          <div className="flex items-start gap-3">
            <button
              type="button"
              className="w-20 h-20 rounded-lg overflow-hidden ring-1 ring-white/10 bg-white/5 flex items-center justify-center shrink-0"
              onClick={() => previewUrl && window.open(previewUrl, "_blank")}
              title={previewUrl ? "Click to enlarge" : ""}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Instance" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] opacity-60 px-2 text-center">No photo</span>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <label className="block text-sm mb-1">Receipt photo (optional)</label>
                <span className={`ml-2 text-[11px] px-2 py-0.5 rounded ${previewUrl ? "bg-green-600/15 text-green-400" : "bg-red-600/15 text-red-400"}`}>
                  {previewUrl ? "Has photo" : "No photo"}
                </span>
              </div>

              {/* file picker like expenses: hidden input + trigger button + filename inline */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex items-center gap-2">
                <Button type="button" onClick={() => fileRef.current?.click()} className="!h-10 px-4">
                  Choose photo
                </Button>
                <div className="text-xs opacity-80 truncate max-w-[18rem]">
                  {fileName || "No file selected"}
                </div>
              </div>

              <p className="text-xs opacity-70 mt-2">Optional. Attaches to this instance.</p>

              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={removePhoto} disabled={busy || !previewUrl}>
                  Remove current
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* footer: Cancel left, Save right */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={doSave} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </div>
  );
});

/* ───────────────── Page ───────────────── */
export default function EditEarning() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext) || {};

  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  /* header image */
  const [earningFile, setEarningFile] = useState(null);
  const [earningPreview, setEarningPreview] = useState(null);
  const [earningUploading, setEarningUploading] = useState(false);
  const earningFileInputRef = useRef(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  /* modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState(null);

  /* load */
  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await apiCall.get(EP_GET(id), { validateStatus: () => true });
        if (!alive) return;
        if (!ok2xx(res) || !hasBody(res)) throw new Error("Failed to load earning.");
        const data = res.data || {};

        const instances = unwrap(data.Instances).map((x) => ({
          Id: x.Id,
          ExpectedDate: x.ExpectedDate,
          Amount: Number(x.Amount ?? 0),
          IsReceived: Boolean(x.IsReceived || x.ReceivedAtUtc),
          ReceivedAtUtc: x.ReceivedAtUtc ?? null,
          ImageUrl: x.ImageUrl ?? null,
          TempReceivedAmount: 0,
        }));

        setModel({
          Id: data.Id,
          Title: N(data.Title),
          Notes: N(data.Notes),
          Amount: Number(data.Amount ?? 0),
          Category: N(data.Category),
          WalletId: data.WalletId,
          FirstExpectedDate: dateOnly(data.FirstExpectedDate ?? data.Date),
          ImageUrl: data.ImageUrl ?? null,
          Instances: instances,
        });

        const imgRes = await apiCall.get(EP_GET_IMG(id), { validateStatus: () => true });
        if (ok2xx(imgRes) && hasBody(imgRes)) {
          const rel = imgRes?.data?.imagePath;
          setEarningPreview(rel && rel !== "NoPhoto" ? publicUrl(rel) : null);
        }
      } catch (e) {
        setErr(e?.message || "Could not load earning.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!earningFile) return;
    const url = URL.createObjectURL(earningFile);
    setEarningPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [earningFile]);

  /* KPIs */
  const total = Number(model?.Amount || 0);
  const alreadyReceived = useMemo(
    () => (model?.Instances || []).filter((i) => i.IsReceived || i.ReceivedAtUtc).reduce((s, i) => s + Number(i.Amount || 0), 0),
    [model]
  );
  const pending = Math.max(0, total - alreadyReceived);

  /* save header – only show error if any */
  const saveHeader = useCallback(async () => {
    if (!model) return;
    const fd = new FormData();
    fd.append("Title", model.Title || "Title");
    fd.append("Notes", model.Notes || "");
    fd.append("Category", model.Category || "");
    fd.append("WalletId", String(model.WalletId || ""));
    fd.append("Amount", String(model.Amount || 0));
    fd.append("Date", model.FirstExpectedDate || dateOnly(new Date()));
    fd.append("Currency", CURRENCY);
    const r = await apiCall.put(EP_UPDATE(model.Id), fd, { headers: { "Content-Type": "multipart/form-data" }, validateStatus: () => true });
    if (!ok2xx(r)) alert(r?.data?.message || "Could not save.");
  }, [model]);

  /* header photo */
  const onSelectEarningFile = (f) => setEarningFile(f || null);
  const uploadEarningImage = async () => {
    if (!earningFile || !model?.Id) return;
    try {
      setEarningUploading(true);
      const fd = new FormData();
      fd.append("Image", earningFile);
      const r = await apiCall.post(EP_UPLOAD_IMG(model.Id), fd, { validateStatus: () => true });
      setEarningUploading(false);
      if (!ok2xx(r)) return alert(r?.data?.message || "Upload failed");
      const rel = r?.data?.imagePath ?? r?.data;
      setEarningPreview(publicUrl(rel));
      setEarningFile(null);
      if (earningFileInputRef.current) earningFileInputRef.current.value = "";
    } catch (e) {
      setEarningUploading(false);
      alert(e?.message || "Could not upload photo.");
    }
  };
  const clearEarningPhotoSelection = () => {
    setEarningFile(null);
    if (earningFileInputRef.current) earningFileInputRef.current.value = "";
  };
  const removeEarningPhoto = async () => {
    try {
      setEarningUploading(true);
      const fd = new FormData();
      fd.append("Image", new File([makeTransparentPngBlob()], "blank.png", { type: "image/png" }));
      const r = await apiCall.post(EP_UPLOAD_IMG(model.Id), fd, { validateStatus: () => true });
      setEarningUploading(false);
      if (!ok2xx(r)) return alert(r?.data?.message || "Could not remove photo.");
      setEarningPreview(null);
    } catch (e) {
      setEarningUploading(false);
      alert(e?.message || "Could not remove photo.");
    }
  };

  /* instances */
  const refreshInstances = useCallback(async () => {
    const r = await apiCall.get(EP_LIST_INST(id), { validateStatus: () => true });
    if (ok2xx(r) && Array.isArray(r.data)) {
      setModel((m) => ({
        ...m,
        Instances: r.data.map((i) => ({
          Id: i.Id,
          ExpectedDate: i.ExpectedDate,
          Amount: Number(i.Amount ?? 0),
          IsReceived: Boolean(i.IsReceived || i.ReceivedAtUtc),
          ReceivedAtUtc: i.ReceivedAtUtc ?? null,
          ImageUrl: i.imagePath ?? null,
          TempReceivedAmount: 0,
        })),
      }));
    }
  }, [id]);

  const openInstModal = async (instId) => {
    const r = await apiCall.get(EP_GET_INSTANCE(instId), { validateStatus: () => true });
    if (!ok2xx(r) || !hasBody(r)) return alert("Could not load instance.");
    const inst = r.data;
    setModalInitial({
      Id: inst.Id,
      ExpectedDate: dateOnly(inst.ExpectedDate),
      Amount: Number(inst.Amount || 0),
      PhotoUrl: inst.imagePath ? publicUrl(inst.imagePath) : null,
    });
    setModalOpen(true);
  };

  const uploadInstanceImage = async (iid, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    return apiCall.post(EP_INST_IMG(iid), fd, { validateStatus: () => true });
  };

  const removeInstancePhoto = async (iid) => {
    const fd = new FormData();
    fd.append("image", new File([makeTransparentPngBlob()], "blank.png", { type: "image/png" }));
    const r = await apiCall.post(EP_INST_IMG(iid), fd, { validateStatus: () => true });
    if (!ok2xx(r)) throw new Error(r?.data?.message || "Could not remove photo.");
  };

  const saveInstance = async (payload, file) => {
    const r = await apiCall.post(EP_UPD_INST, payload, { validateStatus: () => true });
    if (!ok2xx(r)) return alert(r?.data?.message || "Could not save instance.");
    if (file) await uploadInstanceImage(payload.Id, file);
    await refreshInstances();
  };

  if (loading) return <div className="p-6 opacity-80">Loading…</div>;
  if (err) return <div className="p-6 text-red-500">{err}</div>;
  if (!model) return null;

  const instancesOrdered = (model?.Instances || [])
    .slice()
    .sort((a, b) => new Date(a.ExpectedDate) - new Date(b.ExpectedDate));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Title text="Edit earning" />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/Earnings")}>Back</Button>
          <Button onClick={saveHeader}>Save</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total" value={total.toLocaleString(undefined, { style: "currency", currency: CURRENCY })} />
        <StatCard title="Already received" value={alreadyReceived.toLocaleString(undefined, { style: "currency", currency: CURRENCY })} />
        <StatCard title="Remaining" value={pending.toLocaleString(undefined, { style: "currency", currency: CURRENCY })} />
      </div>

      {/* Header photo  */}
      <Card>
        <div className="flex items-start gap-4">
          <button
            type="button"
            className="w-28 h-28 rounded-lg overflow-hidden ring-1 ring-white/10 bg-white/5 flex items-center justify-center shrink-0"
            onClick={() => earningPreview && setLightboxUrl(earningPreview)}
            title={earningPreview ? "Click to enlarge" : ""}
          >
            {earningPreview ? (
              <img src={earningPreview} alt="Earning photo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs opacity-60 px-2 text-center">No photo</span>
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label className="block mb-1 text-sm font-medium">Earning photo (optional)</label>
              <span className={`ml-2 text-[11px] px-2 py-0.5 rounded ${earningPreview ? "bg-green-600/15 text-green-400" : "bg-red-600/15 text-red-400"}`}>
                {earningPreview ? "Has photo" : "No photo"}
              </span>
            </div>

            <input
              ref={earningFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => onSelectEarningFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs opacity-70 mt-1">This is stored on the earning (not on instances).</p>

            <div className="mt-2 flex flex-wrap gap-2">
              <Button onClick={uploadEarningImage} disabled={!earningFile || earningUploading}>
                {earningUploading ? "Uploading…" : "Upload"}
              </Button>
              <Button variant="secondary" onClick={clearEarningPhotoSelection} disabled={!earningFile}>
                Clear selection
              </Button>
              <Button variant="secondary" onClick={removeEarningPhoto} disabled={earningUploading || !earningPreview}>
                Remove current
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Instances table*/}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-[56rem] w-full text-center">
            <thead>
              <tr className="uppercase text-xs opacity-70">
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Amount</th>
                <th className="py-2 px-4">Paid</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Photo</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instancesOrdered.map((inst) => {
                const value = Number(inst?.Amount || 0);
                const paid = inst.IsReceived || inst.ReceivedAtUtc ? value : Number(inst?.TempReceivedAmount || 0);
                const isPaid = value > 0 && paid >= value;
                const hasPhoto = !!inst?.ImageUrl;
                const photoUrl = hasPhoto ? (inst.ImageUrl.startsWith("/") ? inst.ImageUrl : `/${inst.ImageUrl}`) : null;

                return (
                  <tr key={inst.Id} className="border-t border-white/10">
                    <td className="py-2 px-4">
                      {inst?.ExpectedDate ? new Date(inst.ExpectedDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-2 px-4">
                      {value.toLocaleString(undefined, { style: "currency", currency: CURRENCY })}
                    </td>
                    <td className="py-2 px-4">
                      {paid
                        ? paid.toLocaleString(undefined, { style: "currency", currency: CURRENCY })
                        : "—"}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs inline-block ${isPaid ? "bg-green-600/15 text-green-400" : "bg-red-600/15 text-red-400"}`}>
                        {isPaid ? "Paid" : "Not paid"}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs inline-block ${hasPhoto ? "bg-green-600/15 text-green-400" : "bg-red-600/15 text-red-400"}`}>
                        {hasPhoto ? "Has photo" : "No photo"}
                      </span>
                      {hasPhoto && photoUrl && (
                        <div className="mt-1">
                          <Button variant="secondary" onClick={() => setLightboxUrl(photoUrl)} className="!w-auto px-3 !h-8 text-xs">
                            View
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <Button variant="secondary" onClick={() => openInstModal(inst.Id)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {!instancesOrdered.length && (
                <tr>
                  <td className="py-6 px-4 opacity-60" colSpan={6}>
                    No instances.
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
          <img src={lightboxUrl} alt="Preview" className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Instance modal */}
      <InstanceModal
        open={modalOpen && !!modalInitial}
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSave={saveInstance}
        onRemovePhoto={removeInstancePhoto}
      />
    </div>
  );
}

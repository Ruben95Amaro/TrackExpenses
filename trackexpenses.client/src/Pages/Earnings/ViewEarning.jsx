import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Button from "../../components/Buttons/Button";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import { useLanguage } from "../../utils/Translate/LanguageContext";

const unwrap = (v) => (Array.isArray(v) ? v : v?.$values ?? (v ?? []));
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
  try { return new URL(rel, getBackendBase()).toString(); }
  catch { return `/${rel}`; }
};

const EP_GET    = (id) => `Earnings/GetById/${id}`;
const EP_IMG    = (id) => `Earnings/GetEarningImage/${id}`;
const EP_LIST_I = (id) => `Earnings/InstancesByEarning/${id}`;

export default function ViewEarning() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage ? useLanguage() : { t: () => undefined };

  const [earning, setEarning] = useState(null);
  const [instances, setInstances] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        setLoading(true);

        const r = await apiCall.get(EP_GET(id), { validateStatus: () => true });
        if (!ok2xx(r) || !hasBody(r)) throw new Error(t?.("errors.notFound") || "Not found");
        setEarning(r.data);

        const img = await apiCall.get(EP_IMG(id), { validateStatus: () => true });
        if (ok2xx(img) && hasBody(img)) {
          const rel = img?.data?.imagePath;
          setPhotoUrl(rel && rel !== "NoPhoto" ? getPublicUrl(rel) : null);
        }

        const insts = await apiCall.get(EP_LIST_I(id), { validateStatus: () => true });
        const list = ok2xx(insts) ? (Array.isArray(insts.data) ? insts.data : unwrap(insts.data)) : [];
        setInstances(list || []);
      } catch (e) {
        if (alive) setErr(e?.message || (t?.("errors.generic") || "Error"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, t]);

  const total = Number(earning?.Amount || 0);
  const received = useMemo(
    () => (instances || []).reduce((acc, i) => acc + Number(i?.ReceivedAmount || 0), 0),
    [instances]
  );
  const remaining = Math.max(0, total - received);

  if (loading) return <div className="p-6">{t?.("common.loading") || "Loading…"}</div>;
  if (err || !earning) return <div className="p-6 text-red-600">{err || (t?.("errors.notFound") || "Not found")}</div>;

  const lbl = (k, fallback) => <div className="text-sm opacity-70">{t?.(k) || fallback}</div>;

  return (
    <div className="space-y-6 max-w-[74rem] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Title text={t?.("earnings.details") || "Earning details"} />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/Earnings")}>{t?.("common.back") || "Back"}</Button>
          <Button onClick={() => navigate(`/Earnings/Edit/${id}`)}>{t?.("common.edit") || "Edit"}</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          {lbl("earnings.table.total", "Total")}
          <div className="text-xl font-semibold text-emerald-500">
            {total.toLocaleString(undefined,{style:"currency",currency:"EUR"})}
          </div>
        </Card>
        <Card>
          {lbl("earnings.kpi.received", "Already received")}
          <div className="text-xl font-semibold text-emerald-500">
            {received.toLocaleString(undefined,{style:"currency",currency:"EUR"})}
          </div>
        </Card>
        <Card>
          {lbl("earnings.kpi.pending", "Remaining")}
          <div className="text-xl font-semibold">
            {remaining.toLocaleString(undefined,{style:"currency",currency:"EUR"})}
          </div>
        </Card>
      </div>

      {/* Top info */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {lbl("wallets.one", "Wallet")}
            <div className="font-medium">{earning.WalletId || "-"}</div>
          </div>
          <div>
            {lbl("common.date", "Date")}
            <div className="font-medium">
              {earning.Date ? new Date(earning.Date).toLocaleDateString() : "-"}
            </div>
          </div>
          <div>
            {lbl("earnings.table.category", "Category")}
            <div className="font-medium">{earning.Category || "-"}</div>
          </div>
          <div>
            {lbl("earnings.form.title", "Title")}
            <div className="font-medium">{earning.Title || "-"}</div>
          </div>
          <div className="md:col-span-2">
            {lbl("earnings.form.notes", "Notes")}
            <div className="font-medium whitespace-pre-wrap">{earning.Notes || "-"}</div>
          </div>
        </div>
      </Card>

      {/* Photo */}
      <Card>
        <div className="flex items-start gap-4">
          <button
            type="button"
            className="w-28 h-28 rounded-lg overflow-hidden ring-1 ring-black/10 bg-black/5 flex items-center justify-center shrink-0"
            onClick={() => photoUrl && setLightboxUrl(photoUrl)}
            title={photoUrl ? (t?.("earnings.photo.view") || "View") : ""}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={t?.("earnings.photo.view") || "View"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs opacity-60 px-2 text-center">{t?.("earnings.photo.no_photo") || "No photo"}</span>
            )}
          </button>

          <div className="text-sm opacity-70">
            {t?.("earnings.photo.title") || "Earning photo"}
          </div>
        </div>
      </Card>

      {/* Instances */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-[56rem] w-full text-center">
            <thead>
              <tr className="uppercase text-xs opacity-70">
                <th className="py-2 px-4">{t?.("common.date") || "Date"}</th>
                <th className="py-2 px-4">{t?.("common.amount") || "Amount"}</th>
                <th className="py-2 px-4">{t?.("earnings.instance.receivedAmount") || "Received amount"}</th>
                <th className="py-2 px-4">{t?.("earnings.status.title") || "Status"}</th>
                <th className="py-2 px-4">{t?.("common.photo") || "Photo"}</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => {
                const rec = Number(inst?.ReceivedAmount || 0);
                const val = Number(inst?.Amount || 0);
                const isRec = val > 0 && rec >= val;
                const rel = inst?.imagePath || inst?.ImageRelativePath || null;
                const url = rel ? getPublicUrl(rel) : null;
                const hasPhoto = !!url;

                return (
                  <tr key={inst.Id} className="border-top border-white/10">
                    <td className="py-2 px-4">{inst?.ExpectedDate ? new Date(inst.ExpectedDate).toLocaleDateString() : "-"}</td>
                    <td className="py-2 px-4">
                      <span className="font-semibold text-emerald-500">
                        {val.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {rec.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs inline-block ${
                          isRec ? "bg-green-600/15 text-green-400" : "bg-yellow-600/15 text-yellow-400"
                        }`}
                      >
                        {isRec ? (t?.("earnings.status.received") || "Received") : (t?.("earnings.status.not_received") || "Pending")}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {hasPhoto ? (
                        <Button variant="secondary" onClick={() => setLightboxUrl(url)} className="!w-auto px-3 !h-8 text-xs">
                          {t?.("earnings.photo.view") || "View"}
                        </Button>
                      ) : (
                        <span className="text-xs opacity-60">{t?.("earnings.photo.no_photo") || "No photo"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!instances.length && (
                <tr>
                  <td className="py-6 px-4 opacity-60" colSpan={5}>
                    {t?.("earnings.instances.empty") || "No instances."}
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
          <img
            src={lightboxUrl}
            alt={t?.("earnings.photo.view") || "View"}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

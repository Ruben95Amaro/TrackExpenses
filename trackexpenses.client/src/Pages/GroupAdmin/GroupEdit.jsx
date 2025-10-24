import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import Button from "../../components/Buttons/Button";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utils/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";
import { Save } from "lucide-react";

/* ===== Utils  ===== */
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
const norm = (s) => String(s || "").trim().toLowerCase();
const unwrap = (v) => (Array.isArray(v) ? v : v?.$values ?? v ?? []);

const alpha = (hexOrRgb, a = 0.2) => {
  if (!hexOrRgb) return `rgba(0,0,0,${a})`;
  if (hexOrRgb.startsWith("#")) {
    const h = hexOrRgb.slice(1);
    const f = h.length === 3 ? h.split("").map(x => x + x).join("") : h;
    const r = parseInt(f.slice(0,2),16), g = parseInt(f.slice(2,4),16), b = parseInt(f.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }
  const nums = hexOrRgb.replace(/[^\d.,]/g, "").split(",").map(Number);
  return `rgba(${nums[0]||0},${nums[1]||0},${nums[2]||0},${a})`;
};
const parseToRGB = (c) => {
  if (!c || typeof c !== "string") return { r: 11, g: 18, b: 32 };
  if (c.startsWith("#")) {
    const h = c.slice(1);
    const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    return { r: parseInt(f.slice(0,2),16), g: parseInt(f.slice(2,4),16), b: parseInt(f.slice(4,6),16) };
  }
  if (c.startsWith("rgb")) {
    const n = c.replace(/[^\d.,]/g, "").split(",").map(Number);
    return { r: n[0] ?? 11, g: n[1] ?? 18, b: n[2] ?? 32 };
  }
  return { r: 11, g: 18, b: 32 };
};
const isDarkColor = (color) => {
  const { r, g, b } = parseToRGB(color || "#0b1220");
  const luma = 0.2126*r + 0.7152*g + 0.0722*b;
  return luma < 128;
};

export default function GroupsEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth } = useContext(AuthContext) || {};

  /* ===== Cores do tema  ===== */
  const c = theme?.colors || {};
  const paper = c.background?.paper || "#111827";
  const DARK = isDarkColor(paper);
  const FG = DARK ? "#ffffff" : "#000000"; 
  const borderSoft = c.menu?.border || (DARK ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)");
  const text = c.text?.primary || (DARK ? "#E5E7EB" : "#0F172A");
  const muted = c.text?.secondary || (DARK ? "#94A3B8" : "#334155");
  const errorCol = c.error?.main || (DARK ? "#F87171" : "#B91C1C");
  const hover = c.menu?.hoverBg || alpha(borderSoft, 0.25);

  const tr = (k, fb) => { try { const v = t?.(k); return v && v !== k ? v : (fb ?? k); } catch { return fb ?? k; } };

  /* ===== Estado ===== */
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState([]);
  const [admin, setAdmin] = useState(null);

  // roles/permissões
  const roles = useMemo(() => {
    const r = (auth?.Roles ?? auth?.Role ?? auth?.roles ?? auth?.role) ?? [];
    return (Array.isArray(r) ? r : [r]).map((x) => String(x || "").toUpperCase());
  }, [auth]);
  const meId = String(auth?.Id || "");
  const meEmail = norm(auth?.Email || "");
  const isGroupAdminRole = roles.includes("GROUPADMINISTRATOR");
  const amGroupAdmin = useMemo(() => {
    if (!isGroupAdminRole || !admin) return false;
    const adminId = String(admin?.id ?? admin?.Id ?? "");
    const adminEmail = norm(admin?.email ?? admin?.Email ?? "");
    return (meId && adminId === meId) || (meEmail && adminEmail === meEmail);
  }, [isGroupAdminRole, admin, meId, meEmail]);

  const toMemberObj = (u, fallbackEmail) => ({
    id: String(u?.id ?? u?.Id ?? ""),
    email: String(u?.email ?? u?.Email ?? fallbackEmail ?? ""),
    name: String(
      u?.fullName ?? u?.FullName ??
      ([(u?.firstName ?? u?.FirstName), (u?.lastName ?? u?.FamilyName)].filter(Boolean).join(" ")).trim()
    ),
  });

  /* ===== Load ===== */
  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await apiCall.get("/Group/Get", { params: { id } });
      if (!(res?.ok) || !res?.data) {
        setErr(tr("groups.not_found", "Group not found."));
        return;
      }
      const g = res.data;
      const gName = g?.name ?? g?.Name ?? "";
      const gAdmin = g?.admin ?? g?.Admin ?? null;
      const gMembers = g?.members?.$values ?? g?.Members?.$values ?? g?.members ?? g?.Members ?? [];

      setName(gName);
      setAdmin(gAdmin ? toMemberObj(gAdmin) : null);

      const adminId = String(gAdmin?.id ?? gAdmin?.Id ?? "");
      const normalized = (gMembers || []).map(toMemberObj);
      const filtered = normalized.filter(m => m.id && m.id !== adminId);
      setMembers(filtered);
    } catch {
      setErr(tr("groups.load_failed", "Could not load the group."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (id) load(); }, [id]);

  /* ===== Ações ===== */
  const addByEmail = async () => {
    setErr("");
    const email = memberInput.trim();
    if (!email || !isEmail(email)) return;

    const exists = (arr) => arr.some(m => norm(m.email) === norm(email));
    if (exists(members) || (admin && norm(admin.email) === norm(email))) {
      setMemberInput("");
      return;
    }
    try {
      setBusy(true);
      const res = await apiCall.get("/User/GetProfile", { params: { UserEmail: email } });
      if (res?.ok && res?.data) {
        const u = res.data;
        const obj = toMemberObj({
          id: u?.Id ?? u?.id ?? u?.userId ?? u?.guid ?? u?._id,
          email: u?.Email ?? u?.email ?? email,
          fullName: (u?.FirstName || u?.firstName || "") + " " + (u?.FamilyName || u?.lastName || "")
        }, email);

        if (!obj.id) {
          setErr(tr("groups.errors_lookup_bad_response", "User lookup returned an unexpected response."));
        } else {
          setMembers(prev => [...prev, obj]);
          setMemberInput("");
        }
      } else if (res?.error?.status === 404 || res?.error?.status === 400) {
        setErr(tr("groups.errors_user_not_found", "User does not exist"));
      } else {
        setErr(res?.error?.message || tr("groups.errors_lookup_failed", "Could not verify the user."));
      }
    } catch {
      setErr(tr("groups.errors_lookup_failed", "Could not verify the user."));
    } finally {
      setBusy(false);
    }
  };
  const removeMember = (mid) => setMembers(prev => prev.filter(m => m.id !== mid));

  const handleSave = async () => {
    setErr("");
    if (!amGroupAdmin) {
      window.alert(tr("groups.perm_denied", "You do not have permission to edit this group."));
      return;
    }
    if (!name.trim()) {
      setErr(tr("groups.errors_name_required", "Name is required"));
      return;
    }

    const usersId = [
      ...(admin?.id ? [admin.id] : []),
      ...members.map(m => m.id)
    ];

    setBusy(true);
    try {
      const res = await apiCall.post("/Group/Update", null, {
        params: { id, name: name.trim(), usersId },
        paramsSerializer: (params) => {
          const usp = new URLSearchParams();
          usp.set("id", params.id);
          usp.set("name", params.name);
          (params.usersId || []).forEach((v) => usp.append("usersId", v));
          return usp.toString();
        }
      });

      if (res?.ok) {
        window.alert(tr("groups.saved", "Group saved."));
        navigate(-1);
      } else {
        setErr(res?.error?.message || tr("groups.save_failed", "Could not save the group."));
      }
    } catch {
      setErr(tr("groups.save_failed", "Could not save the group."));
    } finally {
      setBusy(false);
    }
  };

  /* ===== UI ===== */
  if (loading) {
    return (
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Title text={tr("groups.edit_title", "Edit group")} />
        </div>
        <div
          className="rounded-2xl p-10 animate-pulse"
          style={{ backgroundColor: paper, border: `2px solid ${FG}`, minHeight: 220 }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Title text={tr("groups.edit_title", "Edit group")} />
      </div>

      {err && (
        <div
          className="mb-4 rounded-lg p-3 text-sm"
          style={{
            backgroundColor: alpha(errorCol, 0.12),
            color: errorCol,
            border: `1px solid ${alpha(errorCol, 0.45)}`
          }}
        >
          {err}
        </div>
      )}

      {!amGroupAdmin && (
        <div
          className="mb-4 text-sm rounded-lg p-3"
          style={{ backgroundColor: hover, color: text, border: `1px solid ${borderSoft}` }}
        >
          {tr("groups.readonly", "You are not the admin of this group or you don't have the GROUPADMINISTRATOR role. The form is read-only.")}
        </div>
      )}

      <Card
        className="rounded-2xl p-6"
        style={{
          backgroundColor: paper,
          border: `2px solid ${FG}`, 
        }}
      >
        <div className="space-y-6">
          <Input
            label={tr("common.name", "Name")}
            placeholder={tr("groups.enter_name", "e.g., Family")}
            value={name}
            disabled={!amGroupAdmin}
            onChange={(e) => setName(e.target.value)}
          />

          {admin && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: text }}>
                {tr("groups.admin", "Admin")}
              </label>
              <div className="text-sm" style={{ color: muted }}>
                {(admin.name || admin.email) ? `${admin.name || ""}${admin.email ? ` — ${admin.email}` : ""}` : "—"}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: text }}>
              {tr("groups.members", "Members (emails)")}
            </label>

            <div className="flex gap-2 items-center">
              <input
                type="email"
                className="flex-1 min-w-0 px-3 py-2 rounded-md border outline-none"
                placeholder={tr("groups.enter_email", "user@mail.com")}
                value={memberInput}
                disabled={!amGroupAdmin}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (amGroupAdmin) addByEmail();
                  }
                }}
                style={{ backgroundColor: paper, color: text, borderColor: borderSoft }}
              />

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={addByEmail}
                disabled={!amGroupAdmin || !memberInput || !isEmail(memberInput) || busy}
                className="flex-none"
              >
                {busy ? tr("common.checking", "Checking…") : tr("common.add", "Add")}
              </Button>
            </div>

            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {members.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm"
                    style={{ backgroundColor: hover, color: text, border: `1px solid ${borderSoft}` }}
                    title={m.name || m.email}
                  >
                    {m.name ? `${m.name} — ${m.email}` : m.email}
                    <button
                      type="button"
                      onClick={() => amGroupAdmin && removeMember(m.id)}
                      className="rounded px-1"
                      title={amGroupAdmin ? tr("common.remove", "Remove") : ""}
                      style={{ color: muted, cursor: amGroupAdmin ? "pointer" : "not-allowed" }}
                      disabled={!amGroupAdmin}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              {tr("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"  
              onClick={handleSave}
              disabled={!amGroupAdmin || busy}
            >
              <span className="inline-flex items-center gap-2">
                <Save className="h-5 w-5" />
                {busy ? tr("common.saving", "Saving…") : tr("common.save", "Save")}
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import Button from "../../components/Buttons/Button";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
const norm = (s) => String(s || "").trim().toLowerCase();

export default function GroupsEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth } = useContext(AuthContext) || {};

  const c = theme?.colors || {};
  const paper = c.background?.paper || "#111827";
  const border = c.menu?.border || "rgba(255,255,255,0.12)";
  const text = c.text?.primary || "#E5E7EB";
  const muted = c.text?.secondary || "#94A3B8";
  const errorCol = c.error?.main || "#EF4444";
  const hover = c.menu?.hoverBg || "rgba(255,255,255,0.06)";

  const tr = (k, fb) => { try { return k?.includes(".") ? t(k) : (k ?? fb); } catch { return fb ?? k; } };

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
    )
  });

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
    } catch (e) {
      setErr(tr("groups.load_failed", "Could not load the group."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (id) load(); }, [id]);

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
      const res = await apiCall.get("/User/GetProfile", {
        params: { UserEmail: email }
      });

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
      // Envio por QUERY (sem body)
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
    } catch (e) {
      setErr(tr("groups.save_failed", "Could not save the group."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Title text={tr("groups.edit_title", "Edit group")} />
        </div>
        <div className="rounded-2xl p-10 animate-pulse" style={{ backgroundColor: paper, border: `1px solid ${border}`, minHeight: 220 }} />
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Title text={tr("groups.edit_title", "Edit group")} />
      </div>

      {err && (
        <div className="mb-4 rounded-lg p-3 text-sm"
             style={{ backgroundColor: `${errorCol}1a`, color: errorCol, border: `1px solid ${errorCol}55` }}>
          {err}
        </div>
      )}

      {!amGroupAdmin && (
        <div className="mb-4 text-sm rounded-lg p-3"
             style={{ backgroundColor: hover, color: text, border: `1px solid ${border}` }}>
          {tr("groups.readonly", "You are not the admin of this group or you don't have the GROUPADMINISTRATOR role. The form is read-only.")}
        </div>
      )}

      <Card className="rounded-2xl p-6" style={{ backgroundColor: paper, border: `1px solid ${border}` }}>
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
                style={{ backgroundColor: paper, color: text, borderColor: border }}
              />

              <Button
                type="button"
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
                    style={{ backgroundColor: hover, color: text, border: `1px solid ${border}` }}
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
            <Button type="button" variant="success" onClick={handleSave} disabled={!amGroupAdmin || busy}>
              {busy ? tr("common.saving", "Saving…") : tr("common.save", "Save")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../../styles/Theme/Theme";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import {
  Save,
  X,
  User,
  Mail,
  Calendar as CalendarIcon,
  Phone,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";
import { useLanguage } from "../../utils/Translate/LanguageContext";
import AuthContext from "../../services/Authentication/AuthContext";
import Button from "../../components/Buttons/Button";

/* utils */
const normPath = (p) => (p || "").toString().replace(/\\/g, "/").replace(/^\/+/, "");
const stripTrailing = (s) => (s || "").replace(/\/+$/g, "");
const buildFileUrl = (filesBase, partialOrAbsolute) => {
  if (!partialOrAbsolute) return null;
  const p = String(partialOrAbsolute);
  if (/^https?:\/\//i.test(p)) return `${p}${p.includes("?") ? "" : `?t=${Date.now()}`}`;
  const root = stripTrailing(filesBase || "");
  return `${root}/${normPath(p)}?t=${Date.now()}`;
};
function parseToRGB(c) {
  if (!c || typeof c !== "string") return { r: 11, g: 18, b: 32 };
  if (c.startsWith("#")) {
    const h = c.slice(1);
    const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  if (c.startsWith("rgb")) {
    const nums = c.replace(/[^\d.,]/g, "").split(",").map(Number);
    return { r: nums[0] ?? 11, g: nums[1] ?? 18, b: nums[2] ?? 32 };
  }
  return { r: 11, g: 18, b: 32 };
}
function isDarkColor(color) {
  const { r, g, b } = parseToRGB(color || "#0b1220");
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128;
}

export default function EditUserProfile() {
  const { id, email: emailFromRoute } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth, setAuth, roles } = useContext(AuthContext) || {};

  /* apanhar email de TODAS as formas possíveis */
  const authEmail = useMemo(() => {
    try {
      const ls = JSON.parse(localStorage.getItem("auth") || "{}");
      return (
        (auth?.Email ||
          auth?.email ||
          auth?.user?.Email ||
          auth?.user?.email ||
          ls?.user?.Email ||
          ls?.Email ||
          (emailFromRoute ? decodeURIComponent(emailFromRoute) : "")) || ""
      ).trim();
    } catch {
      return (
        (auth?.Email ||
          auth?.email ||
          auth?.user?.Email ||
          auth?.user?.email ||
          (emailFromRoute ? decodeURIComponent(emailFromRoute) : "")) || ""
      ).trim();
    }
  }, [auth, emailFromRoute]);

  /* cores/bordas */
  const DARK = isDarkColor(theme?.colors?.background?.paper);
  const FG = DARK ? "#ffffff" : "#000000";
  const BORDER_W = 2;
  const DIVIDER =
    theme?.colors?.secondary?.light ||
    (DARK ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.25)");
  const DIVIDER_W = 1;

  /* estado */
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [pageError, setPageError] = useState(null); // só mostra se tiver valor
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  /* imagem */
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);

  const FILES_BASE = import.meta.env.VITE_FILES_BASE_URL || "https://localhost:5001";

  const currentImageUrl = useMemo(() => {
    if (imagePreview) return imagePreview;
    if (user?.profileImage) return buildFileUrl(FILES_BASE, user.profileImage);
    if (auth?.path) return auth.path;
    return null;
  }, [imagePreview, user?.profileImage, auth?.path]);

  const displayName =
    `${(user?.firstName || "").trim()} ${(user?.familyName || "").trim()}`.trim() ||
    user?.email ||
    t("common.user");

  const initials = useMemo(() => {
    const fn = (formData.firstName ?? user?.firstName ?? "").trim();
    const ln = (formData.familyName ?? user?.familyName ?? "").trim();
    const pair = `${fn.charAt(0)}${ln.charAt(0)}`.trim();
    return (pair || (user?.email?.[0] ?? "?")).toUpperCase();
  }, [formData.firstName, formData.familyName, user]);

  const isPremium = Array.isArray(roles) && roles.some((r) => String(r).toUpperCase() === "PREMIUM");

  const safeGet = async (url, cfg = {}) => {
    try {
      return await apiCall.get(url, { validateStatus: () => true, ...cfg });
    } catch {
      return { status: 0, data: null };
    }
  };

  /* carregar perfil (NÃO exige id) */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setPageError(null);
      try {
        // Se não tivermos email, não mostramos erro — apenas paramos.
        if (!authEmail) {
          if (alive) {
            setLoading(false);
            setLoadFailed(false);
          }
          return;
        }

        const base = await apiCall.get("/User/GetProfile", {
          params: { UserEmail: authEmail },
          validateStatus: (s) => s >= 200 && s < 300,
        });

        const data = base?.data || {};
        const mappedUser = {
          id: data.Id ?? data.id,
          email: data.Email ?? data.email,
          firstName: data.FirstName ?? data.firstName,
          familyName: data.FamilyName ?? data.familyName,
          birthday: data.Birthday ?? data.birthday,
          phoneNumber: data.PhoneNumber ?? data.phoneNumber,
          groupName: data.GroupName || "",
          groupRole: data.GroupRole ?? data.Role ?? "Member",
          groupId: data.GroupId || "",
          profileImage: "",
          groupMembers: data.GroupMembers || [],
        };

        // foto/nome (se houver email)
        const np =
          authEmail &&
          (await safeGet(`/User/GetPhotoProfileAndName/${encodeURIComponent(authEmail)}`));
        if (np && np.status >= 200 && np.status < 300) {
          const fn = np?.data?.FirstName ?? np?.data?.firstName ?? "";
          const ln = np?.data?.FamilyName ?? np?.data?.familyName ?? "";
          const rawPath =
            np?.data?.PhotoPath ??
            np?.data?.photoPath ??
            np?.data?.path ??
            np?.data?.PhotoUrl ??
            np?.data?.photoUrl ??
            np?.data?.url ??
            "";

          if (fn) mappedUser.firstName = mappedUser.firstName || fn;
          if (ln) mappedUser.familyName = mappedUser.familyName || ln;

          const rel = normPath(rawPath);
          if (rel && rel.toLowerCase() !== "nophoto") {
            mappedUser.profileImage = rel;
            const absolute = buildFileUrl(FILES_BASE, rel);
            setAuth?.((prev) => ({ ...prev, path: absolute || prev?.path }));
            window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { url: absolute } }));
          }
        }

        if (!alive) return;
        setUser(mappedUser);
        setFormData({ ...mappedUser, birthday: mappedUser.birthday || "" });
        setLoadFailed(false);
      } catch {
        if (!alive) return;
        setLoadFailed(true);
        setPageError(t("errors.couldnt_load_profile")); // só aqui aparece erro
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [authEmail, setAuth, t]);

  /* imagem */
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setImageError(t("profile.image_invalid_format"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError(t("profile.image_too_large"));
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!selectedImage || !id) return null; // upload só se houver id
    try {
      const fd = new FormData();
      fd.append("photo", selectedImage);
      const r = await apiCall.post(`/User/UploadProfileImage/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        validateStatus: () => true,
      });
      const partialPath = normPath(r?.data?.partialPath || r?.data?.PartialPath || "");
      if (partialPath) return partialPath;
      setImageError(t("profile.image_upload_error"));
      return null;
    } catch {
      setImageError(t("profile.image_upload_error"));
      return null;
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return; // sem erro visual “logo”

    setPageError(null);

    let finalImagePath = formData.profileImage || user?.profileImage || "";
    if (selectedImage) {
      const uploaded = await uploadImage();
      if (!uploaded) return; // não mostramos erro extra aqui
      finalImagePath = uploaded;
    }

    const payload = {
      ...formData,
      birthday: formData.birthday || undefined,
      profileImage: finalImagePath,
    };

    try {
      await apiCall.put("/User/EditUser", payload, {
        validateStatus: (s) => s >= 200 && s < 300,
      });

      setUser((prev) => (prev ? { ...prev, ...payload } : payload));
      setFormData((prev) => ({ ...prev, ...payload }));
      setSelectedImage(null);
      setImagePreview(null);

      if (finalImagePath) {
        const absolute = buildFileUrl(FILES_BASE, finalImagePath);
        setAuth?.((prev) => ({ ...prev, path: absolute || prev?.path }));
        window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { url: absolute } }));
      }

      navigate("/users");
    } catch {
      setPageError(t("errors.couldnt_save_changes"));
    }
  };

  const handleCancel = () => navigate("/users");

  const showErrorBanner = Boolean(pageError);

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div className="ml-auto flex space-x-3">
          <Button variant="secondary" size="md" onClick={handleCancel} className="shrink-0">
            <span className="inline-flex items-center gap-2">
              <X className="h-5 w-5" />
              {t("common.cancel")}
            </span>
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} className="shrink-0">
            <span className="inline-flex items-center gap-2">
              <Save className="h-5 w-5" />
              {t("common.save_Changes")}
            </span>
          </Button>
        </div>
      </div>

      {showErrorBanner && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{pageError}</p>
        </div>
      )}

      {/* Card */}
      <div
        className="rounded-2xl shadow-md overflow-hidden"
        style={{
          backgroundColor: theme.colors.background.paper,
          opacity: loadFailed ? 0.6 : 1,
          border: `${BORDER_W}px solid ${FG}`,
        }}
      >
        {/* Profile Header */}
        <div className="px-6 py-8 border-b" style={{ borderColor: DIVIDER, borderBottomWidth: DIVIDER_W }}>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div
                className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden ${
                  loading ? "pointer-events-none opacity-70" : "cursor-pointer"
                }`}
                style={{ backgroundColor: theme.colors.primary.main }}
                onClick={!loading ? () => fileInputRef.current?.click() : undefined}
                title={t("common.click_to_change_photo")}
                aria-label={t("common.click_to_change_photo")}
              >
                {currentImageUrl ? (
                  <img src={currentImageUrl} alt={t("common.photo_alt")} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
                {!loading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>

              {(currentImageUrl || imagePreview) && !loading && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setUser((prev) => (prev ? { ...prev, profileImage: "" } : prev));
                    setFormData((prev) => ({ ...prev, profileImage: "" }));
                  }}
                  className="absolute -top-2 -right-2 !p-1 !w-7 !h-7 grid place-items-center rounded-full"
                  title={t("common.remove_photo")}
                  aria-label={t("common.remove_photo")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleImageSelect}
                className="hidden"
                disabled={loading}
              />
              {imageError && !loading && <p className="text-xs mt-2 text-red-600">{imageError}</p>}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>
                {displayName}
              </h2>
              <p className="text-lg" style={{ color: theme.colors.text.secondary }}>
                {user?.email || t("common.not_provided")}
              </p>

              <div className="mt-2">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: theme.colors.primary.light + "30",
                    color: DARK ? "#FFD700" : (isPremium ? "gold" : theme.colors.primary.main),
                  }}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  {isPremium ? "PREMIUM" : "MEMBER"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="px-6 py-8">
          <h3 className="text-lg font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
            {t("profile.personal_information")}
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* First Name */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary.light + "20" }}>
                <User className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t("common.firstName")}
                </h4>
                <input
                  type="text"
                  value={formData.firstName || ""}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    borderColor: theme.colors.secondary.light,
                    color: theme.colors.text.primary,
                  }}
                  placeholder={t("profile.enter_first_name")}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Family Name */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary.light + "20" }}>
                <User className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t("common.familyName")}
                </h4>
                <input
                  type="text"
                  value={formData.familyName || ""}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    borderColor: theme.colors.secondary.light,
                    color: theme.colors.text.primary,
                  }}
                  placeholder={t("profile.enter_family_name")}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary.light + "20" }}>
                <Mail className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t("profile.email")}
                </h4>
                <p className="text-base" style={{ color: theme.colors.text.primary }}>
                  {user?.email || t("common.not_provided")}
                </p>
              </div>
            </div>

            {/* Birthday */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.secondary.light + "20" }}>
                <CalendarIcon className="h-5 w-5" style={{ color: theme.colors.secondary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t("common.birthday")}
                </h4>
                <input
                  type="date"
                  value={formData.birthday ? new Date(formData.birthday).toISOString().split("T")[0] : ""}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    borderColor: theme.colors.secondary.light,
                    color: theme.colors.text.primary,
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.success.light + "20" }}>
                <Phone className="h-5 w-5" style={{ color: theme.colors.success.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t("common.phone_number")}
                </h4>
                <input
                  type="tel"
                  value={formData.phoneNumber || ""}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    borderColor: theme.colors.secondary.light,
                    color: theme.colors.text.primary,
                  }}
                  placeholder={t("profile.enter_phone_number")}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.error.light + "20" }}>
                <Lock className="h-5 w-5" style={{ color: theme.colors.error.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t("common.new_Password")}
                </h4>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password || ""}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{
                      backgroundColor: theme.colors.background.paper,
                      borderColor: theme.colors.secondary.light,
                      color: theme.colors.text.primary,
                    }}
                    placeholder={t("profile.password_leave_empty")}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                    style={{ color: theme.colors.text.secondary, cursor: "pointer" }}
                    title={showPassword ? t("profile.hide_password") : t("profile.show_password")}
                    aria-label={showPassword ? t("profile.hide_password") : t("profile.show_password")}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* (outros blocos aqui, se necessário) */}
        </div>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
          {t("common.loading")}
        </p>
      )}
    </div>
  );
}

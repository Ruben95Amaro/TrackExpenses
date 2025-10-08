import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import AuthContext from "../../services/Authentication/AuthContext";
import { useTheme } from "../../styles/Theme/Theme";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import { Shield, Camera, Save, X, Pencil } from "lucide-react";

import ProfileAvatar from "../../components/Profile/ProfileAvatar";
import ProfileInfoSection from "../../components/Profile/ProfileInfoSection";
import ProfileGroupSection from "../../components/Profile/ProfileGroupSection";
import Title from "../../components/Titles/TitlePage";
import Button from "../../components/Buttons/Button";

/* helpers */
const normPath = (p) => (p || "").toString().replace(/\\/g, "/").replace(/^\/+/, "");
const stripTrailing = (s) => (s || "").replace(/\/+$/g, "");
const buildFileUrl = (filesBase, partialOrAbsolute) => {
  if (!partialOrAbsolute) return null;
  const p = String(partialOrAbsolute);
  if (/^https?:\/\//i.test(p)) return p; // sem timestamp aqui; o TopBar faz cache-busting
  const root = stripTrailing(filesBase || "");
  return `${root}/${normPath(p)}`;
};

function ProfilePage() {
  const { auth, setAuth, roles } = useContext(AuthContext);
  const { theme } = useTheme();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorSubmit, setErrorSubmit] = useState(null);

  // edição / imagem
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  const FILES_BASE =
    import.meta.env.VITE_FILES_BASE_URL || "https://localhost:5001";

  const currentImageUrl = useMemo(() => {
    if (imagePreview) return imagePreview;
    if (user?.profileImage) return buildFileUrl(FILES_BASE, user.profileImage);
    if (auth?.path || auth?.Path) return auth.path || auth.Path;
    return null;
  }, [imagePreview, user?.profileImage, auth?.path, auth?.Path, FILES_BASE]);

  const displayName = useMemo(() => {
    const fn = (user?.firstName || "").trim();
    const ln = (user?.familyName || "").trim();
    return `${fn} ${ln}`.trim() || user?.email || "User";
  }, [user]);

  const initials = useMemo(() => {
    const fn = (user?.firstName || "").trim();
    const ln = (user?.familyName || "").trim();
    const pair = `${fn.charAt(0)}${ln.charAt(0)}`.trim();
    return (pair || (user?.email?.[0] ?? "?")).toUpperCase();
  }, [user]);

  const isPremium =
    Array.isArray(roles) &&
    roles.some((r) => String(r).toUpperCase() === "PREMIUM");

  useEffect(() => {
    let cancelled = false;

    async function fetchData(userEmail) {
      setLoading(true);
      setErrorSubmit(null);

      let baseUser = {
        id: undefined,
        email: userEmail,
        firstName: "",
        familyName: "",
        birthday: "",
        phoneNumber: "",
        groupName: "",
        groupRole: "Member",
        groupId: "",
        profileImage: "",
        groupMembers: [],
      };

      try {
        const res = await apiCall.get("/User/GetProfile", {
          params: { UserEmail: userEmail },
          validateStatus: (s) =>
            (s >= 200 && s < 300) || s === 404 || s === 400,
        });
        if (res?.status >= 200 && res?.status < 300 && res?.data) {
          const d = res.data;
          baseUser = {
            id: d.id ?? d.Id,
            email: d.email ?? d.Email ?? userEmail,
            firstName: d.firstName ?? d.FirstName ?? "",
            familyName: d.familyName ?? d.FamilyName ?? "",
            birthday: d.birthday ?? d.Birthday ?? "",
            phoneNumber: d.phoneNumber ?? d.PhoneNumber ?? "",
            groupName: d.groupName ?? d.GroupName ?? "",
            groupRole: d.groupRole ?? d.Role ?? "Member",
            groupId: d.groupId ?? d.GroupId ?? "",
            profileImage: "",
            groupMembers: d.groupMembers ?? [],
          };
        }
      } catch {
        // segue com baseUser
      }

      if (!cancelled) {
        setUser(baseUser);
        setFormData({ ...baseUser, birthday: baseUser.birthday || "" });
      }

      try {
        const res2 = await apiCall.get(
          `/User/GetPhotoProfileAndName/${encodeURIComponent(userEmail)}`,
          { validateStatus: (s) => (s >= 200 && s < 300) || s === 404 }
        );
        if (!cancelled && res2?.status !== 404) {
          const data = res2?.data || {};
          const photoPath = data?.PhotoPath ?? data?.photoPath ?? "";
          const fName = data?.FirstName ?? data?.firstName ?? "";

          if (photoPath && photoPath !== "NoPhoto") {
            const relative = normPath(photoPath);
            const absolute = buildFileUrl(FILES_BASE, relative);
            setUser((p) => ({ ...p, profileImage: relative }));
            setFormData((p) => ({ ...p, profileImage: relative }));
            setAuth?.((prev) => ({ ...prev, path: absolute }));
          }
          if (fName) {
            setAuth?.((prev) => ({
              ...prev,
              firstName: prev?.firstName || fName,
            }));
          }
        }
      } catch {
        // ignora
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const email = auth?.Email || auth?.email;
    if (!email) {
      const empty = {
        email: "",
        firstName: "",
        familyName: "",
        birthday: "",
        phoneNumber: "",
        groupName: "",
        groupRole: "Member",
        groupId: "",
        profileImage: "",
        groupMembers: [],
      };
      setUser(empty);
      setFormData(empty);
      setLoading(false);
      return;
    }

    fetchData(email);
    return () => {
      cancelled = true;
    };
  }, [auth?.Email, auth?.email, setAuth, FILES_BASE]);

  // ------- edição / imagem --------
  const handleFileClick = () => fileInputRef.current?.click();

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setImageError("Please select a valid image file (JPG, PNG, or GIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const uploadImage = async () => {
    if (!selectedImage || !user?.id) return null;
    const imageFormData = new FormData();
    imageFormData.append("photo", selectedImage);
    try {
      const response = await apiCall.post(
        `/User/UploadProfileImage/${user.id}`,
        imageFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const partialPath = normPath(
        response?.data?.partialPath || response?.data?.PartialPath || ""
      );
      if (partialPath) return partialPath;
      setImageError("Image uploaded but no path returned");
      return null;
    } catch {
      setImageError("Error to upload image");
      return null;
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorSubmit(null);

    let imageUrl = formData.profileImage || user?.profileImage || "";
    if (selectedImage) {
      const uploadedPath = await uploadImage();
      if (!uploadedPath) {
        setSubmitting(false);
        return;
      }
      imageUrl = uploadedPath;
    }

    const payload = {
      ...formData,
      birthday: formData.birthday || undefined,
      ...(formData.password ? { password: formData.password } : {}),
      profileImage: imageUrl,
    };

    try {
      const response = await apiCall.put("/User/EditUser", payload, {
        headers: { "Content-Type": "application/json" },
        validateStatus: (s) =>
          (s >= 200 && s < 300) || s === 400 || s === 404 || s === 409,
      });

      if (!(response?.status >= 200 && response?.status < 300)) {
        setErrorSubmit(response?.data?.message || "Error to save user data");
      } else {
        const updatedUser = { ...formData, profileImage: imageUrl };
        delete updatedUser.password;

        setUser(updatedUser);
        setFormData(updatedUser);
        setIsEditing(false);
        setSelectedImage(null);
        setImagePreview(null);

        const absolute = buildFileUrl(FILES_BASE, imageUrl);
        // 1) Atualiza contexto (TopBar escuta auth.path/Path)
        setAuth?.((prev) => ({
          ...prev,
          firstName: updatedUser.firstName ?? prev?.firstName,
          path: absolute || prev?.path,
        }));
        // 2) Dispara evento (TopBar também escuta)
        window.dispatchEvent(
          new CustomEvent("avatar-updated", { detail: { url: absolute } })
        );
      }
    } catch {
      setErrorSubmit("Error to save user data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setFormData({ ...user, birthday: user.birthday || "" });
    setIsEditing(false);
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
    setErrorSubmit(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Title text="Profile" />
        <div className="animate-pulse space-y-4 mt-6">
          <div className="h-40 w-full rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header + Ações */}
      <div className="flex items-center">
        <Title text="Profile" />
        <div className="ml-auto flex space-x-3">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={handleCancel}
                className="!h-11 !px-4 !rounded-lg leading-none"
              >
                <span className="inline-flex items-center gap-2">
                  <X className="h-5 w-5" />
                  Cancel
                </span>
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={submitting}
                className="!h-11 !px-4 !rounded-lg leading-none"
                aria-busy={submitting}
              >
                <span className="inline-flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Save Changes
                </span>
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsEditing(true)}
              className="!h-11 !px-4 !rounded-lg leading-none"
            >
              <span className="inline-flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Edit Profile
              </span>
            </Button>
          )}
        </div>
      </div>

      {errorSubmit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
          <p className="text-red-800">{errorSubmit}</p>
        </div>
      )}

      <div
        className="bg-white rounded-xl shadow-md overflow-hidden mt-6"
        style={{ backgroundColor: theme.colors?.background?.paper }}
      >
        {/* Banner/Topo */}
        <div
          className="px-6 py-8 border-b"
          style={{ borderColor: theme.colors.secondary.light }}
        >
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div
                className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden ${
                  isEditing ? "cursor-pointer" : ""
                }`}
                style={{ backgroundColor: theme.colors.primary.main }}
                onClick={isEditing ? handleFileClick : undefined}
                title={displayName}
                aria-label={displayName}
              >
                {currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt="Profile photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}

                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>

              {/* input de ficheiro escondido */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleImageSelect}
                className="hidden"
                disabled={!isEditing}
              />
              {imageError && isEditing && (
                <p className="text-xs mt-2 text-red-600">{imageError}</p>
              )}
            </div>

            <div className="flex-1">
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                {displayName}
              </h2>
              <p
                className="text-lg"
                style={{ color: theme.colors.text.secondary }}
              >
                {user?.email || "Not provided"}
              </p>

              {/* badge role */}
              <div className="mt-2">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: theme.colors.primary.light + "30",
                    color: isPremium ? "gold" : theme.colors.primary.main,
                  }}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  {isPremium ? "PREMIUM" : "MEMBER"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secções */}
        <ProfileInfoSection
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          theme={theme}
        />

        <ProfileGroupSection
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          user={user}
          theme={theme}
        />
      </div>
    </div>
  );
}

export default ProfilePage;

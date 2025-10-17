import React from "react";
import PropTypes from "prop-types";
import { Pencil, LogOut, Trash2, DoorOpen } from "lucide-react";

const safeHeader = (t, i18nPrefix, col) => {
  if (col.headerLabel) return col.headerLabel;
  if (col.headerKey && typeof t === "function") {
    const key = `${i18nPrefix}.${col.headerKey}`;
    const tr = t(key);
    if (tr && tr !== key) return tr;
  }
  return col.headerKey || col.key;
};

function IconButton({ title, className, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`p-2 rounded-md hover:bg-white/10 transition ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── helpers de cor ─── */
const parseHex = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
};
const parseRgbString = (c) => {
  const m = c.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
};
const toRgb = (c) => {
  if (!c || typeof c !== "string") return null;
  if (c.startsWith("#")) return parseHex(c);
  if (c.startsWith("rgb")) return parseRgbString(c);
  return null;
};
const luminance = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [R, G, B] = [f(r), f(g), f(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const resolveIsDark = (theme) => {
  const explicit =
    theme?.palette?.mode ||
    theme?.mode ||
    theme?.appearance ||
    theme?.colorScheme;
  if (explicit) return String(explicit).toLowerCase() === "dark";
  const txt = theme?.colors?.text?.primary;
  const rgb = toRgb(txt || "");
  if (rgb) return luminance(rgb) > 0.6; // texto claro => fundo escuro
  return true;
};

export default function GenericTable({
  filteredData,
  data,
  columns = [],
  t,
  theme,
  i18nPrefix = "common",
  loading = false,
  emptyMessage = "Sem resultados",
  edit,
  remove,
  rowKey,
  stickyHeader = true,
  truncateKeys = [],
  minTableWidth = "56rem",
  truncateWidthClass = "max-w-[180px] sm:max-w-[260px]",
}) {
  const rows = Array.isArray(filteredData)
    ? filteredData
    : Array.isArray(data)
    ? data
    : [];

  const hasActions = Boolean(edit?.enabled || remove?.enabled);
  const shouldTruncate = (key) =>
    Array.isArray(truncateKeys) && truncateKeys.includes(key);

  const handleEditClick = (row) => {
    if (edit?.onEdit) return edit.onEdit(row);
    if (edit?.navigateTo && edit?.navigate)
      return edit.navigate(edit.navigateTo(row));
  };

  const handleDeleteClick = async (row) => {
    const isLogout = remove?.icon === "logout" || remove?.icon === "door";
    const defaultMsg = isLogout
      ? (t ? t("groups.confirm_leave") : "Sair deste grupo?")
      : (t ? t("common.confirmDelete") : "Tens a certeza que queres apagar?");
    const msg =
      remove?.getConfirmMessage?.(row) ||
      remove?.confirmMessage ||
      defaultMsg;

    const ok = window.confirm(msg);
    if (!ok) return;

    try {
      const success = await remove.doDelete(row);
      if (success) remove?.onSuccess?.(row);
      else remove?.onError?.(new Error("delete failed"), row);
    } catch (err) {
      remove?.onError?.(err, row);
    }
  };

  /* ─── cores por modo ─── */
  const isDark = resolveIsDark(theme);
  const BORDER = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)";
  const BORDER_WIDTH = "2px";
  const ROWSEP = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)";

  const PAPER =
    theme?.colors?.background?.paper ??
    (isDark ? "rgba(17,24,39,0.8)" : "rgba(255,255,255,0.6)");

  const TXT =
    theme?.colors?.text?.primary ?? (isDark ? "#0F172A" : "#0F172A"); // body text

  // >>> Header azul (bg)
  const HEADBG =
    theme?.colors?.tableHeader?.bg ??
    (isDark
      ? theme?.colors?.primary?.dark || "#0B3EA8" // azul fechado no dark
      : theme?.colors?.primary?.main || "#1D4ED8"); // azul forte no light

  const HEADTX =
    theme?.colors?.tableHeader?.text ?? (isDark ? "#E5F0FF" : "#FFFFFF");

  const HEAD_DIV = isDark ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.9)";

  const ResolveRemoveIcon = ({ icon, ...props }) => {
    if (icon === "logout") return <LogOut className="h-4 w-4" {...props} />;
    if (icon === "door") return <DoorOpen className="h-4 w-4" {...props} />;
    return <Trash2 className="h-4 w-4" {...props} />;
  };

  const editIconClass = isDark
    ? "text-blue-300 hover:text-blue-200"
    : "text-blue-700 hover:text-blue-800";
  const logoutIconClass = isDark
    ? "text-amber-300 hover:text-amber-200"
    : "text-amber-700 hover:text-amber-800";
  const trashIconClass = isDark
    ? "text-red-300 hover:text-red-200"
    : "text-red-700 hover:text-red-800";

  const removeIconClass = (icon) =>
    icon === "logout" || icon === "door" ? logoutIconClass : trashIconClass;

  return (
    <div
      className="w-full rounded-2xl"
      style={{
        backgroundColor: PAPER,
        border: `${BORDER_WIDTH} solid ${BORDER}`,
      }}
    >
      <div className="rounded-2xl overflow-hidden">
        <div className="overflow-x-auto rounded-2xl">
          <table
            className="w-full text-sm table-auto"
            style={{
              minWidth: minTableWidth,
              borderCollapse: "separate",
              borderSpacing: 0,
              color: TXT,
              background: "transparent",
            }}
          >
            <thead
              className={stickyHeader ? "sticky top-0 z-10" : ""}
              style={{
                background: HEADBG, 
                color: HEADTX, 
                backgroundClip: "padding-box",
              }}
            >
              <tr>
                {columns.map((col) => {
                  const header = safeHeader(t, i18nPrefix, col);
                  return (
                    <th
                      key={col.key}
                      className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center"
                      style={{ borderBottom: `1px solid ${HEAD_DIV}` }}
                    >
                      {header}
                    </th>
                  );
                })}
                {hasActions && (
                  <th
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center"
                    style={{ borderBottom: `1px solid ${HEAD_DIV}` }}
                  >
                    {t ? t("common.actions") : "Ações"}
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    className="px-6 py-6 text-center text-sm opacity-80"
                    colSpan={columns.length + (hasActions ? 1 : 0)}
                  >
                    {t ? t("common.loading") : "A carregar…"}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-6 text-center text-sm opacity-80"
                    colSpan={columns.length + (hasActions ? 1 : 0)}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const rk = rowKey ? rowKey(row, idx) : undefined;
const k =
  rk ??
  row?.Id ??
  row?.id ??
  row?.Email ??
  row?.email ??
  String(idx);
                  const isLast = idx === rows.length - 1;

                  return (
                    <tr
                      key={String(k)}
                      className="transition-colors hover:bg-white/5"
                      style={{
                        borderBottom: isLast
                          ? `${BORDER_WIDTH} solid ${BORDER}`
                          : `1px solid ${ROWSEP}`,
                      }}
                    >
                      {columns.map((col) => {
                        const raw =
                          typeof col.accessor === "function"
                            ? col.accessor(row)
                            : row?.[col.key] ?? "-";
                        const value =
                          typeof col.cell === "function"
                            ? col.cell(raw, row)
                            : raw;
                        const content = value ?? "-";
                        const isTrunc = shouldTruncate(col.key);
                        return (
                          <td key={col.key} className="px-6 py-4 text-center">
                            {isTrunc ? (
                              <div
                                className={`truncate ${truncateWidthClass} mx-auto`}
                                title={String(content)}
                              >
                                {content}
                              </div>
                            ) : (
                              <div className="break-words">{content}</div>
                            )}
                          </td>
                        );
                      })}

                      {hasActions && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {edit?.enabled && (
                              <IconButton
                                title={edit?.title || (t ? t("common.edit") : "Editar")}
                                className={editIconClass}
                                onClick={() => handleEditClick(row)}
                              >
                                <Pencil className="h-4 w-4" strokeWidth={2.25} />
                              </IconButton>
                            )}

                            {remove?.enabled && (
                              <IconButton
                                title={
                                  remove?.title ||
                                  (remove?.icon === "logout" || remove?.icon === "door"
                                    ? (t ? t("groups.leave") : "Sair do grupo")
                                    : (t ? t("common.delete") : "Apagar"))
                                }
                                className={removeIconClass(remove?.icon)}
                                onClick={() => handleDeleteClick(row)}
                              >
                                <ResolveRemoveIcon icon={remove?.icon} strokeWidth={2.25} />
                              </IconButton>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

GenericTable.propTypes = {
  filteredData: PropTypes.array,
  data: PropTypes.array,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      headerKey: PropTypes.string,
      headerLabel: PropTypes.string,
      accessor: PropTypes.func,
      cell: PropTypes.func,
    })
  ).isRequired,
  t: PropTypes.func,
  theme: PropTypes.object,
  i18nPrefix: PropTypes.string,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  edit: PropTypes.shape({
    enabled: PropTypes.bool,
    onEdit: PropTypes.func,
    navigateTo: PropTypes.func,
    navigate: PropTypes.func,
    title: PropTypes.string,
  }),
  remove: PropTypes.shape({
    enabled: PropTypes.bool,
    getConfirmMessage: PropTypes.func,
    confirmMessage: PropTypes.string,
    doDelete: PropTypes.func,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
    title: PropTypes.string,
    icon: PropTypes.oneOf(["logout", "door", "trash"]),
  }),
  rowKey: PropTypes.func,
  stickyHeader: PropTypes.bool,
  truncateKeys: PropTypes.arrayOf(PropTypes.string),
  minTableWidth: PropTypes.string,
  truncateWidthClass: PropTypes.string,
};

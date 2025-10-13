import React from "react";
import PropTypes from "prop-types";

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
      onClick={onClick}
      className={`p-2 rounded-md hover:bg-white/10 transition ${className}`}
    >
      {children}
    </button>
  );
}

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
    const msg =
      remove?.getConfirmMessage?.(row) ||
      remove?.confirmMessage ||
      (t ? t("common.confirmDelete") : "Tens a certeza que queres apagar?");
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

  const BORDER = "rgba(255,255,255,0.8)";
  const BORDER_WIDTH = "2px";
  const PAPER  = theme?.colors?.background?.paper || "rgba(17,24,39,0.8)";
  const TXT    = theme?.colors?.text?.primary || "#F8FAFC";
  const HEADTX = theme?.colors?.primary?.light || "#60A5FA";
  const ROWSEP = "rgba(255,255,255,0.22)";

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
                background: "inherit",
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
                      style={{ borderBottom: `1px solid ${BORDER}` }}
                    >
                      {header}
                    </th>
                  );
                })}
                {hasActions && (
                  <th
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center"
                    style={{ borderBottom: `1px solid ${BORDER}` }}
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
                  const k = rowKey ? rowKey(row, idx) : idx;
                  const isLast = idx === rows.length - 1;

                  return (
                    <tr
                      key={k}
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
                                title={t ? t("common.edit") : "Editar"}
                                className="text-blue-400"
                                onClick={() => handleEditClick(row)}
                              >
                                ✏️
                              </IconButton>
                            )}
                            {remove?.enabled && (
                              <IconButton
                                title={t ? t("common.delete") : "Apagar"}
                                className="text-red-400"
                                onClick={() => handleDeleteClick(row)}
                              >
                                🗑️
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
  }),
  remove: PropTypes.shape({
    enabled: PropTypes.bool,
    getConfirmMessage: PropTypes.func, 
    confirmMessage: PropTypes.string,
    doDelete: PropTypes.func,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
  }),
  rowKey: PropTypes.func,
  stickyHeader: PropTypes.bool,
  truncateKeys: PropTypes.arrayOf(PropTypes.string),
  minTableWidth: PropTypes.string,
  truncateWidthClass: PropTypes.string,
};

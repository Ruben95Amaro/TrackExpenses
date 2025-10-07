import React from "react";
import PropTypes from "prop-types";

function IconButton({ title, className, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-2 rounded hover:opacity-80 transition ${className}`}
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
  headClassName,
  headerCellClassName,
}) {
  const rows = Array.isArray(filteredData)
    ? filteredData
    : Array.isArray(data)
    ? data
    : [];

  const hasActions = edit?.enabled || remove?.enabled;
  const shouldTruncate = (key) =>
    Array.isArray(truncateKeys) && truncateKeys.includes(key);

  const handleEditClick = (row) => {
    if (edit?.onEdit) return edit.onEdit(row);
    if (edit?.navigateTo && edit?.navigate)
      return edit.navigate(edit.navigateTo(row));
  };

  const handleDeleteClick = async (row) => {
    const ok = window.confirm(
      remove?.confirmMessage ||
        (t ? t("common.confirmDelete") : "Tens a certeza que queres apagar?")
    );
    if (!ok) return;
    try {
      const success = await remove.doDelete(row);
      if (success) remove?.onSuccess?.(row);
      else remove?.onError?.(new Error("delete failed"), row);
    } catch (err) {
      remove?.onError?.(err, row);
    }
  };

  const thClass = headerCellClassName || "px-6 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap text-center";

  return (
    <table
  className="
    relative w-full table-auto rounded-2xl
    before:content-[''] before:absolute before:inset-0
    before:rounded-[inherit] before:border before:border-white/80
    before:pointer-events-none before:z-50  
  "
  style={{
    minWidth: minTableWidth,
    borderCollapse: "separate",
    borderSpacing: 0,
    backgroundColor: theme?.colors?.background?.paper,
  }}
>
      <thead
        className={`${stickyHeader ? "sticky top-0 z-10" : ""} ${headClassName || ""}`}
        style={{
          backgroundColor: headClassName
            ? undefined
            : theme?.colors?.background?.paper,
          // linha branca fina por baixo do cabeçalho
          boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <tr>
          {columns.map((col) => {
            const header =
              col.headerLabel ??
              (col.headerKey
                ? t
                  ? t(`${i18nPrefix}.${col.headerKey}`)
                  : col.headerKey
                : col.key);
            return (
              <th
                key={col.key}
                className={thClass}
                style={{
                  color: theme?.colors?.primary?.main || "#2563EB",
                  opacity: 0.95,
                }}
                title={typeof header === "string" ? header : undefined}
              >
                {header}
              </th>
            );
          })}
          {hasActions && (
            <th
              className={thClass}
              style={{
                color: theme?.colors?.primary?.main || "#2563EB",
                opacity: 0.95,
              }}
            >
              {t ? t("common.actions") : "Ações"}
            </th>
          )}
        </tr>
      </thead>

      <tbody style={{ backgroundColor: theme?.colors?.background?.paper }}>
        {loading ? (
          <tr style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
            <td
              className="px-6 py-6 text-center"
              colSpan={columns.length + (hasActions ? 1 : 0)}
            >
              {t ? t("common.loading") : "Carregando…"}
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
            <td
              className="px-6 py-6 text-center"
              colSpan={columns.length + (hasActions ? 1 : 0)}
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => {
            const k = rowKey ? rowKey(row, idx) : idx;
            return (
              <tr
                key={k}
                // linhas brancas internas entre as linhas
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}
              >
                {columns.map((col) => {
                  const raw =
                    typeof col.accessor === "function"
                      ? col.accessor(row)
                      : row?.[col.key] ?? "-";
                  const value =
                    typeof col.cell === "function" ? col.cell(raw, row) : raw;

                  const content = value ?? "-";
                  const isTrunc = shouldTruncate(col.key);

                  return (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-sm align-middle text-center"
                    >
                      {isTrunc ? (
                        <div
                          className={`truncate ${truncateWidthClass} mx-auto text-center`}
                          title={String(content)}
                        >
                          {content}
                        </div>
                      ) : (
                        <div className="break-words text-center">{content}</div>
                      )}
                    </td>
                  );
                })}

                {hasActions && (
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      {edit?.enabled && (
                        <IconButton
                          title={t ? t("common.edit") : "Editar"}
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEditClick(row)}
                        >
                          ✏️
                        </IconButton>
                      )}
                      {remove?.enabled && (
                        <IconButton
                          title={t ? t("common.delete") : "Apagar"}
                          className="text-red-600 hover:text-red-900"
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
  headClassName: PropTypes.string,
  headerCellClassName: PropTypes.string,
};

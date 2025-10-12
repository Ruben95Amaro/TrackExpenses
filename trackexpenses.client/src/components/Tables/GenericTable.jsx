// src/components/Tables/GenericTable.jsx
import React from "react";
import PropTypes from "prop-types";
import { MoreVertical } from "lucide-react";

const safeHeader = (t, i18nPrefix, col) => {
  if (col.headerLabel) return col.headerLabel;
  if (col.headerKey && typeof t === "function") {
    const k = `${i18nPrefix}.${col.headerKey}`;
    const tr = t(k);
    if (tr && tr !== k) return tr;
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
  const rows = Array.isArray(filteredData) ? filteredData : Array.isArray(data) ? data : [];

  const hasActions = Boolean(edit?.enabled || remove?.enabled);
  const shouldTruncate = (key) => Array.isArray(truncateKeys) && truncateKeys.includes(key);

  const handleEditClick = (row) => {
    if (edit?.onEdit) return edit.onEdit(row);
    if (edit?.navigateTo && edit?.navigate) return edit.navigate(edit.navigateTo(row));
  };
  const handleDeleteClick = async (row) => {
    const ok = window.confirm(
      remove?.confirmMessage || (t ? t("common.confirmDelete") : "Tens a certeza que queres apagar?")
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

  // ——— cores iguais ao cartão de cima ———
  const borderCol = "rgba(255,255,255,0.35)";        // mais branca/visível
  const paperBg   = theme?.colors?.background?.paper || "rgba(17,24,39,0.8)";
  const headBg    = "rgba(255,255,255,0.06)";
  const headText  = theme?.colors?.primary?.light || "#60A5FA";
  const textCol   = theme?.colors?.text?.primary || "#F8FAFC";

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        backgroundColor: paperBg,
        border: `1px solid ${borderCol}`,  // a ÚNICA borda visível
      }}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full text-sm table-auto"
          style={{
            minWidth: minTableWidth,
            borderCollapse: "separate",
            borderSpacing: 0,
            color: textCol,
            width: "100%",
            // sem borda no table para não “cortar” os cantos
          }}
        >
          {/* CABEÇALHO */}
          <thead
            className={`${stickyHeader ? "sticky top-0 z-10" : ""} relative`}
            style={{
              background: headBg,
              color: headText,
              backdropFilter: "blur(8px)",
              // estes 3 garantem canto perfeito sem “meias-luas”
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              overflow: "hidden",
              // linha separadora inferior suave
              boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.35)",
            }}
          >
            <tr>
              {columns.map((col) => {
                const header = safeHeader(t, i18nPrefix, col);
                return (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center"
                    // sem border nas células do header
                  >
                    {header}
                  </th>
                );
              })}
              {hasActions && (
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center">
                  {t ? t("common.actions") : "Ações"}
                </th>
              )}
            </tr>

            {/* botão flutuante (exemplo) */}
            <button
              type="button"
              title="Opções"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 rounded p-1 hover:bg-white/10"
              onClick={() => {}}
              aria-label="Opções"
            >
              <MoreVertical className="h-5 w-5 text-white/70" />
            </button>
          </thead>

          {/* CORPO */}
          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-6 text-center text-sm opacity-80" colSpan={columns.length + (hasActions ? 1 : 0)}>
                  {t ? t("common.loading") : "A carregar…"}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-center text-sm opacity-80" colSpan={columns.length + (hasActions ? 1 : 0)}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const k = rowKey ? rowKey(row, idx) : idx;
                const isLastRow = idx === rows.length - 1;

                return (
                  <tr
                    key={k}
                    className="transition-colors hover:bg-white/5"
                    style={{
                      // linhas horizontais internas (sem vertical) — não estragam os cantos
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                      // fecha a base com a mesma linha do topo
                      ...(isLastRow ? { borderBottom: `1px solid ${borderCol}` } : null),
                    }}
                  >
                    {columns.map((col) => {
                      const raw = typeof col.accessor === "function" ? col.accessor(row) : row?.[col.key] ?? "-";
                      const value = typeof col.cell === "function" ? col.cell(raw, row) : raw;
                      const content = value ?? "-";
                      const isTrunc = shouldTruncate(col.key);

                      return (
                        <td key={col.key} className="px-6 py-4 align-middle text-center">
                          {isTrunc ? (
                            <div className={`truncate ${truncateWidthClass} mx-auto`} title={String(content)}>
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
                            <IconButton title={t ? t("common.edit") : "Editar"} className="text-blue-400" onClick={() => handleEditClick(row)}>
                              ✏️
                            </IconButton>
                          )}
                          {remove?.enabled && (
                            <IconButton title={t ? t("common.delete") : "Apagar"} className="text-red-400" onClick={() => handleDeleteClick(row)}>
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
  edit: PropTypes.object,
  remove: PropTypes.object,
  rowKey: PropTypes.func,
  stickyHeader: PropTypes.bool,
  truncateKeys: PropTypes.arrayOf(PropTypes.string),
  minTableWidth: PropTypes.string,
  truncateWidthClass: PropTypes.string,
};

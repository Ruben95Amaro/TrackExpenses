// Helpers para construir e corrigir URLs de imagens/ficheiros.

export function stripApi(base) {
  // remove /api no fim de um base url
  return (base || "").replace(/\/api\/?$/i, "");
}

export function normalizePath(p) {
  return (p || "").toString().replace(/\\/g, "/").replace(/^\/+/, "");
}

export function stripApiFromAbsolute(url) {
  // se for absoluto e tiver /api no caminho de assets, retira
  return (url || "").replace(/(https?:\/\/[^/]+)\/api(\/|$)/i, "$1$2");
}

export function buildAssetUrl(partialOrAbsolute) {
  if (!partialOrAbsolute) return null;

  const filesBase =
    import.meta.env.VITE_FILES_BASE_URL ||
    stripApi(import.meta.env.VITE_API_BASE_URL || "");

  const p = String(partialOrAbsolute);

  // absoluto → só garantir que não tem /api e meter cache-buster
  if (/^https?:\/\//i.test(p)) {
    const cleaned = stripApiFromAbsolute(p);
    return `${cleaned}${cleaned.includes("?") ? "" : `?t=${Date.now()}`}`;
  }

  const root = stripApi(filesBase);
  return `${root}/${normalizePath(p)}?t=${Date.now()}`;
}

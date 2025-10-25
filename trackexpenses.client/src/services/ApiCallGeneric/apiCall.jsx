// src/services/apiCall.js
import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, ""); // sem "/" no fim
const TIMEOUT = 25_000;
const AUTH_KEY = "auth";

/* ========== helpers auth ========== */
const readAuth = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}"); }
  catch { return {}; }
};

const getAccessToken = () => {
  try { return readAuth()?.user?.accessToken ?? null; } // <-- sempre accessToken (minúsculo)
  catch { return null; }
};

/* ========== axios instance ========== */
const apiCall = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  withCredentials: false, // só mete true se usares cookies
  headers: { "Content-Type": "application/json" },
  validateStatus: () => true, // tratamos o erro no interceptor
});

/* ========== request logging + auth ========== */
apiCall.interceptors.request.use((cfg) => {
  // compõe o URL final para logging
  const fullUrl = cfg.baseURL
    ? new URL(cfg.url || "", cfg.baseURL).toString()
    : (cfg.url || "");

  const token = getAccessToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  else delete cfg.headers.Authorization;

  console.log("➡️",
    (cfg.method || "GET").toUpperCase(),
    fullUrl,
    { headers: cfg.headers }
  );

  return cfg;
});

/* ========== normalização de erro ========== */
const normalizeError = (errOrRes, fallbackMsg) => {
  const isAxios = !!errOrRes?.isAxiosError || !!errOrRes?.response || !!errOrRes?.config;
  const response = isAxios ? errOrRes.response : errOrRes;
  const config   = isAxios ? errOrRes.config   : errOrRes?.config;

  return {
    status: response?.status ?? null,
    code: errOrRes?.code || (response ? "HTTP_ERROR" : "NETWORK_ERROR"),
    message:
      response?.data?.message ||
      response?.data?.error ||
      (typeof response?.data === "string" ? response.data : null) ||
      (errOrRes?.message?.includes?.("timeout") ? "Pedido expirou." : fallbackMsg),
    data: response?.data ?? null,
    url: config?.url,
    method: config?.method?.toUpperCase(),
  };
};

/* ========== response logging + envelope {ok,data|error} ========== */
apiCall.interceptors.response.use(
  (res) => {
    const fullUrl = res?.config?.baseURL
      ? new URL(res.config.url || "", res.config.baseURL).toString()
      : (res?.config?.url || "");

    console.log("⬅️", res.status, fullUrl, res.data);

    if (res.status >= 200 && res.status < 300) {
      return { ok: true, data: res.data, status: res.status, headers: res.headers, config: res.config };
    }

    let msg = "Pedido inválido.";
    if (res.status === 401) msg = "Sessão expirada. Faz login novamente.";
    else if (res.status === 403) msg = "Sem permissões.";
    else if (res.status === 404) msg = "Recurso não encontrado.";
    else if (res.status === 429) msg = "Demasiados pedidos. Tenta mais tarde.";
    else if (res.status >= 500) msg = "Erro do servidor.";

    return {
      ok: false,
      error: normalizeError({ response: res, config: res.config }, msg),
      status: res.status,
      config: res.config,
    };
  },
  (error) => {
    const cfg = error?.config || {};
    const fullUrl = cfg.baseURL
      ? new URL(cfg.url || "", cfg.baseURL).toString()
      : (cfg.url || "");
    console.log("❌", fullUrl, error);

    return Promise.resolve({
      ok: false,
      error: normalizeError(error, "Falha de rede. Tenta novamente."),
    });
  }
);

/* ========== helpers públicos ========== */
export const setAuthHeader = (token) => {
  if (token) apiCall.defaults.headers.Authorization = `Bearer ${token}`;
  else delete apiCall.defaults.headers.Authorization;
};

export const syncAuthHeaderFromStorage = () => {
  const token = getAccessToken();
  if (token) apiCall.defaults.headers.Authorization = `Bearer ${token}`;
  else delete apiCall.defaults.headers.Authorization;
};

export default apiCall;

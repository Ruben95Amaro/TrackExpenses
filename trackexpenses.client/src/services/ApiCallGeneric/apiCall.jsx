// apiCall.js
import axios from "axios";

/* ================== ENV / CONST ================== */
const BASE_URL  = import.meta.env.VITE_API_BASE_URL; // define no DO
const TIMEOUT   = 25_000;
const AUTH_KEY  = "auth";

/* ================== helpers storage ================== */
const readAuth = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}"); }
  catch { return {}; }
};
const getAccessToken = () => {
  try { return readAuth()?.user?.accessToken ?? null; } // <- usa sempre accessToken
  catch { return null; }
};

/* ================== axios instance ================== */
const apiCall = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  withCredentials: false, // Bearer token, nada de cookies
  headers: { "Content-Type": "application/json" },
  validateStatus: () => true, // tratamos nós do status
});

/* ===== Request: injeta Authorization se existir ===== */
apiCall.interceptors.request.use((cfg) => {
  const t = getAccessToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  else delete cfg.headers.Authorization;
  return cfg;
});

/* ================== normalização de erro ================== */
const normalizeError = (errOrRes, fallbackMsg) => {
  const isAxiosErr = !!errOrRes?.isAxiosError || !!errOrRes?.response || !!errOrRes?.config;
  const response   = isAxiosErr ? errOrRes.response : errOrRes;
  const config     = isAxiosErr ? errOrRes.config   : errOrRes?.config;

  const msgFromData =
    response?.data?.message ||
    response?.data?.error ||
    (typeof response?.data === "string" ? response.data : null);

  return {
    status: response?.status ?? null,
    code: errOrRes?.code || (response ? "HTTP_ERROR" : "NETWORK_ERROR"),
    message:
      msgFromData ||
      (errOrRes?.message?.toLowerCase?.().includes("timeout") ? "Pedido expirou." : fallbackMsg),
    data: response?.data ?? null,
    url: config?.url,
    method: config?.method?.toUpperCase(),
  };
};

/* ===== Response: devolve { ok, data | error } ===== */
apiCall.interceptors.response.use(
  (res) => {
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
  (error) => Promise.resolve({
    ok: false,
    error: normalizeError(error, "Falha de rede. Tenta novamente."),
  })
);

/* ================== utils p/ header global ================== */
export const setAuthHeader = (token) => {
  if (token) apiCall.defaults.headers.Authorization = `Bearer ${token}`;
  else delete apiCall.defaults.headers.Authorization;
};

export function syncAuthHeaderFromStorage() {
  const t = getAccessToken();
  if (t) apiCall.defaults.headers.Authorization = `Bearer ${t}`;
  else delete apiCall.defaults.headers.Authorization;
}

export default apiCall;

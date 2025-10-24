import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TIMEOUT = 25000;
const AUTH_KEY = "auth";

/* ================== helpers storage ================== */
const readAuth = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}"); }
  catch { return {}; }
};
const getAccess = () => {
  try { return readAuth()?.user?.accessToken ?? null; }
  catch { return null; }
};

/* ================== axios ================== */
const apiCall = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
  validateStatus: () => true
});

apiCall.interceptors.request.use((cfg) => {
  try {
    const a = JSON.parse(localStorage.getItem("auth") || "{}");
    const t = a?.user?.AccessToken;
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    else delete cfg.headers.Authorization;
  } catch {
    delete cfg.headers.Authorization;
  }
  return cfg;
});


/* ================== normalização ================== */
const normalizeError = (errOrRes, fallbackMsg) => {
  const isAxiosErrObj = !!errOrRes?.isAxiosError || !!errOrRes?.response || !!errOrRes?.config;
  const response = isAxiosErrObj ? errOrRes.response : errOrRes;
  const config   = isAxiosErrObj ? errOrRes.config   : errOrRes?.config;

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
    method: config?.method?.toUpperCase()
  };
};

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
      config: res.config
    };
  },
  (error) => Promise.resolve({
    ok: false,
    error: normalizeError(error, "Falha de rede. Tenta novamente.")
  })
);

export const setAuthHeader = (token) => {
  if (token) apiCall.defaults.headers.Authorization = `Bearer ${token}`;
  else delete apiCall.defaults.headers.Authorization;
};

export function syncAuthHeaderFromStorage() {
  try {
    const a = JSON.parse(localStorage.getItem("auth") || "{}");
    const t = a?.user?.AccessToken;
    if (t) apiCall.defaults.headers.Authorization = `Bearer ${t}`;
    else delete apiCall.defaults.headers.Authorization;
  } catch {
    delete apiCall.defaults.headers.Authorization;
  }
}

export default apiCall;

// src/services/apiCall.js
import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, ""); // ex: https://xxx.ngrok-free.dev/api
const TIMEOUT = 25_000;
const AUTH_KEY = "auth";

const readAuth = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}"); }
  catch { return {}; }
};
const getAccessToken = () => {
  try { return readAuth()?.user?.accessToken ?? null; } catch { return null; }
};

const apiCall = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    // *** isto mata a splash page do ngrok ***
    "ngrok-skip-browser-warning": "true",
  },
  validateStatus: () => true,
});

apiCall.interceptors.request.use((cfg) => {
  const token = getAccessToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`; else delete cfg.headers.Authorization;

  const fullUrl = cfg.baseURL ? new URL(cfg.url || "", cfg.baseURL).toString() : (cfg.url || "");
  console.log("➡️", (cfg.method || "GET").toUpperCase(), fullUrl, { headers: cfg.headers });
  return cfg;
});

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

apiCall.interceptors.response.use(
  (res) => {
    const fullUrl = res?.config?.baseURL ? new URL(res.config.url || "", res.config.baseURL).toString() : (res?.config?.url || "");
    console.log("⬅️", res.status, fullUrl, res.data);

    // se por acaso ainda vier HTML, nem finjas que está OK
    const contentType = res.headers?.["content-type"] || res.headers?.get?.("content-type");
    const looksHtml = typeof res.data === "string" && /<!DOCTYPE html>|<html/i.test(res.data);
    if (!contentType?.includes?.("application/json") || looksHtml) {
      return {
        ok: false,
        error: normalizeError({ response: res, config: res.config }, "Resposta não é JSON (provavelmente splash do ngrok)."),
        status: res.status,
        config: res.config
      };
    }

    if (res.status >= 200 && res.status < 300) {
      return { ok: true, data: res.data, status: res.status, headers: res.headers, config: res.config };
    }

    let msg = "Pedido inválido.";
    if (res.status === 401) msg = "Sessão expirada. Faz login novamente.";
    else if (res.status === 403) msg = "Sem permissões.";
    else if (res.status === 404) msg = "Recurso não encontrado.";
    else if (res.status === 429) msg = "Demasiados pedidos. Tenta mais tarde.";
    else if (res.status >= 500) msg = "Erro do servidor.";

    return { ok: false, error: normalizeError({ response: res, config: res.config }, msg), status: res.status, config: res.config };
  },
  (error) => {
    const cfg = error?.config || {};
    const fullUrl = cfg.baseURL ? new URL(cfg.url || "", cfg.baseURL).toString() : (cfg.url || "");
    console.log("❌", fullUrl, error);
    return Promise.resolve({ ok: false, error: normalizeError(error, "Falha de rede. Tenta novamente.") });
  }
);

export const setAuthHeader = (token) => {
  if (token) apiCall.defaults.headers.Authorization = `Bearer ${token}`;
  else delete apiCall.defaults.headers.Authorization;
};
export const syncAuthHeaderFromStorage = () => {
  const t = getAccessToken();
  if (t) apiCall.defaults.headers.Authorization = `Bearer ${t}`;
  else delete apiCall.defaults.headers.Authorization;
};

export default apiCall;

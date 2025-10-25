// src/services/apiCall.js
import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const TIMEOUT = 25_000;
const AUTH_KEY = "auth";

const getAccessToken = () => {
  try {
    const a = JSON.parse(localStorage.getItem(AUTH_KEY) || "{}");
    // apanha várias variantes que já vi no teu código
    return (
      a?.user?.accessToken ||
      a?.user?.AccessToken ||
      a?.accessToken ||
      a?.AccessToken ||
      a?.token ||
      null
    );
  } catch { return null; }
};

const apiCall = axios.create({
  baseURL: BASE_URL, // mete /api no .env para ficares só com paths relativos: /Groups/...
  timeout: TIMEOUT,
  withCredentials: false, // estamos a usar header, não cookies
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  validateStatus: () => true,
});

apiCall.interceptors.request.use((cfg) => {
  const t = getAccessToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  else delete cfg.headers.Authorization;

  // debug útil
  const fullUrl = cfg.baseURL ? new URL(cfg.url || "", cfg.baseURL).toString() : (cfg.url || "");
  console.log("➡️", (cfg.method || "GET").toUpperCase(), fullUrl, { headers: cfg.headers });
  return cfg;
});

apiCall.interceptors.response.use(
  (res) => {
    const fullUrl = res?.config?.baseURL
      ? new URL(res.config.url || "", res.config.baseURL).toString()
      : (res?.config?.url || "");

    console.log("⬅️", res.status, fullUrl, res.data);

    const ct = (res.headers?.["content-type"] || "").toLowerCase();
    const isNoContent = res.status === 204 || res.data == null || res.data === "";
    const looksHtml = typeof res.data === "string" && /<!DOCTYPE html>|<html/i.test(res.data);

    // 1) 204 / sem body: sucesso
    if (isNoContent) {
      return { ok: true, data: null, status: res.status, headers: res.headers, config: res.config };
    }

    // 2) Splash do ngrok (HTML) -> erro “não JSON”
    if (looksHtml && !ct.includes("application/json")) {
      return {
        ok: false,
        error: { status: res.status, message: "Resposta não é JSON (pode ser splash do ngrok).", data: res.data },
        status: res.status,
        config: res.config
      };
    }

    // 3) 2xx com JSON ou texto válido
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, data: res.data, status: res.status, headers: res.headers, config: res.config };
    }

    // 4) Mapa de erros padrão
    let msg = "Pedido inválido.";
    if (res.status === 401) msg = "Sessão expirada ou token ausente.";
    else if (res.status === 403) msg = "Sem permissões.";
    else if (res.status === 404) msg = "Recurso não encontrado.";
    else if (res.status === 429) msg = "Demasiados pedidos.";
    else if (res.status >= 500) msg = "Erro do servidor.";

    return {
      ok: false,
      error: { status: res.status, message: msg, data: res.data },
      status: res.status,
      config: res.config
    };
  },
  (error) =>
    Promise.resolve({
      ok: false,
      error: { status: null, message: "Falha de rede.", data: null }
    })
);


export const setAuthHeader = (token) => {
  if (token) apiCall.defaults.headers.Authorization = `Bearer ${token}`;
  else delete apiCall.defaults.headers.Authorization;
};

export const syncAuthHeaderFromStorage = () => setAuthHeader(getAccessToken());

export default apiCall;

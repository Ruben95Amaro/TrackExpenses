// vite.config.js
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

// estes imports ficam, mas SÓ usamos em dev
import fs from "fs";
import path from "path";
import child_process from "child_process";

const certificateName = "trackexpenses.client";

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  const target = process.env.ASPNETCORE_HTTPS_PORT
    ? `https://localhost:${process.env.ASPNETCORE_HTTPS_PORT}`
    : process.env.ASPNETCORE_URLS
    ? process.env.ASPNETCORE_URLS.split(";")[0]
    : "https://localhost:7209";

  let server = {};

  if (isDev) {
    try {
      const baseFolder =
        process.env.APPDATA && process.env.APPDATA !== ""
          ? `${process.env.APPDATA}/ASP.NET/https`
          : `${process.env.HOME}/.aspnet/https`;

      const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
      const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

      if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder, { recursive: true });

      // gera o cert só se faltar — e NUNCA em build (porque só corre em dev)
      if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
        const res = child_process.spawnSync(
          "dotnet",
          ["dev-certs", "https", "--export-path", certFilePath, "--format", "Pem", "--no-password"],
          { stdio: "inherit" }
        );
        if (res.status !== 0) {
          console.warn("[vite] Não foi possível criar o certificado. Vou arrancar sem HTTPS.");
        }
      }

      const hasCert = fs.existsSync(certFilePath) && fs.existsSync(keyFilePath);

      server = {
        proxy: { "/api": { target, changeOrigin: true, secure: false } },
        port: 64306,
        ...(hasCert
          ? {
              https: {
                key: fs.readFileSync(path.join(
                  (process.env.APPDATA && process.env.APPDATA !== "" ? `${process.env.APPDATA}/ASP.NET/https` : `${process.env.HOME}/.aspnet/https`),
                  `${certificateName}.key`
                )),
                cert: fs.readFileSync(path.join(
                  (process.env.APPDATA && process.env.APPDATA !== "" ? `${process.env.APPDATA}/ASP.NET/https` : `${process.env.HOME}/.aspnet/https`),
                  `${certificateName}.pem`
                )),
              },
            }
          : {}),
      };
    } catch (e) {
      console.warn("[vite] Falha a preparar HTTPS DEV:", e?.message);
      server = { proxy: { "/api": { target, changeOrigin: true, secure: false } }, port: 64306 };
    }
  }

  return {
    plugins: [react({ jsxRuntime: "automatic", jsxImportSource: "react" }), tailwind()],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    ...(isDev ? { server } : {}), // em build, nada de server/https
  };
});

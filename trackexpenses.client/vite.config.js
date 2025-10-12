import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';           
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';
import tailwind from "@tailwindcss/vite";      

const baseFolder =
  env.APPDATA && env.APPDATA !== ''
    ? `${env.APPDATA}/ASP.NET/https`
    : `${env.HOME}/.aspnet/https`;

const certificateName = 'trackexpenses.client';
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder, { recursive: true });

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
  if (
    0 !==
    child_process.spawnSync(
      'dotnet',
      [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
      ],
      { stdio: 'inherit' }
    ).status
  ) {
    throw new Error('Could not create certificate.');
  }
}

const target =
  env.ASPNETCORE_HTTPS_PORT
    ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}`
    : env.ASPNETCORE_URLS
    ? env.ASPNETCORE_URLS.split(';')[0]
    : 'https://localhost:7209';

export default defineConfig({
 plugins: [react({ jsxRuntime: "automatic", jsxImportSource: "react" }), tailwind()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: target,
        changeOrigin: true,
        secure: false,
      },
    },
    port: 64306,
    https: {
      key: fs.readFileSync(keyFilePath),
      cert: fs.readFileSync(certFilePath),
    },
  },
});

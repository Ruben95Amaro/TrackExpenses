import React, { useRef, useState } from "react";

/**
 * Lê QR a partir de uma foto (ficheiro local).
 * Suporta modo "headless" (sem botão/erros visíveis) para integrações externas.
 *
 * Props:
 * - onDecoded(text)
 * - onError?(message)
 * - buttonLabel = "Ler QR da foto"
 * - accept = "image/*"
 * - renderMode = "button" | "headless"
 *   (se buttonLabel === "hidden", assume "headless" para retrocompatibilidade)
 */
export default function QRCodeFromPhoto({
  onDecoded,
  onError,
  buttonLabel = "Ler QR da foto",
  accept = "image/*",
  renderMode,
}) {
  const mode = renderMode || (buttonLabel === "hidden" ? "headless" : "button");

  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);

    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();

      const url = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(url);
      URL.revokeObjectURL(url);

      const text = result?.getText ? result.getText() : result?.text;
      if (typeof text === "string" && text.trim()) {
        onDecoded?.(text.trim());
      } else {
        const msg = "Não consegui ler QR nesta imagem.";
        setError(mode === "button" ? msg : null);
        onError?.(msg);
      }
    } catch {
      const msg = "Não consegui ler o QR. Tenta outra foto (nítida, sem reflexos).";
      setError(mode === "button" ? msg : null);
      onError?.(msg);
    } finally {
      setBusy(false);
      // permite re-escolher o mesmo ficheiro
      e.target.value = "";
    }
  };

  // Em headless: só o input (escondido)
  if (mode === "headless") {
    return (
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        hidden
      />
    );
  }

  // Modo com botão + feedback inline
  return (
    <div className="flex flex-wrap items-center gap-3 min-w-0">
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} hidden />
      <button
        type="button"
        onClick={handlePick}
        className="inline-flex items-center justify-center rounded-md px-4 h-10 border border-gray-300 hover:bg-gray-50"
        disabled={busy}
      >
        {busy ? "A ler…" : buttonLabel}
      </button>
      {error && (
        <span
          className="text-sm text-red-600 break-words"
          style={{ overflowWrap: "anywhere", hyphens: "auto" }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

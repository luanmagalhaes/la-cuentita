"use client";

import Link from "next/link";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

const buttonStyle = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: "16px",
  border: "2px solid #1d2060",
  fontSize: "16px",
  fontWeight: 700,
  cursor: "pointer",
} as const;

export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error("app crashed", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "0 32px",
          textAlign: "center",
          background: "#f6efdd",
          color: "#1d2060",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <title>La Cuentita</title>
        <strong style={{ fontSize: "28px" }}>O app travou</strong>
        <p style={{ maxWidth: "300px", fontSize: "14px", fontWeight: 600, opacity: 0.7 }}>
          Algo deu errado aqui no app. As contas já lançadas continuam guardadas no servidor.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "300px" }}>
          <button
            type="button"
            onClick={() => retry()}
            style={{ ...buttonStyle, background: "#1d2060", color: "#f6efdd" }}
          >
            Tentar de novo
          </button>
          <Link
            href="/"
            style={{
              ...buttonStyle,
              boxSizing: "border-box",
              display: "block",
              textDecoration: "none",
              background: "#f6efdd",
              color: "#1d2060",
            }}
          >
            Voltar para o início
          </Link>
        </div>
      </body>
    </html>
  );
}

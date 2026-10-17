"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error("screen crashed", error);
  }, [error]);

  return (
    <main className="stage-cream flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
      <Wordmark size="sm" className="opacity-50" />
      <span className="display text-3xl text-ink">Essa tela travou</span>
      <p className="max-w-xs text-sm font-semibold text-ink/60">
        Algo deu errado aqui no app. Seus pontos já salvos continuam guardados no servidor.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button variant="ink" size="lg" fullWidth onClick={() => retry()}>
          Tentar de novo
        </Button>
        <Link
          href="/"
          className="display rounded-2xl bg-paper px-4 py-2.5 text-sm text-ink ring-2 ring-ink shadow-[0_5px_0_var(--color-ink)]"
        >
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}

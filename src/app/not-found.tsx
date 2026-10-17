import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";

export default function NotFound() {
  return (
    <main className="stage-cream flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
      <Wordmark size="sm" className="opacity-50" />
      <span className="display text-3xl text-ink">Essa página não existe</span>
      <p className="max-w-xs text-sm font-semibold text-ink/60">
        O endereço pode ter sido digitado errado. O placar fica na página inicial.
      </p>
      <Link
        href="/"
        className="display rounded-2xl bg-ink px-5 py-3.5 text-base text-paper ring-2 ring-ink shadow-[0_5px_0_#0d1040]"
      >
        Voltar para o início
      </Link>
    </main>
  );
}

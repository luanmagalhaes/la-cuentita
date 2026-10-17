interface TroubleBannerProps {
  message: string | null;
}

export function TroubleBanner({ message }: TroubleBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-3 pt-[calc(var(--safe-top)+0.5rem)]"
    >
      <div className="w-full max-w-md rounded-2xl border-2 border-ink bg-flame-soft px-4 py-2.5 text-ink shadow-[0_5px_0_var(--color-ink)]">
        <span className="display block text-sm">O placar parou de atualizar</span>
        <span className="block text-xs font-semibold text-ink/75">{message}</span>
        <span className="mt-0.5 block text-[0.7rem] font-semibold text-ink/55">
          Tentando de novo sozinho. Não precisa recarregar.
        </span>
      </div>
    </div>
  );
}

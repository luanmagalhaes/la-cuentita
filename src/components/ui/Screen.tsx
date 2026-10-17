import type { ReactNode } from "react";

interface ScreenProps {
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Screen({ children, footer, wide = false }: ScreenProps) {
  return (
    <main className="stage-cream flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-6 pt-[calc(var(--safe-top)+1.5rem)] sm:px-8">
        <div className={`mx-auto flex w-full flex-1 flex-col ${wide ? "max-w-4xl" : "max-w-xl"}`}>
          {children}
        </div>
      </div>

      {footer ? (
        <div className="shrink-0 border-t-2 border-ink/15 bg-paper/85 px-5 pb-[calc(var(--safe-bottom)+1rem)] pt-4 backdrop-blur-sm sm:px-8">
          <div className={`mx-auto w-full ${wide ? "max-w-4xl" : "max-w-xl"}`}>{footer}</div>
        </div>
      ) : null}
    </main>
  );
}

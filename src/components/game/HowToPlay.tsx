"use client";

import { useState, type ReactNode } from "react";
import { TableCard } from "@/components/cards/TableCard";
import { Button } from "@/components/ui/Button";
import { startingSavingsTable } from "@/lib/game/rules";

interface HowToPlayProps {
  onClose: () => void;
}

interface Slide {
  title: string;
  tone: string;
  art: ReactNode;
  body: ReactNode;
}

function Hot({ children }: { children: ReactNode }) {
  return <strong className="display font-normal text-flame">{children}</strong>;
}

const slides: Slide[] = [
  {
    title: "Ganha quem não paga",
    tone: "stage-orange text-ink",
    art: <span className="text-6xl">🧾</span>,
    body: (
      <div className="flex flex-col gap-3 text-center text-sm leading-snug text-ink/80">
        <p>
          Vocês jogam o La Cuenta com as cartas na mesa. O app só cuida do <Hot>dinheiro</Hot>: quanto cada um
          tem, quanto custou cada bar e quem ganhou.
        </p>
        <p>
          Cada rodada é um bar. Quando alguém pede a conta, essa pessoa toca em{" "}
          <strong className="text-ink">Vou ter que pagar essa la ela de conta</strong> e marca as cartas que ficaram na mesa.
        </p>
        <p>O valor sai da poupança de quem pagou, na hora, no celular de todo mundo.</p>
      </div>
    ),
  },
  {
    title: "Quanto cada um começa",
    tone: "bg-veg brush text-ink",
    art: <span className="text-6xl">💰</span>,
    body: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-ink/80">Depende de quantos estão na mesa. O app aplica sozinho:</p>
        <div className="grid grid-cols-3 gap-1.5">
          {startingSavingsTable().map((row) => (
            <div key={row.players} className="rounded-xl border-2 border-ink bg-paper px-2 py-1.5">
              <span className="block text-[0.65rem] font-bold uppercase text-ink/60">{row.players} pessoas</span>
              <span className="display block text-lg text-ink">{row.savings}€</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink/65">Quando alguém chega a zero, o jogo acaba e ganha quem tiver mais.</p>
      </div>
    ),
  },
  {
    title: "Como marcar a conta",
    tone: "bg-fish brush text-ink",
    art: (
      <div className="flex items-end justify-center gap-1.5">
        <TableCard tone="MEAT" corner="20€" title="Croquetas" art="🍢" />
        <TableCard tone="FISH" corner="60€" title="Pulpo a la gallega" art="🐙" count={2} />
        <TableCard tone="VEG" corner="40€" title="Tortilla" art="🥔" />
      </div>
    ),
    body: (
      <div className="flex flex-col gap-2 text-sm leading-snug text-ink/80">
        <p>
          Toque em cada carta de tapa que ficou na mesa. Tocou duas vezes, conta duas. Errou, tire no{" "}
          <strong className="text-ink">✕</strong>.
        </p>
        <p>
          Teve <strong className="text-ink">Premium</strong>? Marque a ⭐ na tapa que foi junto: ela vale o dobro.
        </p>
        <p>
          <strong className="text-ink">Plato quemado</strong> desconta 10€ (com Premium, 20€).
        </p>
      </div>
    ),
  },
  {
    title: "Vinho, bolo e gorjeta",
    tone: "bg-wine brush text-ink",
    art: (
      <div className="flex items-end justify-center gap-1.5">
        <TableCard tone="WINE" corner="120€" title="Vino tinto" art="🍷" count={3} />
        <TableCard tone="CAKE" corner="40€" title="Pastel" art="🎂" />
        <TableCard tone="TIP" corner="+10€" title="Propina" art="💶" />
      </div>
    ),
    body: (
      <div className="flex flex-col gap-2 text-sm leading-snug text-ink/80">
        <p>
          Vinho vale pelo conjunto: <Hot>1 = 30€, 2 = 60€, 3 = 120€, 4 = 180€, 5 = 240€</Hot>. A sexta garrafa
          começa outro conjunto.
        </p>
        <p>Bolo de aniversário custa 40€, e o aniversariante não paga.</p>
        <p>Cada gorjeta soma o preço da tapa mais barata da mesa. O app calcula.</p>
      </div>
    ),
  },
  {
    title: "Quem paga quanto",
    tone: "chalkboard text-paper",
    art: <span className="text-6xl">🤝</span>,
    body: (
      <div className="flex flex-col gap-2 text-sm leading-snug text-ink/80">
        <p>
          <strong className="text-ink">Só quem pediu:</strong> paga tudo sozinho.
        </p>
        <p>
          <strong className="text-ink">Meio a meio:</strong> escolhe alguém para pagar metade (menos quem está no
          banheiro ou de aniversário).
        </p>
        <p>
          <strong className="text-ink">Cada um paga:</strong> divide entre todos, tirando quem está no banheiro ou
          de aniversário. Sobrou centavo, fica com quem pediu.
        </p>
        <p className="text-xs text-ink/60">
          Errou? A última conta pode ser corrigida ou desfeita por quem lançou, por quem pagou ou pelo dono da sala.
        </p>
      </div>
    ),
  },
];

export function HowToPlay({ onClose }: HowToPlayProps) {
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const last = step === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/80 p-3 sm:items-center sm:p-4">
      <div className="animate-card-pop flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] border-4 border-ink bg-paper shadow-[0_14px_0_var(--color-ink)]">
        <div className={`shrink-0 border-b-4 border-ink px-4 pb-4 pt-5 text-center ${slide.tone}`}>
          {slide.art}
          <h2 className="display mt-3 text-3xl leading-tight text-balance">{slide.title}</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{slide.body}</div>

        <div className="shrink-0 border-t-2 border-ink/10 px-4 pb-4 pt-3">
          <div className="mb-3 flex items-center justify-center gap-1.5">
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setStep(index)}
                aria-label={`Ir para a parte ${index + 1}: ${item.title}`}
                aria-current={index === step}
                className={`display flex h-7 w-6 items-center justify-center rounded-md border-2 border-ink text-[0.8rem] transition-all duration-200 ${
                  index === step ? "scale-110 bg-orange text-ink" : "bg-paper text-ink/40"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 ? (
              <Button variant="paper" fullWidth onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            ) : null}
            <Button variant={last ? "flame" : "ink"} fullWidth onClick={() => (last ? onClose() : setStep(step + 1))}>
              {last ? "Bora pro bar" : "Saquei"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

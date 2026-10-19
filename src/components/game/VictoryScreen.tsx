"use client";

import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Confetti } from "@/components/fx/Confetti";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Wordmark } from "@/components/ui/Wordmark";
import { sound } from "@/lib/sound";
import type { PlayerView } from "@/types/room";

interface VictoryScreenProps {
  winners: PlayerView[];
  ranked: PlayerView[];
  bars: number;
  meId: string | null;
  canUndo: boolean;
  busy: boolean;
  onUndo: () => void;
  onNewTable: () => void;
}

const cheers = [
  "Ganha quem não paga",
  "Saiu de bar em bar sem abrir a carteira",
  "Mão de vaca profissional",
  "O garçom nem sabe o nome dessa pessoa",
  "Economia de campeão",
  "Comeu, bebeu e saiu rico",
];

export function VictoryScreen({ winners, ranked, bars, meId, canUndo, busy, onUndo, onNewTable }: VictoryScreenProps) {
  const [confirmingUndo, setConfirmingUndo] = useState(false);

  useEffect(() => {
    sound.win();
  }, []);

  const tie = winners.length > 1;
  const champion = winners[0];
  const cheer = cheers[(champion?.name.length ?? 0) % cheers.length];
  const winnerNames = winners.map((person) => (person.id === meId ? "Você" : person.name)).join(" e ");

  return (
    <>
      <Confetti running />

      {confirmingUndo ? (
        <ConfirmModal
          title="Desfazer a última conta?"
          tone="danger"
          busy={busy}
          confirmLabel="Desfazer e voltar"
          cancelLabel="Deixa assim"
          body={<p>A partida reabre no celular de todo mundo e o último bar volta a ficar sem conta.</p>}
          onCancel={() => setConfirmingUndo(false)}
          onConfirm={() => {
            setConfirmingUndo(false);
            onUndo();
          }}
        />
      ) : null}

      <Screen
        footer={
          <div className="flex flex-col gap-2">
            <Button variant="flame" size="lg" fullWidth onClick={onNewTable}>
              Montar outra mesa
            </Button>
            {canUndo ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmingUndo(true)}
                className="display rounded-xl px-3 py-2 text-sm text-ink/55 hover:text-ink"
              >
                Errou a última conta? Desfazer e voltar pro jogo
              </button>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <Wordmark size="sm" />

          <div className="relative flex items-center justify-center py-4">
            <span className="animate-ring-spin absolute h-[17rem] w-[17rem] rounded-full bg-[conic-gradient(from_0deg,var(--color-orange),var(--color-meat),var(--color-wine),var(--color-fish),var(--color-veg),var(--color-orange))] opacity-40 blur-xl" />
            <div className="animate-champion-zoom relative">
              <span className="animate-crown-drop absolute -top-12 left-1/2 z-10 -ml-7 text-6xl" style={{ animationDelay: "900ms" }}>
                👑
              </span>
              <Avatar
                name={champion?.name ?? "Campeão"}
                photo={champion?.avatar ?? null}
                emoji={champion?.emoji ?? null}
                size="hero"
                glow
              />
              <span className="display absolute -right-5 -top-2 rotate-12 rounded-2xl border-4 border-ink bg-gold px-3 py-1 text-2xl text-ink shadow-[0_6px_0_var(--color-ink)]">
                {champion?.savings ?? 0}€
              </span>
            </div>
          </div>

          <h1 className="display text-4xl leading-tight text-balance text-ink">
            {tie ? `Empate: ${winnerNames}` : `${winnerNames} ganhou!`}
          </h1>

          <p className="max-w-[32ch] text-sm font-semibold text-ink/70">
            {tie
              ? `Terminaram com ${champion?.savings ?? 0}€ cada. Pelo manual, desempata quem tiver mais dinheiro de verdade no bolso. Abram as carteiras!`
              : `${cheer}. Terminou com ${champion?.savings ?? 0}€ depois de ${bars} ${bars === 1 ? "bar" : "bares"}.`}
          </p>
        </div>

        <section className="mt-7">
          <h2 className="display mb-3 text-xl text-ink">Como cada um saiu</h2>
          <ul className="flex flex-col gap-2">
            {ranked.map((person, index) => {
              const won = winners.some((winner) => winner.id === person.id);
              const broke = person.savings <= 0;

              return (
                <li
                  key={person.id}
                  className={`flex items-center gap-3 rounded-2xl border-2 border-ink p-2.5 ${
                    won ? "bg-gold" : broke ? "bg-flame-soft" : "bg-paper"
                  }`}
                >
                  <span className="display flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink text-sm text-paper">
                    {index + 1}
                  </span>
                  <Avatar name={person.name} photo={person.avatar} emoji={person.emoji} size="md" />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="display block truncate text-lg text-ink">{person.name}</span>
                    <span className="block text-xs font-semibold text-ink/60">
                      {broke ? "Faliu" : `Pagou ${person.paid}€ no total`}
                    </span>
                  </span>
                  <span className="display shrink-0 text-xl tabular-nums text-ink">{person.savings}€</span>
                </li>
              );
            })}
          </ul>
        </section>
      </Screen>
    </>
  );
}

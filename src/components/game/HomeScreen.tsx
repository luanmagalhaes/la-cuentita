"use client";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Wordmark } from "@/components/ui/Wordmark";
import type { RecentSeat } from "@/lib/session";

interface HomeScreenProps {
  seats: RecentSeat[];
  onResume: (seat: RecentSeat) => void;
  onForget: (code: string) => void;
  onCreate: () => void;
  onJoin: () => void;
  onRules: () => void;
  onHistory: () => void;
}

export function HomeScreen({
  seats,
  onResume,
  onForget,
  onCreate,
  onJoin,
  onRules,
  onHistory,
}: HomeScreenProps) {
  const lastSeat = seats[0];

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center py-6">
        <header className="animate-rise-in mx-auto w-full max-w-sm text-center">
          <Wordmark size="lg" />
          <p className="mx-auto mt-4 max-w-xs text-base leading-relaxed text-ink/70">
            Vocês jogam com as cartas. O app faz a conta de cada bar e descobre quem saiu sem pagar.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {lastSeat ? (
              <div className="animate-rise-in mb-1 rounded-2xl border-2 border-ink bg-aqua p-3.5 text-left">
                <p className="text-xs font-semibold text-ink/75">
                  {`Você estava na sala ${lastSeat.code} como ${lastSeat.name}.`}
                </p>
                <div className="mt-2.5 flex gap-2">
                  <Button variant="ink" fullWidth onClick={() => onResume(lastSeat)}>
                    Voltar pra sala
                  </Button>
                  <Button variant="paper" onClick={() => onForget(lastSeat.code)}>
                    Esquecer
                  </Button>
                </div>
              </div>
            ) : null}

            <Button variant="ink" size="lg" fullWidth onClick={onCreate}>
              Criar sala
            </Button>
            <Button variant="paper" size="lg" fullWidth onClick={onJoin}>
              Entrar em uma sala
            </Button>
            <Button variant="gold" fullWidth onClick={onRules}>
              Como se joga?
            </Button>
            <Button variant="teal" fullWidth onClick={onHistory}>
              Histórico
            </Button>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
            3 a 8 jogadores · Cada um no seu celular
          </p>
        </header>
      </div>
    </Screen>
  );
}

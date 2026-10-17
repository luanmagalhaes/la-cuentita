"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Wordmark } from "@/components/ui/Wordmark";
import { MatchSheet } from "@/components/history/MatchSheet";
import {
  availableMonths,
  currentMonth,
  matchesInMonth,
  monthLabel,
  ranking,
  shortDate,
} from "@/lib/game/history";
import type { MatchRow } from "@/types/history";

const medals = ["🥇", "🥈", "🥉"];
const visibleNames = 3;

function summarizeNames(match: MatchRow): string {
  const names = [...match.players]
    .sort((a, b) => b.savings - a.savings)
    .map((player) => player.name);

  if (names.length <= visibleNames) {
    return names.join(", ");
  }

  return `${names.slice(0, visibleNames).join(", ")} +${names.length - visibleNames}`;
}

export function HistoryScreen({ onBack }: { onBack: () => void }) {
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [openMatch, setOpenMatch] = useState<MatchRow | null>(null);

  useEffect(() => {
    const load = setTimeout(() => {
      void fetch("/api/history")
        .then((response) => response.json())
        .then((body: { matches?: MatchRow[]; error?: string }) => {
          if (body.error) {
            setError(body.error);
            return;
          }

          setMatches(body.matches ?? []);
        })
        .catch(() => setError("Deu ruim aqui. Tente de novo."));
    }, 0);

    return () => clearTimeout(load);
  }, []);

  const months = matches ? availableMonths(matches) : [];
  const selectedMonth = months.includes(month) ? month : (months[0] ?? month);
  const monthMatches = matches ? matchesInMonth(matches, selectedMonth) : [];
  const table = ranking(monthMatches);

  return (
    <Screen
      footer={
        <Button variant="ink" fullWidth onClick={onBack}>
          Voltar
        </Button>
      }
    >
      <header className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="display cursor-pointer rounded-xl px-2 py-1 text-sm text-ink/60 transition-colors hover:text-ink"
          >
            ← Voltar
          </button>
          <Wordmark size="sm" className="opacity-50" />
        </div>
        <h1 className="display text-4xl text-ink">Histórico</h1>
        <p className="mt-2 text-sm text-ink/60">
          Todas as mesas que chegaram ao fim, e quem mais ganhou no mês.
        </p>
      </header>

      {matches === null && !error ? (
        <p className="display text-lg text-ink/60">Carregando</p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border-2 border-ink bg-flame px-4 py-3 text-sm font-semibold text-paper">
          {error}
        </p>
      ) : null}

      {matches !== null && matches.length === 0 ? (
        <div className="rounded-2xl border-2 border-ink bg-paper px-4 py-6 text-center">
          <p className="display text-xl text-ink">Nenhuma partida ainda</p>
          <p className="mt-1 text-sm text-ink/70">
            Termine uma mesa que ela aparece aqui.
          </p>
        </div>
      ) : null}

      {months.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {months.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMonth(item)}
              className={`display rounded-lg border-2 border-ink px-2 py-1 text-xs ${
                item === selectedMonth
                  ? "bg-ink text-paper"
                  : "bg-paper text-ink"
              }`}
            >
              {monthLabel(item)}
            </button>
          ))}
        </div>
      ) : null}

      {table.length > 0 ? (
        <section className="mb-6">
          <h2 className="display mb-2 text-lg text-ink">
            Quem mais ganhou em {monthLabel(selectedMonth)}
          </h2>
          <ol className="flex flex-col gap-1.5">
            {table.map((row, position) => (
              <li
                key={row.name}
                className={`flex items-center gap-2 rounded-2xl border-2 border-ink px-3 py-2 ${
                  position === 0 ? "bg-gold text-ink" : "bg-paper text-ink"
                }`}
              >
                <span className="display w-7 text-center text-lg leading-none">
                  {medals[position] ?? position + 1}
                </span>
                <span className="display flex-1 text-lg leading-none">
                  {row.name}
                </span>
                <span className="text-right text-xs font-semibold leading-tight">
                  {row.wins} {row.wins === 1 ? "vitória" : "vitórias"}
                  <br />
                  <span className="text-ink/60">
                    {row.matches} {row.matches === 1 ? "mesa" : "mesas"} ·{" "}
                    {row.savings}€ no bolso
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {monthMatches.length > 0 ? (
        <section>
          <h2 className="display mb-2 text-lg text-ink">
            As partidas ({monthMatches.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {monthMatches.map((match) => (
              <li key={match.id}>
                <button
                  type="button"
                  onClick={() => setOpenMatch(match)}
                  className="w-full rounded-2xl border-2 border-ink bg-paper p-3 text-left shadow-[0_4px_0_var(--color-ink)] transition-transform duration-100 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-ink)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="display text-xs text-ink/60">
                      {shortDate(match.finished_at)} · mesa {match.room_code}
                    </span>
                    <span className="display text-sm text-ink">
                      {match.winner_names.length > 0 ? match.winner_names.join(" e ") : "sem vencedor"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-ink/70">
                    {summarizeNames(match)}
                  </p>
                  <p className="display mt-1 text-[10px] uppercase tracking-wider text-ink/40">
                    toque para ver a mesa
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {openMatch ? (
        <MatchSheet match={openMatch} onClose={() => setOpenMatch(null)} />
      ) : null}
    </Screen>
  );
}

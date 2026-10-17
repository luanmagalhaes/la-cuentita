"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Screen } from "@/components/ui/Screen";
import { Wordmark } from "@/components/ui/Wordmark";
import { ranked } from "@/lib/game/standings";
import { SplitMode, type BillView, type PlayerView, type RoomRow } from "@/types/room";

interface TableScreenProps {
  room: RoomRow;
  players: PlayerView[];
  bills: BillView[];
  meId: string | null;
  isHost: boolean;
  busy: boolean;
  error: string | null;
  quiet: boolean;
  onQuiet: (next: boolean) => void;
  onLaunchBill: () => void;
  onFixBill: (bill: BillView) => void;
  onUndoBill: (bill: BillView) => void;
  onRemovePlayer: (playerId: string) => void;
  onRules: () => void;
  onLeave: () => void;
}

const splitLabels: Record<SplitMode, string> = {
  SOLO: "pagou sozinho",
  HALF: "rachou meio a meio",
  DUTCH: "vaquinha geral",
};

export function TableScreen({
  room,
  players,
  bills,
  meId,
  isHost,
  busy,
  error,
  quiet,
  onQuiet,
  onLaunchBill,
  onFixBill,
  onUndoBill,
  onRemovePlayer,
  onRules,
  onLeave,
}: TableScreenProps) {
  const [confirmingRemoval, setConfirmingRemoval] = useState<string | null>(null);
  const [confirmingUndo, setConfirmingUndo] = useState<BillView | null>(null);
  const start = room.starting_savings ?? 1;
  const board = ranked(players);
  const latest = bills[bills.length - 1] ?? null;
  const canTouchLatest =
    latest !== null && meId !== null && [latest.created_by, latest.payer_id, room.host_player_id].includes(meId);
  const pendingRemoval = players.find((person) => person.id === confirmingRemoval) ?? null;
  const nameOf = (id: string | null) => {
    if (!id) {
      return "Alguém que saiu";
    }

    if (id === meId) {
      return "Você";
    }

    return players.find((person) => person.id === id)?.name ?? "Alguém que saiu";
  };

  return (
    <Screen
      wide
      footer={
        <div className="flex flex-col gap-2">
          <Button variant="flame" size="lg" fullWidth disabled={busy} onClick={onLaunchBill}>
            Pedi a conta do bar {room.round_number}
          </Button>
          <p className="text-center text-xs font-semibold text-ink/55">
            Quem pediu a conta toca aqui e marca as cartas da mesa
          </p>
        </div>
      }
    >
      {pendingRemoval ? (
        <ConfirmModal
          title={`Tirar ${pendingRemoval.name} da mesa?`}
          tone="danger"
          busy={busy}
          confirmLabel="Tirar da mesa"
          cancelLabel="Deixa quieto"
          body={
            <p>
              <strong className="text-ink">{pendingRemoval.name}</strong> sai da partida na hora e não volta mais
              para esta sala. O que essa pessoa pagou sai das contas.
            </p>
          }
          onCancel={() => setConfirmingRemoval(null)}
          onConfirm={() => {
            onRemovePlayer(pendingRemoval.id);
            setConfirmingRemoval(null);
          }}
        />
      ) : null}

      {confirmingUndo ? (
        <ConfirmModal
          title={`Desfazer a conta do bar ${confirmingUndo.round_number}?`}
          tone="danger"
          busy={busy}
          confirmLabel="Desfazer"
          cancelLabel="Deixa"
          body={
            <p>
              Os {confirmingUndo.total}€ voltam para quem pagou e o jogo volta para o bar{" "}
              {confirmingUndo.round_number}.
            </p>
          }
          onCancel={() => setConfirmingUndo(null)}
          onConfirm={() => {
            onUndoBill(confirmingUndo);
            setConfirmingUndo(null);
          }}
        />
      ) : null}

      <header className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onLeave}
          className="display rounded-xl px-2 py-1 text-base text-ink/60 transition-colors hover:text-ink"
        >
          ← Sair
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onQuiet(!quiet)}
            className="rounded-full border-2 border-ink bg-paper px-2.5 py-1 text-xs font-bold text-ink"
          >
            {quiet ? "Som off" : "Som on"}
          </button>
          <button
            type="button"
            onClick={onRules}
            className="rounded-full border-2 border-ink bg-paper px-2.5 py-1 text-xs font-bold text-ink"
          >
            Regras
          </button>
          <Wordmark size="sm" className="hidden opacity-60 sm:inline-block" />
        </div>
      </header>

      <div className="stage-orange mb-5 flex items-center justify-between gap-3 rounded-3xl border-[3px] border-ink px-4 py-3 shadow-[0_6px_0_var(--color-ink)]">
        <div>
          <span className="block text-xs font-bold uppercase tracking-[0.18em] text-ink/70">Agora no</span>
          <span className="display block text-4xl leading-none text-ink">Bar {room.round_number}</span>
        </div>
        <div className="sign display px-3 py-1.5 text-center text-sm leading-tight text-ink">
          sala {room.code}
          <span className="block text-[0.65rem] font-sans font-bold text-ink/60">começou com {start}€</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="display mb-2 text-2xl text-ink">Poupança</h2>
          <ul className="flex flex-col gap-2">
            {board.map((person, index) => {
              const left = Math.max(0, Math.min(100, (person.savings / start) * 100));
              const danger = left < 25;

              return (
                <li
                  key={person.id}
                  className={`flex items-center gap-3 rounded-2xl border-2 border-ink p-2.5 ${
                    person.id === meId ? "bg-gold/40" : "bg-paper"
                  }`}
                >
                  <span className="display flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-sm text-paper">
                    {index + 1}
                  </span>
                  <Avatar name={person.name} photo={person.avatar} emoji={person.emoji} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="display truncate text-lg text-ink">{person.name}</span>
                      {person.id === meId ? (
                        <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[0.55rem] font-bold text-paper">
                          VOCÊ
                        </span>
                      ) : null}
                      {person.id === room.host_player_id ? <span className="shrink-0 text-xs">👑</span> : null}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink/12">
                        <span
                          className={`block h-full rounded-full transition-[width] duration-700 ${danger ? "bg-flame" : "bg-veg"}`}
                          style={{ width: `${left}%` }}
                        />
                      </span>
                      <span className="shrink-0 text-[0.65rem] font-semibold text-ink/55">pagou {person.paid}€</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span
                      key={person.savings}
                      className={`display animate-score-bump text-2xl tabular-nums ${danger ? "text-flame" : "text-ink"}`}
                    >
                      {person.savings}€
                    </span>
                    {isHost && person.id !== meId ? (
                      <button
                        type="button"
                        onClick={() => setConfirmingRemoval(person.id)}
                        disabled={busy}
                        className="rounded-lg px-1.5 text-[0.65rem] font-bold text-ink/40 hover:bg-flame hover:text-paper"
                      >
                        Tirar
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
          {error ? (
            <p className="mt-3 rounded-2xl border-2 border-ink bg-flame-soft p-3 text-sm font-semibold text-ink">{error}</p>
          ) : null}
        </section>

        <section>
          <h2 className="display mb-2 text-2xl text-ink">Contas da noite</h2>
          {bills.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-ink/30 p-5 text-center text-sm font-semibold text-ink/50">
              Ninguém pagou nada ainda. Aproveitem enquanto dura.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {[...bills].reverse().map((bill) => {
                const isLatest = bill.id === latest?.id;

                return (
                  <li key={bill.id} className="rounded-2xl border-2 border-ink bg-paper p-3">
                    <div className="flex items-center gap-3">
                      <span className="display flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-orange text-[0.6rem] leading-none text-ink">
                        BAR
                        <span className="text-base">{bill.round_number}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="display block truncate text-base text-ink">{nameOf(bill.payer_id)}</span>
                        <span className="block text-xs font-semibold text-ink/55">
                          {bill.split_mode === SplitMode.Solo
                            ? splitLabels.SOLO
                            : `${splitLabels[bill.split_mode]} · ${bill.shares
                                .map((share) => `${nameOf(share.player_id)} ${share.amount}€`)
                                .join(", ")}`}
                        </span>
                      </span>
                      <span className="display shrink-0 text-xl text-flame">{bill.total}€</span>
                    </div>
                    {isLatest && canTouchLatest ? (
                      <div className="mt-2 flex gap-2">
                        <Button variant="paper" fullWidth disabled={busy} onClick={() => onFixBill(bill)}>
                          Corrigir
                        </Button>
                        <Button variant="paper" fullWidth disabled={busy} onClick={() => setConfirmingUndo(bill)}>
                          Desfazer
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Screen>
  );
}

"use client";

import { useEffect, useEffectEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { sound } from "@/lib/sound";
import { SplitMode, type BillView, type PlayerView } from "@/types/room";

interface BillSlamProps {
  bill: BillView;
  players: PlayerView[];
  meId: string | null;
  onDone: () => void;
}

const soloJeers = [
  "Hoje é por sua conta",
  "O Bar Manolo agradece a preferência",
  "Pediu, pagou",
  "Faz um pix pro garçom aí",
  "Quem mandou pedir rabo de toro?",
  "Sua carteira pediu demissão",
  "Mais um bar desses e é miojo o mês todo",
  "Obrigado pela rodada, patrocinador!",
  "Vai lavar prato pra pagar?",
  "O garçom já te chama pelo nome",
  "Cartão aprovado. Dignidade recusada.",
  "Generosidade que ninguém pediu",
];

const halfJeers = [
  "Achou um sócio pro prejuízo",
  "Dor dividida, mas ainda dói",
  "Meio a meio, sofrimento inteiro",
];

const dutchJeers = ["Vaquinha aprovada", "Socializaram o prejuízo", "Ninguém escapou dessa"];

const freeJeers = ["Saiu de graça! Que sorte indecente", "Os pratos queimados pagaram a conta"];

const coins = Array.from({ length: 14 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  dx: `${((index * 53) % 60) - 30}px`,
  spin: `${((index * 97) % 540) - 270}deg`,
  delay: `${(index * 130) % 900}ms`,
  face: index % 3 === 0 ? "💸" : "🪙",
}));

function pick<T>(list: readonly T[], seed: string): T {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return list[hash % list.length];
}

function euros(value: number): string {
  return `${value < 0 ? "−" : ""}${Math.abs(value)}€`;
}

export function BillSlam({ bill, players, meId, onDone }: BillSlamProps) {
  const finish = useEffectEvent(onDone);
  const free = bill.total === 0;
  const payer = players.find((person) => person.id === bill.payer_id) ?? null;
  const sharers = bill.shares
    .map((share) => ({ share, person: players.find((person) => person.id === share.player_id) ?? null }))
    .filter((item) => item.person !== null) as Array<{ share: BillView["shares"][number]; person: PlayerView }>;
  const partner = sharers.find((item) => item.person.id !== bill.payer_id)?.person ?? null;
  const mode = bill.split_mode;
  const stamp = free ? "DE GRAÇA!" : mode === SplitMode.Half ? "RACHOU!" : mode === SplitMode.Dutch ? "VAQUINHA!" : "PAGOU!";
  const jeer = free
    ? pick(freeJeers, bill.id)
    : mode === SplitMode.Half
      ? pick(halfJeers, bill.id)
      : mode === SplitMode.Dutch
        ? pick(dutchJeers, bill.id)
        : pick(soloJeers, bill.id);
  const breakdown = bill.detail.breakdown;
  const lines = [
    { label: "Tapas", value: breakdown.tapas },
    { label: "Premium", value: breakdown.premiumBonus },
    { label: "Vinho", value: breakdown.wine },
    { label: "Queimados", value: breakdown.burnt },
    { label: "Bolo", value: breakdown.cake },
    { label: "Gorjeta", value: breakdown.tips },
  ].filter((line) => line.value !== 0);
  const payerName = payer ? (payer.id === meId ? "Você" : payer.name) : "Alguém";

  useEffect(() => {
    let timer = 0;

    function begin() {
      document.removeEventListener("visibilitychange", wake);

      if (free) {
        sound.lucky();
      } else {
        sound.register();
        sound.sadTrombone();
      }

      timer = window.setTimeout(() => finish(), 4200);
    }

    function wake() {
      if (document.visibilityState === "visible") {
        begin();
      }
    }

    if (document.visibilityState === "visible") {
      begin();
    } else {
      document.addEventListener("visibilitychange", wake);
    }

    return () => {
      document.removeEventListener("visibilitychange", wake);
      window.clearTimeout(timer);
    };
  }, [free]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Fechar a animação"
      className="fixed inset-0 z-[96] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-ink/85 px-6 text-center"
    >
      {free
        ? null
        : coins.map((coin, index) => (
            <span
              key={index}
              className="animate-coin-fall pointer-events-none absolute top-0 text-3xl"
              style={{
                left: coin.left,
                animationDelay: coin.delay,
                ["--dx" as string]: coin.dx,
                ["--spin" as string]: coin.spin,
              }}
            >
              {coin.face}
            </span>
          ))}

      <div className="relative flex items-end justify-center gap-3">
        {mode === SplitMode.Dutch && !free ? (
          <div className="flex max-w-xs flex-wrap justify-center gap-2">
            {sharers.map(({ person }) => (
              <span key={person.id} className="animate-shake-hard">
                <Avatar name={person.name} photo={person.avatar} emoji={person.emoji} size="lg" className="animate-gray-out" />
              </span>
            ))}
          </div>
        ) : (
          <>
            <span className={free ? "animate-champion-zoom" : "animate-shake-hard"}>
              <Avatar
                name={payer?.name ?? "?"}
                photo={payer?.avatar ?? null}
                emoji={payer?.emoji ?? null}
                size="xl"
                className={free ? "" : "animate-gray-out"}
              />
            </span>
            {mode === SplitMode.Half && partner && !free ? (
              <span className="animate-shake-hard">
                <Avatar name={partner.name} photo={partner.avatar} emoji={partner.emoji} size="lg" className="animate-gray-out" />
              </span>
            ) : null}
          </>
        )}

        <span
          className={`display animate-stamp-in absolute -bottom-4 rounded-2xl border-[5px] px-5 py-1 text-5xl shadow-[0_8px_0_var(--color-ink)] ${
            free ? "border-veg-deep bg-paper text-veg-deep" : "border-flame bg-paper text-flame"
          }`}
          style={{ animationDelay: "450ms" }}
        >
          {stamp}
        </span>
      </div>

      <p className="display mt-9 text-2xl leading-tight text-paper">
        {mode === SplitMode.Half && partner
          ? `${payerName} e ${partner.id === meId ? "você" : partner.name}`
          : mode === SplitMode.Dutch
            ? "Todo mundo junto"
            : payerName}
      </p>

      <div className="relative mt-3 max-h-[40vh] w-64 overflow-hidden">
        <div className="animate-receipt-unroll rounded-b-md bg-paper px-4 pb-3 pt-2 text-left font-mono text-xs text-ink shadow-[0_8px_0_rgba(0,0,0,0.35)]">
          <p className="text-center font-bold tracking-[0.2em]">BAR {bill.round_number}</p>
          {lines.map((line) => (
            <p key={line.label} className="flex justify-between border-b border-dashed border-ink/25 py-0.5">
              <span>{line.label}</span>
              <span>{euros(line.value)}</span>
            </p>
          ))}
          <p className="mt-1 flex justify-between text-base font-bold">
            <span>TOTAL</span>
            <span className={free ? "text-veg-deep" : "text-flame"}>{euros(bill.total)}</span>
          </p>
          {mode !== SplitMode.Solo && !free ? (
            <p className="mt-1 text-[0.65rem] opacity-70">
              {sharers.map(({ share, person }) => `${person.name} ${share.amount}€`).join(" · ")}
            </p>
          ) : null}
        </div>
      </div>

      <p className="animate-rise-in mt-4 rounded-xl bg-paper px-3 py-1.5 text-sm font-bold text-ink" style={{ animationDelay: "900ms" }}>
        {jeer}
      </p>
      <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-paper/50">Toque para fechar</p>
    </button>
  );
}

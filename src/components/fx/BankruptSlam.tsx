"use client";

import { useEffect, useEffectEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { sound } from "@/lib/sound";
import type { PlayerView } from "@/types/room";

interface BankruptSlamProps {
  broke: PlayerView[];
  meId: string | null;
  onDone: () => void;
}

const jeers = [
  "Faliu bonito",
  "A poupança foi pro saco",
  "Agora é fiado",
  "Nem o garçom quer mais",
  "Vendeu o rim pra pagar a conta",
  "A carteira virou casa de traça",
];

const moths = Array.from({ length: 9 }, (_, index) => ({
  dx: `${((index * 71) % 220) - 110}px`,
  spin: `${((index * 43) % 120) - 60}deg`,
  delay: `${500 + index * 140}ms`,
}));

export function BankruptSlam({ broke, meId, onDone }: BankruptSlamProps) {
  const finish = useEffectEvent(onDone);
  const first = broke[0];
  const names = broke
    .map((person, index) => (person.id === meId ? (index === 0 ? "Você" : "você") : person.name))
    .join(" e ");
  const jeer = jeers[(first?.name.length ?? 0) % jeers.length];

  useEffect(() => {
    let timer = 0;

    function begin() {
      document.removeEventListener("visibilitychange", wake);
      sound.bankrupt();
      timer = window.setTimeout(() => finish(), 4000);
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
  }, []);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Ver quem ganhou"
      className="chalkboard fixed inset-0 z-[97] flex cursor-pointer flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      <div className="relative">
        <div className="flex flex-wrap justify-center gap-3">
          {broke.map((person) => (
            <span key={person.id} className="animate-shake-hard">
              <Avatar name={person.name} photo={person.avatar} emoji={person.emoji} size="xl" className="animate-gray-out" />
            </span>
          ))}
        </div>
        <span
          className="display animate-stamp-in absolute -bottom-5 left-1/2 -ml-[5.5rem] w-44 rounded-2xl border-[5px] border-flame bg-paper py-1 text-5xl text-flame shadow-[0_8px_0_#000]"
          style={{ animationDelay: "350ms" }}
        >
          FALIU!
        </span>
      </div>

      <div className="relative mt-12 flex h-20 w-full items-end justify-center">
        <span className="animate-wobble text-6xl">👛</span>
        {moths.map((moth, index) => (
          <span
            key={index}
            className="animate-moth-fly pointer-events-none absolute bottom-6 text-2xl"
            style={{
              animationDelay: moth.delay,
              ["--dx" as string]: moth.dx,
              ["--spin" as string]: moth.spin,
            }}
          >
            🦋
          </span>
        ))}
      </div>

      <p className="display mt-6 text-3xl leading-tight text-paper">
        {names} {broke.length > 1 ? "zeraram" : "zerou"} a poupança
      </p>
      <p className="animate-rise-in mt-3 rounded-xl bg-paper px-3 py-1.5 text-sm font-bold text-ink" style={{ animationDelay: "900ms" }}>
        {jeer}
      </p>
      <p className="mt-6 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-paper/50">
        O jogo acabou · toque para ver quem ganhou
      </p>
    </button>
  );
}

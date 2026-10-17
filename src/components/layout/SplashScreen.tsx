"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/ui/Wordmark";

const holdMs = 1850;
const fadeMs = 620;

const fan = [
  { value: 9, turn: -54, skin: "bg-teal text-paper" },
  { value: 3, turn: -36, skin: "bg-rose text-ink" },
  { value: 11, turn: -18, skin: "bg-royal text-paper" },
  { value: 7, turn: 0, skin: "bg-gold text-ink" },
  { value: 5, turn: 18, skin: "bg-flame text-paper" },
  { value: 8, turn: 36, skin: "bg-aqua text-ink" },
  { value: 12, turn: 54, skin: "bg-navy text-paper" },
];

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const start = window.setTimeout(() => setLeaving(true), holdMs);

    return () => window.clearTimeout(start);
  }, []);

  useEffect(() => {
    if (!leaving) {
      return;
    }

    const finish = window.setTimeout(onDone, fadeMs);

    return () => window.clearTimeout(finish);
  }, [leaving, onDone]);

  return (
    <div
      className={`stage-foil fixed inset-0 z-[95] flex flex-col items-center justify-center gap-10 overflow-hidden px-8 ${
        leaving ? "animate-curtain-out" : ""
      }`}
    >
      <div className="relative flex h-44 w-full items-end justify-center">
        <span className="animate-halo-pulse absolute bottom-6 h-28 w-28 rounded-full bg-paper/55" />

        {fan.map((card, index) => (
          <span
            key={card.value}
            className={`animate-fan-out absolute bottom-0 inline-flex h-[6.2rem] w-[4.3rem] origin-bottom flex-col items-center justify-center rounded-xl border-[3px] border-ink shadow-[0_4px_0_var(--color-ink)] ${card.skin}`}
            style={{
              ["--turn" as string]: `${card.turn}deg`,
              animationDelay: `${index * 80}ms`,
              zIndex: 10 - Math.abs(index - 3),
            }}
          >
            <span className="display text-3xl leading-none">{card.value}</span>
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 overflow-hidden">
        <Wordmark size="lg" className="animate-rise-in" />
        <p
          className="animate-rise-in text-xs font-semibold uppercase tracking-[0.28em] text-ink/60"
          style={{ animationDelay: "180ms" }}
        >
          Contando os pontos
        </p>
      </div>
    </div>
  );
}

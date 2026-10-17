"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Wordmark } from "@/components/ui/Wordmark";

const holdMs = 2100;
const fadeMs = 620;

const lines = [
  { label: "Croquetas", price: "20€" },
  { label: "Pulpo a la gallega", price: "60€" },
  { label: "Vino tinto ×3", price: "120€" },
  { label: "Plato quemado", price: "−10€" },
];

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [leaving, setLeaving] = useState(false);
  const finish = useEffectEvent(onDone);

  useEffect(() => {
    const start = window.setTimeout(() => setLeaving(true), holdMs);

    return () => window.clearTimeout(start);
  }, []);

  useEffect(() => {
    if (!leaving) {
      return;
    }

    const done = window.setTimeout(() => finish(), fadeMs);

    return () => window.clearTimeout(done);
  }, [leaving]);

  return (
    <div
      className={`stage-orange fixed inset-0 z-[95] flex flex-col items-center justify-center gap-8 overflow-hidden px-8 ${
        leaving ? "animate-curtain-out" : ""
      }`}
    >
      <div className="relative h-56 w-60 overflow-hidden">
        <div className="animate-receipt-unroll absolute inset-x-0 top-0 rounded-b-md bg-paper px-4 pb-4 pt-3 font-mono text-[0.72rem] text-ink shadow-[0_8px_0_rgba(42,27,18,0.35)]">
          <p className="text-center font-bold tracking-[0.2em]">BAR MANOLO</p>
          <p className="mb-2 text-center opacity-60">mesa 7 · 4 pessoas</p>
          {lines.map((line, index) => (
            <p
              key={line.label}
              className="animate-rise-in flex justify-between border-b border-dashed border-ink/25 py-1"
              style={{ animationDelay: `${450 + index * 160}ms` }}
            >
              <span>{line.label}</span>
              <span>{line.price}</span>
            </p>
          ))}
          <p
            className="animate-rise-in mt-2 flex justify-between text-sm font-bold"
            style={{ animationDelay: "1150ms" }}
          >
            <span>TOTAL</span>
            <span className="text-flame">quem paga?</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Wordmark size="lg" className="animate-card-pop" />
        <p
          className="animate-rise-in text-xs font-semibold uppercase tracking-[0.28em] text-ink/70"
          style={{ animationDelay: "260ms" }}
        >
          Ganha quem não paga
        </p>
      </div>
    </div>
  );
}

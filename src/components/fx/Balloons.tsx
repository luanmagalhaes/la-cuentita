"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

const balloonColors = [
  "var(--color-flame)",
  "var(--color-gold)",
  "var(--color-teal)",
  "var(--color-rose)",
  "var(--color-royal)",
  "var(--color-veg)",
  "var(--color-grape)",
];

const balloonCount = 13;
const longestLife = 3300;

interface Balloon {
  left: number;
  drift: number;
  life: number;
  sway: number;
  delay: number;
  width: number;
  color: string;
}

function makeBalloons(): Balloon[] {
  return Array.from({ length: balloonCount }, (_, index) => ({
    left: 2 + (index * 96) / balloonCount + Math.random() * 5,
    drift: (Math.random() - 0.5) * 80,
    life: 2100 + Math.random() * 700,
    sway: 1400 + Math.random() * 900,
    delay: Math.random() * 420,
    width: 38 + Math.random() * 26,
    color: balloonColors[index % balloonColors.length],
  }));
}

function quietMotion(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Balloons() {
  const [quiet] = useState(quietMotion);
  const [gone, setGone] = useState(false);
  const balloons = useMemo(() => makeBalloons(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setGone(true), longestLife);

    return () => window.clearTimeout(timer);
  }, []);

  if (quiet || gone) {
    return null;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {balloons.map((balloon, index) => (
        <span
          key={index}
          className="animate-balloon-rise gpu absolute bottom-0"
          style={
            {
              left: `${balloon.left}%`,
              "--drift": `${balloon.drift}px`,
              "--life": `${balloon.life}ms`,
              animationDelay: `${balloon.delay}ms`,
            } as CSSProperties
          }
        >
          <span
            className="animate-balloon-sway block origin-bottom"
            style={{ "--sway": `${balloon.sway}ms` } as CSSProperties}
          >
            <svg width={balloon.width} height={balloon.width * 1.7} viewBox="0 0 40 68" fill="none" focusable="false">
              <ellipse cx="20" cy="22" rx="16" ry="20" fill={balloon.color} />
              <ellipse cx="20" cy="22" rx="16" ry="20" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
              <ellipse cx="13" cy="14" rx="4" ry="6" fill="var(--color-paper)" opacity="0.45" />
              <path
                d="M20 41 l-4.5 6 h9 z"
                fill={balloon.color}
                stroke="var(--color-ink)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M20 48 q7 7 0 13 q-7 6 0 7"
                stroke="var(--color-ink)"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
                opacity="0.55"
              />
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
}

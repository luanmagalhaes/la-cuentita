"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface CardRailProps {
  children: ReactNode;
}

const fade = 28;

export function CardRail({ children }: CardRailProps) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = () => {
    const element = rail.current;

    if (!element) {
      return;
    }

    setEdges({
      start: element.scrollLeft > 4,
      end: element.scrollLeft + element.clientWidth < element.scrollWidth - 4,
    });
  };

  useEffect(() => {
    const element = rail.current;

    if (!element) {
      return;
    }

    const watcher = new ResizeObserver(() => {
      setEdges({
        start: element.scrollLeft > 4,
        end: element.scrollLeft + element.clientWidth < element.scrollWidth - 4,
      });
    });

    watcher.observe(element);

    return () => watcher.disconnect();
  }, []);

  const nudge = (direction: number) => {
    const element = rail.current;

    element?.scrollBy({ left: direction * element.clientWidth * 0.75, behavior: "smooth" });
  };

  const mask = `linear-gradient(to right, transparent 0, #000 ${edges.start ? fade : 0}px, #000 calc(100% - ${
    edges.end ? fade : 0
  }px), transparent 100%)`;

  return (
    <div className="relative">
      <div
        ref={rail}
        onScroll={measure}
        className="no-scrollbar flex snap-x snap-mandatory scroll-px-1 gap-2 overflow-x-auto scroll-smooth px-1 pb-2 pt-1 [&>*]:snap-start"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {children}
      </div>
      {edges.start ? <Arrow side="left" onTap={() => nudge(-1)} /> : null}
      {edges.end ? <Arrow side="right" onTap={() => nudge(1)} /> : null}
    </div>
  );
}

function Arrow({ side, onTap }: { side: "left" | "right"; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={side === "left" ? "Ver cartas anteriores" : "Ver mais cartas"}
      className={`display absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-paper text-2xl leading-none text-ink shadow-[0_3px_0_var(--color-ink)] transition-transform active:scale-90 ${
        side === "left" ? "-left-1" : "-right-1"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}

import type { ReactNode } from "react";

export type CardTone = "MEAT" | "FISH" | "VEG" | "WINE" | "BURNT" | "PREMIUM" | "CAKE" | "TIP";

type CardSize = "sm" | "md";

interface TableCardProps {
  tone: CardTone;
  corner: string;
  title: string;
  art: ReactNode;
  size?: CardSize;
  count?: number;
  muted?: boolean;
  onTap?: () => void;
  label?: string;
}

const faces: Record<CardTone, string> = {
  MEAT: "bg-meat brush text-ink",
  FISH: "bg-fish brush text-ink",
  VEG: "bg-veg brush text-ink",
  WINE: "bg-wine brush text-ink",
  BURNT: "chalkboard text-paper",
  PREMIUM: "chalkboard text-paper",
  CAKE: "bg-cake brush text-ink",
  TIP: "chalkboard text-paper",
};

const frames: Record<CardTone, string> = {
  MEAT: "border-meat-deep/60",
  FISH: "border-fish-deep/60",
  VEG: "border-veg-deep/60",
  WINE: "border-wine-deep/60",
  BURNT: "border-paper/40",
  PREMIUM: "border-gold/60",
  CAKE: "border-flame-soft/70",
  TIP: "border-paper/40",
};

const sizes: Record<CardSize, { card: string; corner: string; title: string; art: string; plate: string }> = {
  sm: {
    card: "h-[5.6rem] w-[4rem]",
    corner: "text-[0.8rem] px-1.5 pb-0.5 pt-0.5 rounded-br-[14px]",
    title: "text-[0.42rem]",
    art: "text-[1.45rem]",
    plate: "h-10 w-10",
  },
  md: {
    card: "h-[7.4rem] w-[5.3rem]",
    corner: "text-base px-2 pb-1 pt-0.5 rounded-br-[18px]",
    title: "text-[0.55rem]",
    art: "text-[2rem]",
    plate: "h-14 w-14",
  },
};

export function TableCard({
  tone,
  corner,
  title,
  art,
  size = "sm",
  count = 0,
  muted = false,
  onTap,
  label,
}: TableCardProps) {
  const scale = sizes[size];
  const chalk = tone === "BURNT" || tone === "PREMIUM" || tone === "TIP";
  const body = (
    <span
      className={`relative flex shrink-0 flex-col overflow-hidden rounded-[13px] border-[3px] border-black shadow-[0_3px_0_rgba(42,27,18,0.85)] ${scale.card} ${faces[tone]} ${
        muted ? "opacity-45" : ""
      }`}
    >
      <span className={`pointer-events-none absolute inset-[3px] rounded-[9px] border ${frames[tone]}`} />
      <span
        className={`display absolute left-0 top-0 z-10 leading-none ${scale.corner} ${
          chalk ? "bg-paper/95 text-ink" : "bg-paper text-ink"
        }`}
      >
        {corner}
      </span>
      <span
        className={`absolute right-1 top-1 z-10 max-w-[58%] text-right font-bold uppercase leading-[1.05] tracking-wide ${scale.title}`}
      >
        {title}
      </span>
      <span className="flex flex-1 items-center justify-center pt-3">
        <span
          className={`flex items-center justify-center rounded-full ${scale.plate} ${
            chalk
              ? "border-2 border-dashed border-paper/70"
              : "border-[3px] border-dotted border-tile bg-paper shadow-[inset_0_0_0_2px_#fffaf0,inset_0_0_0_4px_rgba(63,98,173,0.25)]"
          }`}
        >
          <span className={`leading-none ${scale.art}`}>{art}</span>
        </span>
      </span>
      {count > 0 ? (
        <span className="display animate-tap-bounce absolute bottom-1 right-1 z-20 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-black bg-flame px-1 text-xs text-paper">
          ×{count}
        </span>
      ) : null}
    </span>
  );

  if (!onTap) {
    return body;
  }

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={label ?? `${title} ${corner}`}
      className="shrink-0 rounded-[13px] transition-transform duration-100 active:scale-95"
    >
      {body}
    </button>
  );
}

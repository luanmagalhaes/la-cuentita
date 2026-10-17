import { initialsFor } from "@/lib/photo";

type AvatarSize = "sm" | "md" | "lg" | "xl" | "hero";

interface AvatarProps {
  name: string;
  photo: string | null;
  emoji?: string | null;
  size?: AvatarSize;
  className?: string;
  glow?: boolean;
}

const emojiSizes: Record<AvatarSize, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-7xl",
  hero: "text-8xl",
};

const sizes: Record<AvatarSize, string> = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-36 w-36 text-4xl sm:h-44 sm:w-44",
  hero: "h-52 w-52 text-6xl sm:h-64 sm:w-64",
};

export function Avatar({
  name,
  photo,
  emoji = null,
  size = "md",
  className = "",
  glow = false,
}: AvatarProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-ink bg-sky ${sizes[size]} ${className}`}
    >
      {photo ? (
        <img src={photo} alt={name} className="h-full w-full object-cover" />
      ) : emoji ? (
        <span className={`leading-none ${emojiSizes[size]}`}>{emoji}</span>
      ) : (
        <span className="display text-ink">{initialsFor(name)}</span>
      )}

      {glow ? (
        <span className="animate-halo-pulse pointer-events-none absolute inset-0 rounded-2xl ring-4 ring-gold" />
      ) : null}
    </span>
  );
}

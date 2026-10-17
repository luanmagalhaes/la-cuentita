type WordmarkSize = "sm" | "md" | "lg";

interface WordmarkProps {
  size?: WordmarkSize;
  className?: string;
}

const sizes: Record<WordmarkSize, string> = {
  sm: "text-xl",
  md: "text-4xl px-5 py-2 sm:text-5xl",
  lg: "text-5xl px-6 py-3 sm:text-7xl",
};

export function Wordmark({ size = "md", className = "" }: WordmarkProps) {
  if (size === "sm") {
    return (
      <span className={`display inline-block leading-none text-ink ${sizes.sm} ${className}`}>
        La Cuentita
      </span>
    );
  }

  return (
    <span
      className={`sign display inline-flex flex-col items-center leading-none text-ink shadow-[0_6px_0_var(--color-ink)] ${sizes[size]} ${className}`}
    >
      <span className="text-[0.42em] tracking-[0.12em]">LA</span>
      <span className="-mt-[0.05em]">Cuentita</span>
    </span>
  );
}

type WordmarkSize = "sm" | "md" | "lg";

interface WordmarkProps {
  size?: WordmarkSize;
  className?: string;
}

const sizes: Record<WordmarkSize, string> = {
  sm: "text-lg sm:text-xl",
  md: "text-3xl sm:text-5xl",
  lg: "text-4xl sm:text-7xl",
};

export function Wordmark({ size = "md", className = "" }: WordmarkProps) {
  return (
    <span
      className={`display foil-text animate-foil-shift inline-block max-w-full leading-none ${sizes[size]} ${className}`}
      style={{ paddingBottom: "0.08em" }}
    >
      La Cuentita
    </span>
  );
}

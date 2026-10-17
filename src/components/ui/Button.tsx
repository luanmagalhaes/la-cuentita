import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "ink" | "gold" | "flame" | "paper" | "teal";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  ink: "bg-ink text-paper ring-2 ring-ink shadow-[0_5px_0_#0d1040] hover:bg-navy hover:shadow-[0_7px_0_#0d1040] active:shadow-[0_2px_0_#0d1040]",
  gold: "bg-gold text-ink ring-2 ring-ink shadow-[0_5px_0_var(--color-ink)] hover:bg-gold-deep hover:shadow-[0_7px_0_var(--color-ink)] active:shadow-[0_2px_0_var(--color-ink)]",
  flame:
    "bg-flame text-paper ring-2 ring-ink shadow-[0_5px_0_var(--color-ink)] hover:bg-flame-soft hover:text-ink hover:shadow-[0_7px_0_var(--color-ink)] active:shadow-[0_2px_0_var(--color-ink)]",
  paper:
    "bg-paper text-ink ring-2 ring-ink shadow-[0_5px_0_var(--color-ink)] hover:bg-cream hover:shadow-[0_7px_0_var(--color-ink)] active:shadow-[0_2px_0_var(--color-ink)]",
  teal: "bg-teal text-paper ring-2 ring-ink shadow-[0_5px_0_var(--color-ink)] hover:bg-aqua hover:text-ink hover:shadow-[0_7px_0_var(--color-ink)] active:shadow-[0_2px_0_var(--color-ink)]",
};

const sizes: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3.5 text-base",
};

export function Button({
  children,
  variant = "gold",
  size = "md",
  fullWidth = false,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`display rounded-2xl transition-all duration-150 hover:-translate-y-[2px] active:translate-y-[2px] disabled:opacity-40 disabled:hover:translate-y-0 ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

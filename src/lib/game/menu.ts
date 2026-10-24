import { tapaPrices } from "@/lib/game/rules";
import { TapaKind } from "@/types/room";

export interface Dish {
  kind: TapaKind;
  price: number;
  name: string | null;
  emoji: string;
}

export const kindLabels: Record<TapaKind, string> = {
  MEAT: "Carne",
  FISH: "Peixe",
  VEG: "Verdura",
};

export const kindOrder: readonly TapaKind[] = [TapaKind.Meat, TapaKind.Fish, TapaKind.Veg];

const knownDishes: Record<TapaKind, Partial<Record<number, string>>> = {
  MEAT: { 10: "Chorizo", 20: "Croquetas", 30: "Albóndigas", 70: "Rabo de toro" },
  FISH: {
    10: "Mejillones",
    20: "Sardinas fritas",
    30: "Calamares a la romana",
    60: "Pulpo a la gallega",
    70: "Gambas al ajillo",
  },
  VEG: { 20: "Gazpacho", 40: "Tortilla de patatas", 60: "Ensaladilla rusa" },
};

const dishEmoji: Record<TapaKind, Record<number, string>> = {
  MEAT: { 10: "🌭", 20: "🍢", 30: "🧆", 40: "🍗", 50: "🥩", 60: "🥓", 70: "🍖", 100: "🐖" },
  FISH: { 10: "🦪", 20: "🐟", 30: "🦑", 40: "🐠", 50: "🦀", 60: "🐙", 70: "🍤", 100: "🦞" },
  VEG: { 10: "🫒", 20: "🍅", 30: "🌶️", 40: "🥔", 50: "🍄", 60: "🥗", 70: "🥘", 100: "🫑" },
};

export function dishFor(kind: TapaKind, price: number): Dish {
  return {
    kind,
    price,
    name: knownDishes[kind][price] ?? null,
    emoji: dishEmoji[kind][price] ?? "🍽️",
  };
}

export function menuFor(kind: TapaKind): Dish[] {
  return tapaPrices.map((price) => dishFor(kind, price));
}

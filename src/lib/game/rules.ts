import { maxPlayers, minPlayers } from "@/lib/game/limits";

export const tapaPrices = [10, 20, 30, 40, 50, 60, 70] as const;
export const burntValues = [10, 20, 50, 70] as const;
export const cakeValue = 40;
export const wineSetSize = 5;
export const wineSetTotals = [0, 30, 60, 120, 180, 240] as const;
export const savingsStep = 100;
export const baseSavings = 900;

export const deckLimits = {
  tapas: 48,
  wine: 10,
  burnt: 8,
  premium: 4,
  cake: 1,
  tips: 6,
} as const;

export function startingSavingsFor(playerCount: number): number {
  const seats = Math.min(maxPlayers, Math.max(minPlayers, Math.trunc(playerCount)));

  return baseSavings + (seats - minPlayers) * savingsStep;
}

export function startingSavingsTable(): Array<{ players: number; savings: number }> {
  const rows: Array<{ players: number; savings: number }> = [];

  for (let players = minPlayers; players <= maxPlayers; players += 1) {
    rows.push({ players, savings: startingSavingsFor(players) });
  }

  return rows;
}

export function wineValue(bottles: number): number {
  const count = Math.max(0, Math.trunc(bottles));
  const fullSets = Math.floor(count / wineSetSize);
  const rest = count % wineSetSize;

  return fullSets * wineSetTotals[wineSetSize] + wineSetTotals[rest];
}

export function isBurntValue(value: number): boolean {
  return (burntValues as readonly number[]).includes(value);
}

export function isTapaPrice(value: number): boolean {
  return (tapaPrices as readonly number[]).includes(value);
}

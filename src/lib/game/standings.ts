import { startingSavingsFor } from "@/lib/game/rules";
import type { BillShareRow, PlayerRow, PlayerView } from "@/types/room";

export function paidByPlayer(bills: ReadonlyArray<{ shares: readonly BillShareRow[] }>): Map<string, number> {
  const tally = new Map<string, number>();

  for (const bill of bills) {
    for (const share of bill.shares) {
      tally.set(share.player_id, (tally.get(share.player_id) ?? 0) + share.amount);
    }
  }

  return tally;
}

export function withSavings(
  players: readonly PlayerRow[],
  bills: ReadonlyArray<{ shares: readonly BillShareRow[] }>,
  startingSavings: number | null,
): PlayerView[] {
  const start = startingSavings ?? startingSavingsFor(players.length);
  const tally = paidByPlayer(bills);

  return players.map((player) => {
    const paid = tally.get(player.id) ?? 0;

    return { ...player, paid, savings: start - paid };
  });
}

export function ranked<T extends { savings: number; seat: number }>(players: readonly T[]): T[] {
  return [...players].sort((a, b) => b.savings - a.savings || a.seat - b.seat);
}

export function broke<T extends { savings: number }>(players: readonly T[]): T[] {
  return players.filter((player) => player.savings <= 0);
}

export function isGameOver(players: ReadonlyArray<{ savings: number }>): boolean {
  return players.some((player) => player.savings <= 0);
}

export function winners<T extends { savings: number }>(players: readonly T[]): T[] {
  if (players.length === 0) {
    return [];
  }

  const best = Math.max(...players.map((player) => player.savings));

  return players.filter((player) => player.savings === best);
}

import type { MatchRow, RankingRow } from "@/types/history";

const monthFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
});

export function monthOf(date: string): string {
  return monthFormat.format(new Date(date)).slice(0, 7);
}

export function currentMonth(now = new Date()): string {
  return monthFormat.format(now).slice(0, 7);
}

export function matchesInMonth(
  matches: readonly MatchRow[],
  month: string,
): MatchRow[] {
  return matches.filter((match) => monthOf(match.finished_at) === month);
}

export function availableMonths(matches: readonly MatchRow[]): string[] {
  return [...new Set(matches.map((match) => monthOf(match.finished_at)))].sort(
    (a, b) => b.localeCompare(a),
  );
}

export function ranking(matches: readonly MatchRow[]): RankingRow[] {
  const byPerson = new Map<string, RankingRow>();

  matches.forEach((match) => {
    match.players.forEach((player) => {
      const key = player.name.trim().toLowerCase();
      const current = byPerson.get(key) ?? {
        name: player.name.trim(),
        wins: 0,
        matches: 0,
        savings: 0,
      };

      byPerson.set(key, {
        name: current.name,
        matches: current.matches + 1,
        wins: current.wins + (match.winner_names.includes(player.name) ? 1 : 0),
        savings: current.savings + player.savings,
      });
    });
  });

  return [...byPerson.values()].sort(
    (a, b) =>
      b.wins - a.wins || b.savings - a.savings || a.name.localeCompare(b.name),
  );
}

export function monthLabel(month: string): string {
  const names = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  const [year, number] = month.split("-");

  return `${names[Number(number) - 1]} de ${year}`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

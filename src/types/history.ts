export interface MatchPlayer {
  name: string;
  savings: number;
}

export type MatchEnding = "target" | "timeout";

export interface MatchRow {
  id: string;
  room_code: string;
  winner_names: string[];
  players: MatchPlayer[];
  bars: number;
  starting_savings: number;
  closed_by: MatchEnding;
  finished_at: string;
}

export interface RankingRow {
  name: string;
  wins: number;
  matches: number;
  savings: number;
}

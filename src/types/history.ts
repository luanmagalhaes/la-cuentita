export interface MatchPlayer {
  name: string;
  savings: number;
}

export interface MatchRow {
  id: string;
  room_code: string;
  winner_names: string[];
  players: MatchPlayer[];
  bars: number;
  starting_savings: number;
  finished_at: string;
}

export interface RankingRow {
  name: string;
  wins: number;
  matches: number;
  savings: number;
}

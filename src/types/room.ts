export const RoomPhase = {
  Lobby: "LOBBY",
  Playing: "PLAYING",
  Finished: "FINISHED",
} as const;

export type RoomPhase = (typeof RoomPhase)[keyof typeof RoomPhase];

export const TapaKind = {
  Meat: "MEAT",
  Fish: "FISH",
  Veg: "VEG",
} as const;

export type TapaKind = (typeof TapaKind)[keyof typeof TapaKind];

export const SplitMode = {
  Solo: "SOLO",
  Half: "HALF",
  Dutch: "DUTCH",
} as const;

export type SplitMode = (typeof SplitMode)[keyof typeof SplitMode];

export interface TapaPick {
  kind: TapaKind;
  price: number;
  premium: boolean;
}

export interface BurntPick {
  value: number;
  premium: boolean;
}

export type BillSplit =
  | { mode: typeof SplitMode.Solo }
  | { mode: typeof SplitMode.Half; partnerId: string }
  | { mode: typeof SplitMode.Dutch; excludedIds: string[] };

export interface BillCards {
  tapas: TapaPick[];
  burnts: BurntPick[];
  wine: number;
  cake: boolean;
  tips: number;
}

export interface BillDraft extends BillCards {
  roundNumber: number;
  payerId: string;
  split: BillSplit;
  bathroomIds: string[];
  birthdayId: string | null;
}

export interface BillBreakdown {
  tapas: number;
  premiumBonus: number;
  burnt: number;
  wine: number;
  cake: number;
  tips: number;
  cheapestTapa: number | null;
  raw: number;
  total: number;
}

export interface BillShare {
  playerId: string;
  amount: number;
}

export interface BillDetail extends Omit<BillCards, "burnts"> {
  burnts?: BurntPick[];
  burnt?: number;
  burntPremium?: number;
  split: BillSplit;
  bathroomIds?: string[];
  birthdayId?: string | null;
  breakdown: BillBreakdown;
}

export interface RoomRow {
  id: string;
  code: string;
  phase: RoomPhase;
  round_number: number;
  starting_savings: number | null;
  is_test: boolean;
  host_player_id: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface PlayerRow {
  id: string;
  room_id: string;
  name: string;
  avatar: string | null;
  emoji: string | null;
  seat: number;
  created_at: string;
}

export interface PlayerView extends PlayerRow {
  savings: number;
  paid: number;
}

export interface BillShareRow {
  bill_id: string;
  player_id: string;
  amount: number;
}

export interface BillRow {
  id: string;
  room_id: string;
  round_number: number;
  payer_id: string | null;
  created_by: string | null;
  total: number;
  split_mode: SplitMode;
  detail: BillDetail;
  created_at: string;
  updated_at: string;
}

export interface BillView extends BillRow {
  shares: BillShareRow[];
}

export interface RoomState {
  room: RoomRow;
  players: PlayerView[];
  bills: BillView[];
  meId: string | null;
}

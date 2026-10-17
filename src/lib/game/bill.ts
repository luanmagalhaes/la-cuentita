import { burntValue, cakeValue, deckLimits, isTapaPrice, wineValue } from "@/lib/game/rules";
import {
  SplitMode,
  TapaKind,
  type BillBreakdown,
  type BillCards,
  type BillDraft,
  type BillShare,
  type BillSplit,
  type TapaPick,
} from "@/types/room";

export type DraftCheck = { ok: true; draft: BillDraft } | { ok: false; error: string };

const tapaKinds: readonly string[] = Object.values(TapaKind);

export const emptyCards: BillCards = {
  tapas: [],
  burnt: 0,
  burntPremium: 0,
  wine: 0,
  cake: false,
  tips: 0,
};

export function cheapestTapa(tapas: readonly TapaPick[]): number | null {
  if (tapas.length === 0) {
    return null;
  }

  return Math.min(...tapas.map((tapa) => tapa.price));
}

export function premiumCount(cards: Pick<BillCards, "tapas" | "burntPremium">): number {
  return cards.tapas.filter((tapa) => tapa.premium).length + cards.burntPremium;
}

export function computeBill(cards: BillCards): BillBreakdown {
  const tapas = cards.tapas.reduce((sum, tapa) => sum + tapa.price, 0);
  const premiumTapas = cards.tapas
    .filter((tapa) => tapa.premium)
    .reduce((sum, tapa) => sum + tapa.price, 0);
  const burnt = (cards.burnt + cards.burntPremium) * burntValue;
  const premiumBonus = premiumTapas + cards.burntPremium * burntValue;
  const wine = wineValue(cards.wine);
  const cake = cards.cake ? cakeValue : 0;
  const cheapest = cheapestTapa(cards.tapas);
  const tips = (cheapest ?? 0) * cards.tips;
  const raw = tapas + premiumBonus + burnt + wine + cake + tips;

  return {
    tapas,
    premiumBonus,
    burnt,
    wine,
    cake,
    tips,
    cheapestTapa: cheapest,
    raw,
    total: Math.max(0, raw),
  };
}

export function splitBill(input: {
  total: number;
  split: BillSplit;
  payerId: string;
  playerIds: readonly string[];
}): BillShare[] {
  const { total, split, payerId } = input;

  if (split.mode === SplitMode.Half) {
    const partnerPart = Math.floor(total / 2);

    return [
      { playerId: payerId, amount: total - partnerPart },
      { playerId: split.partnerId, amount: partnerPart },
    ];
  }

  if (split.mode === SplitMode.Dutch) {
    const excluded = new Set(split.excludedIds);
    const others = input.playerIds.filter((id) => id !== payerId && !excluded.has(id));
    const people = others.length + 1;
    const each = Math.floor(total / people);
    const rest = total - each * people;

    return [
      { playerId: payerId, amount: each + rest },
      ...others.map((playerId) => ({ playerId, amount: each })),
    ];
  }

  return [{ playerId: payerId, amount: total }];
}

function wholeCount(value: unknown, limit: number): number | null {
  const number = Number(value ?? 0);

  if (!Number.isInteger(number) || number < 0 || number > limit) {
    return null;
  }

  return number;
}

function readTapas(value: unknown): TapaPick[] | string {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return "As tapas chegaram num formato estranho";
  }

  if (value.length > deckLimits.tapas) {
    return `O baralho só tem ${deckLimits.tapas} tapas`;
  }

  const tapas: TapaPick[] = [];

  for (const item of value) {
    const kind = String((item as { kind?: unknown })?.kind ?? "");
    const price = Number((item as { price?: unknown })?.price);
    const premium = (item as { premium?: unknown })?.premium === true;

    if (!tapaKinds.includes(kind) || !isTapaPrice(price)) {
      return "Tem uma tapa com tipo ou preço que não existe no baralho";
    }

    tapas.push({ kind: kind as TapaPick["kind"], price, premium });
  }

  return tapas;
}

function readSplit(value: unknown, payerId: string, playerIds: readonly string[]): BillSplit | string {
  const mode = String((value as { mode?: unknown })?.mode ?? SplitMode.Solo);

  if (mode === SplitMode.Solo) {
    return { mode: SplitMode.Solo };
  }

  if (mode === SplitMode.Half) {
    const partnerId = String((value as { partnerId?: unknown })?.partnerId ?? "");

    if (!playerIds.includes(partnerId)) {
      return "Escolha com quem você vai rachar a conta";
    }

    if (partnerId === payerId) {
      return "Para rachar meio a meio, escolha outra pessoa";
    }

    return { mode: SplitMode.Half, partnerId };
  }

  if (mode === SplitMode.Dutch) {
    const raw = (value as { excludedIds?: unknown })?.excludedIds ?? [];

    if (!Array.isArray(raw)) {
      return "A lista de quem fica de fora veio estranha";
    }

    const excludedIds = [...new Set(raw.map((id) => String(id)))];

    if (excludedIds.some((id) => !playerIds.includes(id))) {
      return "Tem gente na lista de fora que não está na mesa";
    }

    if (excludedIds.includes(payerId)) {
      return "Quem pediu a conta não pode ficar de fora da divisão";
    }

    return { mode: SplitMode.Dutch, excludedIds };
  }

  return "Esse jeito de dividir a conta não existe";
}

export function checkBillDraft(value: unknown, playerIds: readonly string[]): DraftCheck {
  const input = (value ?? {}) as Record<string, unknown>;
  const roundNumber = Number(input.roundNumber);

  if (!Number.isInteger(roundNumber) || roundNumber < 1) {
    return { ok: false, error: "Não sei de qual bar é essa conta" };
  }

  const payerId = String(input.payerId ?? "");

  if (!playerIds.includes(payerId)) {
    return { ok: false, error: "Quem paga a conta não está na mesa" };
  }

  const tapas = readTapas(input.tapas);

  if (typeof tapas === "string") {
    return { ok: false, error: tapas };
  }

  const burnt = wholeCount(input.burnt, deckLimits.burnt);
  const burntPremium = wholeCount(input.burntPremium, deckLimits.burnt);
  const wine = wholeCount(input.wine, deckLimits.wine);
  const tips = wholeCount(input.tips, deckLimits.tips);

  if (burnt === null || burntPremium === null || burnt + burntPremium > deckLimits.burnt) {
    return { ok: false, error: `O baralho só tem ${deckLimits.burnt} pratos queimados` };
  }

  if (wine === null) {
    return { ok: false, error: `O baralho só tem ${deckLimits.wine} vinhos` };
  }

  if (tips === null) {
    return { ok: false, error: `O baralho só tem ${deckLimits.tips} gorjetas` };
  }

  if (premiumCount({ tapas, burntPremium }) > deckLimits.premium) {
    return { ok: false, error: `O baralho só tem ${deckLimits.premium} cartas Premium` };
  }

  const split = readSplit(input.split, payerId, playerIds);

  if (typeof split === "string") {
    return { ok: false, error: split };
  }

  return {
    ok: true,
    draft: {
      roundNumber,
      payerId,
      tapas,
      burnt,
      burntPremium,
      wine,
      cake: input.cake === true,
      tips,
      split,
    },
  };
}

import { cakeValue, deckLimits, isBurntValue, isTapaPrice, wineValue } from "@/lib/game/rules";
import {
  SplitMode,
  TapaKind,
  type BillBreakdown,
  type BillCards,
  type BillDraft,
  type BillShare,
  type BillSplit,
  type BurntPick,
  type TapaPick,
} from "@/types/room";

export type DraftCheck = { ok: true; draft: BillDraft } | { ok: false; error: string };

type SitOuts = Pick<BillDraft, "bathroomIds" | "birthdayId">;

const tapaKinds: readonly string[] = Object.values(TapaKind);

export const emptyCards: BillCards = {
  tapas: [],
  burnts: [],
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

export function premiumCount(cards: Pick<BillCards, "tapas" | "burnts">): number {
  return (
    cards.tapas.filter((tapa) => tapa.premium).length + cards.burnts.filter((burnt) => burnt.premium).length
  );
}

export function sitOutIds(sitOuts: SitOuts): string[] {
  return [...new Set([...sitOuts.bathroomIds, ...(sitOuts.birthdayId ? [sitOuts.birthdayId] : [])])];
}

export function legacyBurnts(burnt: number | undefined, burntPremium: number | undefined): BurntPick[] {
  return [
    ...Array.from({ length: burnt ?? 0 }, () => ({ value: 10, premium: false })),
    ...Array.from({ length: burntPremium ?? 0 }, () => ({ value: 10, premium: true })),
  ];
}

export function computeBill(cards: BillCards): BillBreakdown {
  const tapas = cards.tapas.reduce((sum, tapa) => sum + tapa.price, 0);
  const premiumTapas = cards.tapas
    .filter((tapa) => tapa.premium)
    .reduce((sum, tapa) => sum + tapa.price, 0);
  const burnt = -cards.burnts.reduce((sum, pick) => sum + pick.value, 0);
  const premiumBurnt = cards.burnts.filter((pick) => pick.premium).reduce((sum, pick) => sum + pick.value, 0);
  const premiumBonus = premiumTapas - premiumBurnt;
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

function readBurnts(input: Record<string, unknown>): BurntPick[] | string {
  if (!Array.isArray(input.burnts)) {
    const burnt = wholeCount(input.burnt, deckLimits.burnt);
    const burntPremium = wholeCount(input.burntPremium, deckLimits.burnt);

    if (burnt === null || burntPremium === null || burnt + burntPremium > deckLimits.burnt) {
      return `O baralho só tem ${deckLimits.burnt} pratos queimados`;
    }

    return legacyBurnts(burnt, burntPremium);
  }

  if (input.burnts.length > deckLimits.burnt) {
    return `O baralho só tem ${deckLimits.burnt} pratos queimados`;
  }

  const burnts: BurntPick[] = [];

  for (const item of input.burnts) {
    const value = Number((item as { value?: unknown })?.value);

    if (!isBurntValue(value)) {
      return "Tem um prato queimado com valor que não existe no baralho";
    }

    burnts.push({ value, premium: (item as { premium?: unknown })?.premium === true });
  }

  return burnts;
}

function readSitOuts(input: Record<string, unknown>, payerId: string, playerIds: readonly string[]): SitOuts | string {
  const raw = input.bathroomIds ?? [];

  if (!Array.isArray(raw)) {
    return "A lista de quem está no banheiro veio estranha";
  }

  const bathroomIds = [...new Set(raw.map((id) => String(id)))].filter((id) => playerIds.includes(id));

  if (bathroomIds.includes(payerId)) {
    return "Quem está no banheiro não pode pedir a conta";
  }

  if (bathroomIds.length > deckLimits.bathroom) {
    return `O baralho só tem ${deckLimits.bathroom} cartas de banheiro`;
  }

  const asked = input.cake === true ? String(input.birthdayId ?? "") : "";
  const birthdayId = playerIds.includes(asked) ? asked : null;

  if (birthdayId === payerId) {
    return "Quem faz aniversário não pode pedir a conta";
  }

  return { bathroomIds, birthdayId };
}

function readSplit(
  value: unknown,
  payerId: string,
  playerIds: readonly string[],
  outIds: readonly string[],
): BillSplit | string {
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

    if (outIds.includes(partnerId)) {
      return "Quem está no banheiro ou faz aniversário não racha a conta";
    }

    return { mode: SplitMode.Half, partnerId };
  }

  if (mode === SplitMode.Dutch) {
    const raw = (value as { excludedIds?: unknown })?.excludedIds ?? [];

    if (!Array.isArray(raw)) {
      return "A lista de quem fica de fora veio estranha";
    }

    const asked = [...new Set(raw.map((id) => String(id)))];

    if (asked.includes(payerId)) {
      return "Quem pediu a conta não pode ficar de fora da divisão";
    }

    return {
      mode: SplitMode.Dutch,
      excludedIds: [...new Set([...asked, ...outIds])].filter((id) => playerIds.includes(id)),
    };
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

  const burnts = readBurnts(input);
  const wine = wholeCount(input.wine, deckLimits.wine);
  const tips = wholeCount(input.tips, deckLimits.tips);

  if (typeof burnts === "string") {
    return { ok: false, error: burnts };
  }

  if (wine === null) {
    return { ok: false, error: `O baralho só tem ${deckLimits.wine} vinhos` };
  }

  if (tips === null) {
    return { ok: false, error: `O baralho só tem ${deckLimits.tips} gorjetas` };
  }

  if (premiumCount({ tapas, burnts }) > deckLimits.premium) {
    return { ok: false, error: `O baralho só tem ${deckLimits.premium} cartas Premium` };
  }

  const sitOuts = readSitOuts(input, payerId, playerIds);

  if (typeof sitOuts === "string") {
    return { ok: false, error: sitOuts };
  }

  const split = readSplit(input.split, payerId, playerIds, sitOutIds(sitOuts));

  if (typeof split === "string") {
    return { ok: false, error: split };
  }

  return {
    ok: true,
    draft: {
      roundNumber,
      payerId,
      tapas,
      burnts,
      wine,
      cake: input.cake === true,
      tips,
      split,
      bathroomIds: sitOuts.bathroomIds,
      birthdayId: sitOuts.birthdayId,
    },
  };
}

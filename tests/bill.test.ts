import { describe, expect, it } from "vitest";
import { checkBillDraft, computeBill, emptyCards, splitBill } from "@/lib/game/bill";
import { SplitMode, TapaKind, type BillCards } from "@/types/room";

function cards(overrides: Partial<BillCards>): BillCards {
  return { ...emptyCards, ...overrides };
}

const meat = (price: number, premium = false) => ({ kind: TapaKind.Meat, price, premium });
const fish = (price: number, premium = false) => ({ kind: TapaKind.Fish, price, premium });
const veg = (price: number, premium = false) => ({ kind: TapaKind.Veg, price, premium });

describe("soma da conta", () => {
  it("soma o preço de cada tapa, inclusive repetidas", () => {
    expect(computeBill(cards({ tapas: [meat(20), meat(20), fish(30)] })).total).toBe(70);
  });

  it("prato queimado desconta 10", () => {
    const bill = computeBill(cards({ tapas: [veg(40)], burnts: [{ value: 10, premium: false }] }));

    expect(bill.burnt).toBe(-10);
    expect(bill.total).toBe(30);
  });

  it("premium dobra a tapa que entrou junto", () => {
    const bill = computeBill(cards({ tapas: [fish(60, true), meat(10)] }));

    expect(bill.premiumBonus).toBe(60);
    expect(bill.total).toBe(130);
  });

  it("premium em prato queimado dobra o desconto", () => {
    const bill = computeBill(cards({ tapas: [meat(30)], burnts: [{ value: 10, premium: true }] }));

    expect(bill.burnt).toBe(-10);
    expect(bill.premiumBonus).toBe(-10);
    expect(bill.total).toBe(10);
  });

  it("vinho entra pelo valor do conjunto", () => {
    expect(computeBill(cards({ wine: 3 })).total).toBe(120);
  });

  it("bolo de aniversário custa 40", () => {
    expect(computeBill(cards({ tapas: [veg(20)], cake: true })).total).toBe(60);
  });

  it("cada gorjeta soma o preço impresso da tapa mais barata", () => {
    const bill = computeBill(cards({ tapas: [meat(30, true), fish(50)], tips: 2 }));

    expect(bill.cheapestTapa).toBe(30);
    expect(bill.tips).toBe(60);
    expect(bill.total).toBe(30 + 30 + 50 + 60);
  });

  it("gorjeta sem tapa na mesa não soma nada", () => {
    expect(computeBill(cards({ wine: 1, tips: 1 })).tips).toBe(0);
  });

  it("queimados de valores diferentes somam o desconto de cada um", () => {
    const bill = computeBill(
      cards({
        tapas: [meat(70), fish(70)],
        burnts: [
          { value: 50, premium: false },
          { value: 20, premium: true },
        ],
      }),
    );

    expect(bill.burnt).toBe(-70);
    expect(bill.premiumBonus).toBe(-20);
    expect(bill.total).toBe(50);
  });

  it("premium em queimado de 70 tira 140", () => {
    expect(computeBill(cards({ tapas: [veg(70), fish(70), meat(70)], burnts: [{ value: 70, premium: true }] })).total).toBe(70);
  });

  it("conta negativa não cobra ninguém", () => {
    const bill = computeBill(cards({ tapas: [meat(10)], burnts: [{ value: 10, premium: false }, { value: 20, premium: false }] }));

    expect(bill.raw).toBe(-20);
    expect(bill.total).toBe(0);
  });

  it("junta tudo numa conta só", () => {
    const bill = computeBill(
      cards({
        tapas: [meat(10), meat(30), fish(20), fish(70, true), veg(40)],
        burnts: [{ value: 10, premium: false }],
        wine: 2,
        cake: true,
        tips: 1,
      }),
    );

    expect(bill.tapas).toBe(170);
    expect(bill.premiumBonus).toBe(70);
    expect(bill.wine).toBe(60);
    expect(bill.total).toBe(170 + 70 - 10 + 60 + 40 + 10);
  });
});

describe("divisão da conta", () => {
  const people = ["eu", "b", "c", "d"];

  it("sozinho, quem pediu paga tudo", () => {
    expect(splitBill({ total: 180, split: { mode: SplitMode.Solo }, payerId: "eu", playerIds: people })).toEqual([
      { playerId: "eu", amount: 180 },
    ]);
  });

  it("meio a meio divide com a pessoa escolhida", () => {
    expect(
      splitBill({ total: 150, split: { mode: SplitMode.Half, partnerId: "c" }, payerId: "eu", playerIds: people }),
    ).toEqual([
      { playerId: "eu", amount: 75 },
      { playerId: "c", amount: 75 },
    ]);
  });

  it("cada um paga deixa de fora quem está no banheiro ou de aniversário", () => {
    const shares = splitBill({
      total: 250,
      split: { mode: SplitMode.Dutch, excludedIds: ["d"] },
      payerId: "eu",
      playerIds: people,
    });

    expect(shares).toEqual([
      { playerId: "eu", amount: 84 },
      { playerId: "b", amount: 83 },
      { playerId: "c", amount: 83 },
    ]);
  });

  it("a soma das partes sempre fecha com o total", () => {
    for (const total of [0, 10, 70, 250, 1010]) {
      for (const count of [1, 2, 3, 4]) {
        const shares = splitBill({
          total,
          split: { mode: SplitMode.Dutch, excludedIds: [] },
          payerId: "eu",
          playerIds: people.slice(0, count),
        });

        expect(shares.reduce((sum, share) => sum + share.amount, 0)).toBe(total);
      }
    }
  });
});

describe("conferência do rascunho", () => {
  const people = ["eu", "b", "c"];
  const base = { roundNumber: 1, payerId: "eu", split: { mode: SplitMode.Solo } };

  it("aceita uma conta normal", () => {
    const check = checkBillDraft({ ...base, tapas: [meat(20)], wine: 1 }, people);

    expect(check.ok).toBe(true);
  });

  it("recusa preço que não existe", () => {
    const check = checkBillDraft({ ...base, tapas: [{ kind: "MEAT", price: 15 }] }, people);

    expect(check).toEqual({ ok: false, error: "Tem uma tapa com tipo ou preço que não existe no baralho" });
  });

  it("recusa mais premium do que o baralho tem", () => {
    const check = checkBillDraft(
      { ...base, tapas: [meat(10, true), meat(20, true), fish(30, true), veg(40, true)], burnts: [{ value: 20, premium: true }] },
      people,
    );

    expect(check.ok).toBe(false);
  });

  it("recusa rachar com quem não está na mesa", () => {
    const check = checkBillDraft({ ...base, split: { mode: "HALF", partnerId: "z" } }, people);

    expect(check.ok).toBe(false);
  });

  it("recusa tirar da divisão quem pediu a conta", () => {
    const check = checkBillDraft({ ...base, split: { mode: "DUTCH", excludedIds: ["eu"] } }, people);

    expect(check.ok).toBe(false);
  });

  it("recusa queimado com valor que não existe", () => {
    expect(checkBillDraft({ ...base, burnts: [{ value: 30, premium: false }] }, people).ok).toBe(false);
  });

  it("aceita o formato antigo de queimado como cartas de 10", () => {
    const check = checkBillDraft({ ...base, burnt: 2, burntPremium: 1 }, people);

    expect(check.ok && check.draft.burnts).toEqual([
      { value: 10, premium: false },
      { value: 10, premium: false },
      { value: 10, premium: true },
    ]);
  });

  it("recusa pagador de fora da mesa", () => {
    expect(checkBillDraft({ ...base, payerId: "z" }, people).ok).toBe(false);
  });
});

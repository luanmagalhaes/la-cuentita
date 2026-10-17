import { describe, expect, it } from "vitest";
import { broke, isGameOver, ranked, winners, withSavings } from "@/lib/game/standings";

const people = [
  { id: "a", room_id: "r", name: "Tigre", avatar: null, emoji: null, seat: 1, created_at: "" },
  { id: "b", room_id: "r", name: "Coruja", avatar: null, emoji: null, seat: 2, created_at: "" },
  { id: "c", room_id: "r", name: "Lontra", avatar: null, emoji: null, seat: 3, created_at: "" },
];

const bill = (shares: Array<[string, number]>) => ({
  shares: shares.map(([player_id, amount]) => ({ bill_id: "x", player_id, amount })),
});

describe("poupança de cada um", () => {
  it("desconta tudo o que cada um pagou", () => {
    const views = withSavings(people, [bill([["a", 300]]), bill([["b", 100], ["a", 100]])], 900);

    expect(views.map((view) => view.savings)).toEqual([500, 800, 900]);
    expect(views.map((view) => view.paid)).toEqual([400, 100, 0]);
  });

  it("antes de começar usa a tabela pelo tamanho da mesa", () => {
    expect(withSavings(people, [], null)[0].savings).toBe(900);
  });
});

describe("fim de jogo", () => {
  it("acaba quando alguém chega a zero", () => {
    const views = withSavings(people, [bill([["c", 900]])], 900);

    expect(isGameOver(views)).toBe(true);
    expect(broke(views).map((view) => view.id)).toEqual(["c"]);
  });

  it("continua enquanto todo mundo tem dinheiro", () => {
    expect(isGameOver(withSavings(people, [bill([["c", 890]])], 900))).toBe(false);
  });

  it("vence quem tem mais poupança", () => {
    const views = withSavings(people, [bill([["a", 200], ["c", 900]])], 900);

    expect(winners(views).map((view) => view.id)).toEqual(["b"]);
  });

  it("empate devolve todos os empatados", () => {
    const views = withSavings(people, [bill([["c", 950]])], 900);

    expect(winners(views).map((view) => view.id)).toEqual(["a", "b"]);
  });

  it("ordena do mais rico para o mais pobre, desempatando pela cadeira", () => {
    const views = withSavings(people, [bill([["a", 100]])], 900);

    expect(ranked(views).map((view) => view.id)).toEqual(["b", "c", "a"]);
  });
});

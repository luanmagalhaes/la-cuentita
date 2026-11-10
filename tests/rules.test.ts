import { describe, expect, it } from "vitest";
import { startingSavingsFor, startingSavingsTable, wineValue } from "@/lib/game/rules";

describe("poupança inicial", () => {
  it("segue a tabela por número de jogadores", () => {
    expect(startingSavingsTable()).toEqual([
      { players: 3, savings: 900 },
      { players: 4, savings: 1000 },
      { players: 5, savings: 1100 },
      { players: 6, savings: 1200 },
      { players: 7, savings: 1300 },
      { players: 8, savings: 1400 },
      { players: 9, savings: 1500 },
      { players: 10, savings: 1600 },
      { players: 11, savings: 1700 },
      { players: 12, savings: 1800 },
    ]);
  });

  it("não sai da faixa de 3 a 12 jogadores", () => {
    expect(startingSavingsFor(2)).toBe(900);
    expect(startingSavingsFor(15)).toBe(1800);
  });
});

describe("vinho", () => {
  it("cobra pelo conjunto, não por garrafa", () => {
    expect([0, 1, 2, 3, 4, 5].map(wineValue)).toEqual([0, 30, 60, 120, 180, 240]);
  });

  it("a sexta garrafa abre um conjunto novo", () => {
    expect(wineValue(6)).toBe(270);
    expect(wineValue(7)).toBe(300);
    expect(wineValue(10)).toBe(480);
  });
});

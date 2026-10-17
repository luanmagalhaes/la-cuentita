import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checked,
  databaseDownMessage,
  databaseError,
  looksLikeOutage,
  serverTroubleMessage,
  ServiceError,
} from "@/lib/errors";
import { appTroubleMessage, FriendlyError, readableError } from "@/lib/friendly";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("banco fora do ar", () => {
  it("reconhece o erro de quando o Supabase pausa", () => {
    expect(looksLikeOutage("TypeError: fetch failed")).toBe(true);
  });

  it("reconhece conexão recusada e tempo esgotado", () => {
    expect(looksLikeOutage("connect ECONNREFUSED 10.0.0.1:443")).toBe(true);
    expect(looksLikeOutage("Request timeout")).toBe(true);
  });

  it("não confunde erro de regra com queda", () => {
    expect(looksLikeOutage("duplicate key value violates unique constraint")).toBe(false);
  });

  it("vira mensagem em português com status 503", () => {
    const failure = databaseError({ message: "TypeError: fetch failed", code: "" });

    expect(failure.status).toBe(503);
    expect(failure.message).toBe(databaseDownMessage);
  });

  it("erro desconhecido do banco vira aviso genérico, sem texto em inglês", () => {
    const failure = databaseError({ message: "relation lc_x does not exist", code: "42P01" });

    expect(failure.status).toBe(500);
    expect(failure.message).toBe(serverTroubleMessage);
  });
});

describe("resposta do banco", () => {
  const base = { count: null, status: 200, statusText: "OK" };

  it("devolve os dados quando deu certo", () => {
    expect(checked({ ...base, data: [1, 2], error: null, success: true })).toEqual([1, 2]);
  });

  it("não deixa falha passar como lista vazia", () => {
    const failure = {
      ...base,
      status: 0,
      data: null,
      error: { message: "TypeError: fetch failed", details: "", hint: "", code: "" },
      success: false,
    };

    expect(() => checked(failure as never)).toThrow(ServiceError);
  });
});

describe("mensagem na tela", () => {
  it("mostra o texto escrito pelo app", () => {
    expect(readableError(new FriendlyError("Não achei essa sala."))).toBe("Não achei essa sala.");
  });

  it("esconde erro de código em inglês", () => {
    expect(readableError(new TypeError("Cannot read properties of undefined"))).toBe(
      appTroubleMessage,
    );
  });
});

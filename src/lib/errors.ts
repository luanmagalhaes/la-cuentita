import type { PostgrestSingleResponse } from "@supabase/supabase-js";

export class ServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
  }
}

export const databaseDownMessage =
  "O banco de dados do jogo está fora do ar agora. Espere uns minutos e tente de novo.";
export const serverTroubleMessage =
  "Deu um problema no servidor do jogo. Tente de novo daqui a pouco.";
export const brokenRequestMessage = "O pedido chegou incompleto no servidor. Tente de novo.";

interface DatabaseFailure {
  message: string;
  code?: string;
}

const outageHints = [
  "fetch failed",
  "failed to fetch",
  "econnrefused",
  "econnreset",
  "enotfound",
  "etimedout",
  "network",
  "timeout",
  "socket",
  "upstream",
  "paused",
  "service unavailable",
  "bad gateway",
];

export function looksLikeOutage(text: string): boolean {
  const lowered = text.toLowerCase();

  return outageHints.some((hint) => lowered.includes(hint));
}

export function databaseError(failure: DatabaseFailure): ServiceError {
  console.error("database failure", failure);

  return looksLikeOutage(`${failure.message} ${failure.code ?? ""}`)
    ? new ServiceError(databaseDownMessage, 503)
    : new ServiceError(serverTroubleMessage, 500);
}

export function checked<T>(result: PostgrestSingleResponse<T>): T {
  if (result.error) {
    throw databaseError(result.error);
  }

  return result.data;
}

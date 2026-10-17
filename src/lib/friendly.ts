export class FriendlyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FriendlyError";
  }
}

export const appTroubleMessage = "Algo deu errado aqui no app. Tente de novo.";

export function readableError(cause: unknown, fallback = appTroubleMessage): string {
  return cause instanceof FriendlyError ? cause.message : fallback;
}

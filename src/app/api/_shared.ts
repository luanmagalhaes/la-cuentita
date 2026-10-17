import {
  brokenRequestMessage,
  databaseDownMessage,
  looksLikeOutage,
  serverTroubleMessage,
  ServiceError,
} from "@/lib/errors";

export function playerToken(request: Request): string {
  return request.headers.get("x-player-token") ?? "";
}

export async function handle<T>(work: () => Promise<T>): Promise<Response> {
  try {
    return Response.json(await work());
  } catch (cause) {
    if (cause instanceof ServiceError) {
      return Response.json({ error: cause.message }, { status: cause.status });
    }

    console.error("unexpected failure", cause);

    if (cause instanceof SyntaxError) {
      return Response.json({ error: brokenRequestMessage }, { status: 400 });
    }

    const detail = cause instanceof Error ? `${cause.name} ${cause.message}` : String(cause);

    return looksLikeOutage(detail)
      ? Response.json({ error: databaseDownMessage }, { status: 503 })
      : Response.json({ error: serverTroubleMessage }, { status: 500 });
  }
}

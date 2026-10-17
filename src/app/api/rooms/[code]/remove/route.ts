import { handle, playerToken } from "@/app/api/_shared";
import { removePlayer } from "@/lib/game/service";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { playerId?: string };

    return removePlayer({ code, token: playerToken(request), playerId: String(body.playerId ?? "") });
  });
}

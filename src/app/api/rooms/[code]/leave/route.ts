import { handle, playerToken } from "@/app/api/_shared";
import { leaveRoom } from "@/lib/game/service";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await context.params;

    return leaveRoom({ code, token: playerToken(request) });
  });
}

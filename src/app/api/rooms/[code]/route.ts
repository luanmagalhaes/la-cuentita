import { handle, playerToken } from "@/app/api/_shared";
import { roomState } from "@/lib/game/service";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await context.params;

    return roomState({ code, token: playerToken(request) });
  });
}

import { handle, playerToken } from "@/app/api/_shared";
import { updateProfile } from "@/lib/game/service";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await context.params;
    const body = (await request.json()) as { emoji?: string | null; avatar?: string | null };

    return updateProfile({ code, token: playerToken(request), emoji: body.emoji, avatar: body.avatar });
  });
}

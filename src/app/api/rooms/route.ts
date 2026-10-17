import { handle } from "@/app/api/_shared";
import { createRoom } from "@/lib/game/service";
import { looksLikeRobot } from "@/lib/game/testDetection";

export async function POST(request: Request) {
  return handle(async () => {
    const body = (await request.json()) as { hostName?: string; emoji?: string };

    return createRoom({
      hostName: String(body.hostName ?? ""),
      emoji: body.emoji,
      isTest: looksLikeRobot(request),
    });
  });
}

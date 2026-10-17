import { handle, playerToken } from "@/app/api/_shared";
import { replaceBill, undoBill } from "@/lib/game/service";

type Context = { params: Promise<{ code: string; billId: string }> };

export async function PUT(request: Request, context: Context) {
  return handle(async () => {
    const { code, billId } = await context.params;

    return replaceBill({ code, token: playerToken(request), billId, body: await request.json() });
  });
}

export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    const { code, billId } = await context.params;

    return undoBill({ code, token: playerToken(request), billId });
  });
}

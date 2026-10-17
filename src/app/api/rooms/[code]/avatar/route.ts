import { handle, playerToken } from "@/app/api/_shared";
import { checked, databaseError, ServiceError } from "@/lib/errors";
import { loadPlayer, loadRoom } from "@/lib/game/service";
import { serverClient } from "@/lib/supabase";

const maxAvatarBytes = 512 * 1024;
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await context.params;
    const room = await loadRoom(code);
    const me = await loadPlayer(room, playerToken(request));
    const mime = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const extension = extensions[mime];

    if (!extension) {
      throw new ServiceError("Mande a foto em JPG, PNG ou WEBP", 415);
    }

    const bytes = await request.arrayBuffer();

    if (bytes.byteLength === 0) {
      throw new ServiceError("A foto chegou vazia, tente de novo", 422);
    }

    if (bytes.byteLength > maxAvatarBytes) {
      throw new ServiceError("A foto ficou pesada demais, escolha outra", 413);
    }

    const client = serverClient();
    const path = `${room.id}/${me.id}.${extension}`;
    const { error } = await client.storage
      .from("lc-avatars")
      .upload(path, bytes, { contentType: mime, upsert: true });

    if (error) {
      const failure = databaseError(error);

      throw failure.status === 503 ? failure : new ServiceError("Não consegui guardar essa foto", 500);
    }

    const { data: published } = client.storage.from("lc-avatars").getPublicUrl(path);
    const avatar = `${published.publicUrl}?v=${Date.now()}`;

    checked(await client.from("lc_players").update({ avatar, emoji: null }).eq("id", me.id));

    return { avatar };
  });
}

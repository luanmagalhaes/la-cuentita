import { randomUUID } from "node:crypto";
import { checked, databaseError, ServiceError } from "@/lib/errors";
import { checkBillDraft, computeBill, splitBill } from "@/lib/game/bill";
import { maxNameLength, maxPlayers, minPlayers } from "@/lib/game/limits";
import { startingSavingsFor } from "@/lib/game/rules";
import { withSavings } from "@/lib/game/standings";
import { serverClient } from "@/lib/supabase";
import {
  RoomPhase,
  type BillDetail,
  type BillRow,
  type BillShareRow,
  type BillView,
  type PlayerRow,
  type RoomRow,
  type RoomState,
} from "@/types/room";

const billFailures: Record<string, ServiceError> = {
  LC_ROOM_GONE: new ServiceError("Essa sala não existe mais", 404),
  LC_NOT_PLAYING: new ServiceError("A partida não está rolando agora", 409),
  LC_WRONG_ROUND: new ServiceError("O bar já mudou. Feche e abra a conta de novo.", 409),
  LC_NOT_LATEST: new ServiceError("Só dá para mexer na última conta lançada", 409),
  LC_SHARES_MISMATCH: new ServiceError("A divisão não fechou com o total. Tente de novo.", 422),
};

function billFailure(error: { message: string; code?: string }): ServiceError {
  if (error.code === "23505") {
    return new ServiceError("A conta desse bar já foi lançada", 409);
  }

  const known = Object.keys(billFailures).find((key) => error.message.includes(key));

  return known ? billFailures[known] : databaseError(error);
}

function cleanName(value: string): string {
  const name = value.replace(/\s+/g, " ").trim();

  if (name.length === 0) {
    throw new ServiceError("Escreva o seu nome", 422);
  }

  return name.slice(0, maxNameLength);
}

export async function loadRoom(code: string): Promise<RoomRow> {
  const data = checked(
    await serverClient().from("lc_rooms").select("*").eq("code", code.trim().toUpperCase()).maybeSingle(),
  );

  if (!data) {
    throw new ServiceError("Essa sala não existe mais", 404);
  }

  return data as RoomRow;
}

export async function loadPlayer(room: RoomRow, token: string): Promise<PlayerRow> {
  const client = serverClient();
  const secret = checked(
    await client
      .from("lc_player_secrets")
      .select("player_id")
      .eq("room_id", room.id)
      .eq("access_token", token)
      .maybeSingle(),
  );

  if (!secret) {
    throw new ServiceError("Você não está nesta sala", 401);
  }

  const player = checked(
    await client.from("lc_players").select("*").eq("id", secret.player_id as string).maybeSingle(),
  );

  if (!player) {
    throw new ServiceError("Você não está mais nesta sala", 404);
  }

  return player as PlayerRow;
}

export async function roster(roomId: string): Promise<PlayerRow[]> {
  const data = checked(
    await serverClient().from("lc_players").select("*").eq("room_id", roomId).order("seat"),
  );

  return (data ?? []) as PlayerRow[];
}

async function billsOf(roomId: string): Promise<BillView[]> {
  const client = serverClient();
  const bills = (checked(
    await client.from("lc_bills").select("*").eq("room_id", roomId).order("round_number"),
  ) ?? []) as BillRow[];

  if (bills.length === 0) {
    return [];
  }

  const shares = (checked(
    await client
      .from("lc_bill_shares")
      .select("bill_id, player_id, amount")
      .in(
        "bill_id",
        bills.map((bill) => bill.id),
      ),
  ) ?? []) as BillShareRow[];

  return bills.map((bill) => ({
    ...bill,
    shares: shares.filter((share) => share.bill_id === bill.id),
  }));
}

export async function roomState(input: { code: string; token?: string }): Promise<RoomState> {
  const room = await loadRoom(input.code);
  const [people, bills] = await Promise.all([roster(room.id), billsOf(room.id)]);
  let meId: string | null = null;

  if (input.token) {
    const secret = checked(
      await serverClient()
        .from("lc_player_secrets")
        .select("player_id")
        .eq("room_id", room.id)
        .eq("access_token", input.token)
        .maybeSingle(),
    );

    meId = (secret?.player_id as string | undefined) ?? null;
  }

  return {
    room,
    players: withSavings(people, bills, room.starting_savings),
    bills,
    meId,
  };
}

export async function createRoom(input: { hostName: string; emoji?: string; isTest?: boolean }) {
  const client = serverClient();
  const generated = await client.rpc("lc_generate_code");

  if (generated.error?.message.includes("LC_NO_CODES")) {
    throw new ServiceError("Todas as salas estão ocupadas agora. Tente de novo daqui a pouco.", 503);
  }

  const code = checked(generated) as string;
  const room = checked(
    await client
      .from("lc_rooms")
      .insert({ code, is_test: input.isTest ?? false })
      .select()
      .single(),
  ) as RoomRow;

  const joined = await joinRoom({ code: room.code, name: input.hostName, emoji: input.emoji });

  checked(await client.from("lc_rooms").update({ host_player_id: joined.playerId }).eq("id", room.id));

  return joined;
}

export async function joinRoom(input: { code: string; name: string; emoji?: string }) {
  const client = serverClient();
  const room = await loadRoom(input.code);

  if (room.phase !== RoomPhase.Lobby) {
    throw new ServiceError("Essa partida já começou", 409);
  }

  const people = await roster(room.id);

  if (people.length >= maxPlayers) {
    throw new ServiceError(`A mesa já está com ${maxPlayers} jogadores`, 409);
  }

  const name = cleanName(input.name);

  if (people.some((person) => person.name.toLowerCase() === name.toLowerCase())) {
    throw new ServiceError("Já tem alguém com esse nome na mesa", 409);
  }

  const player = checked(
    await client
      .from("lc_players")
      .insert({
        room_id: room.id,
        name,
        emoji: input.emoji ?? null,
        seat: Math.max(0, ...people.map((person) => person.seat)) + 1,
      })
      .select()
      .single(),
  ) as PlayerRow;

  const accessToken = randomUUID().replace(/-/g, "");

  checked(
    await client.from("lc_player_secrets").insert({
      room_id: room.id,
      player_id: player.id,
      access_token: accessToken,
    }),
  );

  return { code: room.code, playerId: player.id, accessToken, name };
}

export async function updateProfile(input: { code: string; token: string; emoji?: string | null; avatar?: string | null }) {
  const room = await loadRoom(input.code);
  const me = await loadPlayer(room, input.token);
  const patch: Record<string, unknown> = {};

  if (input.avatar !== undefined) {
    patch.avatar = input.avatar;
  }

  if (input.emoji !== undefined) {
    patch.emoji = input.emoji;
  }

  if (Object.keys(patch).length === 0) {
    throw new ServiceError("Nada para mudar", 422);
  }

  checked(await serverClient().from("lc_players").update(patch).eq("id", me.id));

  return roomState({ code: input.code, token: input.token });
}

export async function startMatch(input: { code: string; token: string }) {
  const room = await loadRoom(input.code);
  const me = await loadPlayer(room, input.token);

  if (room.phase !== RoomPhase.Lobby) {
    throw new ServiceError("Essa partida já começou", 409);
  }

  if (room.host_player_id && room.host_player_id !== me.id) {
    throw new ServiceError("Quem abriu a sala começa a partida", 403);
  }

  const people = await roster(room.id);

  if (people.length < minPlayers) {
    throw new ServiceError(`Precisa de pelo menos ${minPlayers} jogadores`, 409);
  }

  checked(
    await serverClient()
      .from("lc_rooms")
      .update({
        phase: RoomPhase.Playing,
        round_number: 1,
        starting_savings: startingSavingsFor(people.length),
        started_at: new Date().toISOString(),
      })
      .eq("id", room.id)
      .eq("phase", RoomPhase.Lobby),
  );

  return roomState({ code: input.code, token: input.token });
}

async function writeBill(input: { code: string; token: string; body: unknown; replaceBillId?: string }) {
  const room = await loadRoom(input.code);
  const me = await loadPlayer(room, input.token);
  const people = await roster(room.id);
  const ids = people.map((person) => person.id);
  const check = checkBillDraft(input.body, ids);

  if (!check.ok) {
    throw new ServiceError(check.error, 422);
  }

  const draft = check.draft;
  let createdBy = me.id;

  if (input.replaceBillId) {
    const bills = await billsOf(room.id);
    const latest = bills[bills.length - 1];

    if (!latest || latest.id !== input.replaceBillId) {
      throw new ServiceError("Só dá para corrigir a última conta lançada", 409);
    }

    const allowed = [latest.created_by, latest.payer_id, room.host_player_id].includes(me.id);

    if (!allowed) {
      throw new ServiceError("Só quem lançou, quem pagou ou o dono da sala corrige essa conta", 403);
    }

    createdBy = latest.created_by ?? me.id;
  }

  const breakdown = computeBill(draft);
  const shares = splitBill({
    total: breakdown.total,
    split: draft.split,
    payerId: draft.payerId,
    playerIds: ids,
  });
  const detail: BillDetail = {
    tapas: draft.tapas,
    burnt: draft.burnt,
    burntPremium: draft.burntPremium,
    wine: draft.wine,
    cake: draft.cake,
    tips: draft.tips,
    split: draft.split,
    breakdown,
  };

  const { error } = await serverClient().rpc("lc_record_bill", {
    p_room_id: room.id,
    p_round: draft.roundNumber,
    p_payer: draft.payerId,
    p_created_by: createdBy,
    p_total: breakdown.total,
    p_split_mode: draft.split.mode,
    p_detail: detail,
    p_shares: shares.map((share) => ({ player_id: share.playerId, amount: share.amount })),
    p_replace_bill: input.replaceBillId ?? null,
  });

  if (error) {
    throw billFailure(error);
  }

  return roomState({ code: input.code, token: input.token });
}

export function recordBill(input: { code: string; token: string; body: unknown }) {
  return writeBill(input);
}

export function replaceBill(input: { code: string; token: string; billId: string; body: unknown }) {
  return writeBill({ code: input.code, token: input.token, body: input.body, replaceBillId: input.billId });
}

export async function undoBill(input: { code: string; token: string; billId: string }) {
  const room = await loadRoom(input.code);
  const me = await loadPlayer(room, input.token);
  const bills = await billsOf(room.id);
  const latest = bills[bills.length - 1];

  if (!latest || latest.id !== input.billId) {
    throw new ServiceError("Só dá para desfazer a última conta lançada", 409);
  }

  if (![latest.created_by, latest.payer_id, room.host_player_id].includes(me.id)) {
    throw new ServiceError("Só quem lançou, quem pagou ou o dono da sala desfaz essa conta", 403);
  }

  const { error } = await serverClient().rpc("lc_undo_bill", {
    p_room_id: room.id,
    p_bill_id: input.billId,
  });

  if (error) {
    throw billFailure(error);
  }

  return roomState({ code: input.code, token: input.token });
}

export async function removePlayer(input: { code: string; token: string; playerId: string }) {
  const room = await loadRoom(input.code);
  const me = await loadPlayer(room, input.token);
  const client = serverClient();

  if (room.host_player_id !== me.id) {
    throw new ServiceError("Só quem abriu a sala tira alguém da mesa", 403);
  }

  if (input.playerId === me.id) {
    throw new ServiceError("Para sair, use o botão Sair", 422);
  }

  if (room.phase === RoomPhase.Finished) {
    throw new ServiceError("A partida já acabou", 409);
  }

  const target = checked(
    await client.from("lc_players").select("id").eq("id", input.playerId).eq("room_id", room.id).maybeSingle(),
  );

  if (!target) {
    throw new ServiceError("Essa pessoa não está mais na mesa", 404);
  }

  checked(await client.from("lc_players").delete().eq("id", target.id as string));

  return roomState({ code: input.code, token: input.token });
}

export async function leaveRoom(input: { code: string; token: string }) {
  const room = await loadRoom(input.code);
  const me = await loadPlayer(room, input.token);
  const client = serverClient();
  const people = await roster(room.id);

  if (people.length <= 1) {
    checked(await client.from("lc_rooms").delete().eq("id", room.id));

    return { left: true as const, lastOne: true as const };
  }

  checked(await client.from("lc_players").delete().eq("id", me.id));

  if (room.host_player_id === me.id) {
    const next = people.find((person) => person.id !== me.id);

    checked(await client.from("lc_rooms").update({ host_player_id: next?.id ?? null }).eq("id", room.id));
  }

  return { left: true as const, lastOne: false as const };
}

export { ServiceError };

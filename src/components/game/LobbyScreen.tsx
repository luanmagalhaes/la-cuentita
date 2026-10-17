"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Screen } from "@/components/ui/Screen";
import { Wordmark } from "@/components/ui/Wordmark";
import { faces } from "@/data/faces";
import { minPlayers, maxPlayers } from "@/lib/game/limits";
import { shrinkToBlob } from "@/lib/photo";
import { startingSavingsFor } from "@/lib/game/rules";
import type { PlayerRow, RoomRow } from "@/types/room";

interface LobbyScreenProps {
  room: RoomRow;
  players: PlayerRow[];
  meId: string | null;
  isHost: boolean;
  busy: boolean;
  error: string | null;
  onStart: () => void;
  onLeave: () => void;
  onEmoji: (emoji: string) => void;
  onPhoto: (blob: Blob) => void;
  onRemovePlayer: (playerId: string) => void;
}

export function LobbyScreen({
  room,
  players,
  meId,
  isHost,
  busy,
  error,
  onStart,
  onLeave,
  onEmoji,
  onPhoto,
  onRemovePlayer,
}: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const [confirmingStart, setConfirmingStart] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState<string | null>(null);
  const pendingRemoval = players.find((person) => person.id === confirmingRemoval) ?? null;
  const [photoTrouble, setPhotoTrouble] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const enough = players.length >= minPlayers;
  const me = players.find((person) => person.id === meId) ?? null;
  const hostName = players.find((person) => person.id === room.host_player_id)?.name ?? null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setPhotoTrouble(null);

    try {
      onPhoto(await shrinkToBlob(file));
    } catch {
      setPhotoTrouble("Não consegui usar essa foto. Tente outra.");
    }
  };

  return (
    <Screen
      wide
      footer={
        isHost ? (
          <Button
            variant="ink"
            size="lg"
            fullWidth
            disabled={busy || !enough}
            onClick={() => setConfirmingStart(true)}
          >
            {enough
              ? "Começar a partida"
              : `Faltam ${minPlayers - players.length} para começar`}
          </Button>
        ) : (
          <p className="text-center text-sm font-semibold text-ink/60">
            {hostName ? `${hostName} começa a partida` : "Esperando quem abriu a sala"}
          </p>
        )
      }
    >
      {confirmingStart ? (
        <ConfirmModal
          title="Começar a partida?"
          tone="calm"
          busy={busy}
          confirmLabel="Bora"
          cancelLabel="Ainda não"
          body={
            <>
              <p>
                A mesa fecha com <strong className="text-ink">{players.length} jogadores</strong>.
                Quem chegar depois não entra mais.
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-xs">
                <li className="rounded-xl bg-sky/50 px-3 py-2">
                  Quem pedir a conta lança no celular dele
                </li>
                <li className="rounded-xl bg-sky/50 px-3 py-2">
                  A conta sai da poupança de quem pagou
                </li>
                <li className="rounded-xl bg-sky/50 px-3 py-2">
                  Cada um começa com {startingSavingsFor(players.length)}€
                </li>
              </ul>
            </>
          }
          onCancel={() => setConfirmingStart(false)}
          onConfirm={() => {
            setConfirmingStart(false);
            onStart();
          }}
        />
      ) : null}

      {pendingRemoval ? (
        <ConfirmModal
          title={`Tirar ${pendingRemoval.name} da sala?`}
          tone="danger"
          busy={busy}
          confirmLabel="Tirar da sala"
          cancelLabel="Deixa quieto"
          body={
            <p>
              <strong className="text-ink">{pendingRemoval.name}</strong> sai da sala agora. Se
              entrou por engano, dá para voltar com o código {room.code} antes de a partida começar.
            </p>
          }
          onCancel={() => setConfirmingRemoval(null)}
          onConfirm={() => {
            onRemovePlayer(pendingRemoval.id);
            setConfirmingRemoval(null);
          }}
        />
      ) : null}

      <header className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onLeave}
          className="display cursor-pointer rounded-xl px-2 py-1 text-sm text-ink/60 transition-colors hover:text-ink"
        >
          ← Sair
        </button>
        <Wordmark size="sm" className="opacity-50" />
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={copyCode}
            className="cursor-pointer rounded-3xl border-2 border-ink bg-aqua p-6 text-center text-ink shadow-[0_6px_0_var(--color-ink)] transition-transform hover:-translate-y-[2px] active:translate-y-[2px]"
          >
            <span className="display block text-xs uppercase tracking-[0.2em] opacity-65">
              Código da sala
            </span>
            <span className="display mt-2 block pb-1 text-5xl leading-tight tracking-[0.2em] sm:text-6xl">
              {room.code}
            </span>
            <span className="mt-2 block text-xs font-semibold opacity-70">
              {copied ? "Código copiado!" : "Toque para copiar"}
            </span>
          </button>

          <section className="rounded-3xl border-2 border-ink bg-cream p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="display text-lg text-ink">Sua cara</h2>
                <p className="text-xs font-semibold text-ink/55">
                  Escolha um emoji ou mande uma foto
                </p>
              </div>
              <Avatar name={me?.name ?? "?"} photo={me?.avatar ?? null} emoji={me?.emoji ?? null} size="lg" />
            </div>

            <div className="grid grid-cols-8 gap-1.5">
              {faces.map((face) => (
                <button
                  key={face}
                  type="button"
                  disabled={busy}
                  onClick={() => onEmoji(face)}
                  aria-pressed={me?.emoji === face}
                  className={`cursor-pointer rounded-xl border-2 py-1.5 text-xl transition-transform hover:scale-110 disabled:opacity-50 ${
                    me?.emoji === face ? "border-ink bg-gold" : "border-transparent bg-paper/70"
                  }`}
                >
                  {face}
                </button>
              ))}
            </div>

            <input
              ref={picker}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void pickPhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />

            <div className="mt-3">
              <Button variant="paper" fullWidth disabled={busy} onClick={() => picker.current?.click()}>
                Usar uma foto
              </Button>
            </div>

            {photoTrouble ? (
              <p className="mt-2 text-xs font-semibold text-flame">{photoTrouble}</p>
            ) : null}
          </section>
        </div>

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="display text-xl text-ink">Na mesa</h2>
            <span className="text-sm font-semibold text-ink/55">
              {players.length} de {maxPlayers}
            </span>
          </div>

          <ul className="flex flex-col gap-2">
            {players.map((person, index) => (
              <li
                key={person.id}
                className="animate-rise-in flex items-center gap-3 rounded-2xl border-2 border-ink bg-paper p-3"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Avatar name={person.name} photo={person.avatar} emoji={person.emoji} size="md" />
                <span className="display min-w-0 flex-1 truncate text-ink">
                  {person.name}
                  {person.id === meId ? " (você)" : ""}
                </span>
                {person.id === room.host_player_id ? (
                  <span className="display rounded-full bg-navy px-2.5 py-1 text-[0.6rem] text-paper">
                    Dono
                  </span>
                ) : null}
                {isHost && person.id !== meId ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingRemoval(person.id)}
                    disabled={busy}
                    aria-label={`Tirar ${person.name} da sala`}
                    className="display shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs text-ink/40 transition-colors hover:bg-flame hover:text-paper disabled:cursor-not-allowed"
                  >
                    Tirar
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          {error ? (
            <p className="mt-3 rounded-2xl border-2 border-ink bg-flame-soft p-3 text-sm font-semibold text-ink">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Screen>
  );
}

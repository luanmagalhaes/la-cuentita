"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { BillSheet } from "@/components/bill/BillSheet";
import { BankruptSlam } from "@/components/fx/BankruptSlam";
import { BillSlam } from "@/components/fx/BillSlam";
import { HomeScreen } from "@/components/game/HomeScreen";
import { HowToPlay } from "@/components/game/HowToPlay";
import { JoinScreen } from "@/components/game/JoinScreen";
import { LobbyScreen } from "@/components/game/LobbyScreen";
import { OutOfRoomScreen } from "@/components/game/OutOfRoomScreen";
import { TableScreen } from "@/components/game/TableScreen";
import { VictoryScreen } from "@/components/game/VictoryScreen";
import { HistoryScreen } from "@/components/history/HistoryScreen";
import { TroubleBanner } from "@/components/ui/TroubleBanner";
import { useRoom } from "@/hooks/useRoom";
import { useSession } from "@/hooks/useSession";
import { api } from "@/lib/api";
import { readableError } from "@/lib/friendly";
import { legacyBurnts } from "@/lib/game/bill";
import { broke, ranked, winners } from "@/lib/game/standings";
import { markSeen, seenSnapshot, serverSeenSnapshot, subscribeSeen } from "@/lib/seen";
import { applyMuted, sound, unlockSound } from "@/lib/sound";
import {
  mutedSnapshot,
  rememberMuted,
  rememberTutorialSeen,
  serverMutedSnapshot,
  serverTutorialSnapshot,
  subscribeMatch,
  tutorialSnapshot,
} from "@/lib/storage";
import { RoomPhase, type BillDraft, type BillView } from "@/types/room";

type View = "HOME" | "CREATE" | "JOIN" | "HISTORY";

type OpenSheet = { roundNumber: number; bill: BillView | null };

function draftFromBill(bill: BillView, fallbackPayer: string): BillDraft {
  return {
    roundNumber: bill.round_number,
    payerId: bill.payer_id ?? fallbackPayer,
    tapas: bill.detail.tapas,
    burnts: bill.detail.burnts ?? legacyBurnts(bill.detail.burnt, bill.detail.burntPremium),
    wine: bill.detail.wine,
    cake: bill.detail.cake,
    tips: bill.detail.tips,
    split: bill.detail.split,
  };
}

export function CuentitaApp() {
  const { session, seats, save, clear, forget, seatFor } = useSession();
  const [view, setView] = useState<View>("HOME");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askedRules, setAskedRules] = useState(false);
  const [sheet, setSheet] = useState<OpenSheet | null>(null);

  const tutorialSeen = useSyncExternalStore(subscribeMatch, tutorialSnapshot, serverTutorialSnapshot);
  const quiet = useSyncExternalStore(subscribeMatch, mutedSnapshot, serverMutedSnapshot);
  const { state, gone, trouble, refresh } = useRoom(session?.code ?? null, session?.accessToken ?? null);
  const roomId = state?.room.id ?? null;
  const seen = useSyncExternalStore(
    subscribeSeen,
    () => (roomId ? seenSnapshot(roomId) : null),
    serverSeenSnapshot,
  );
  const latest = state ? (state.bills[state.bills.length - 1] ?? null) : null;

  useEffect(() => {
    applyMuted(quiet);
  }, [quiet]);

  useEffect(() => {
    const prime = () => unlockSound();

    window.addEventListener("pointerdown", prime, { once: true });

    return () => window.removeEventListener("pointerdown", prime);
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = window.setTimeout(() => setError(null), 5000);

    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!state || !roomId) {
      return;
    }

    const latestRound = latest?.round_number ?? 0;

    if (seen === null) {
      markSeen(roomId, { round: latestRound, billId: latest?.id ?? null, finishedAt: state.room.finished_at });

      return;
    }

    if (latestRound < seen.round) {
      markSeen(roomId, { round: latestRound, billId: latest?.id ?? null, finishedAt: seen.finishedAt });
    }
  }, [state, roomId, seen, latest]);

  const run = useCallback(async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);

    try {
      await work();
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setBusy(false);
    }
  }, []);

  const leave = () =>
    run(async () => {
      if (session) {
        await api.leave(session.code, session.accessToken).catch(() => null);
        forget(session.code);
      }

      clear();
      setView("HOME");
    });

  const showRules = askedRules || !tutorialSeen;
  const rulesGate = showRules ? (
    <HowToPlay
      onClose={() => {
        rememberTutorialSeen();
        setAskedRules(false);
      }}
    />
  ) : null;

  if (!session) {
    if (view === "HISTORY") {
      return <HistoryScreen onBack={() => setView("HOME")} />;
    }

    if (view === "CREATE" || view === "JOIN") {
      return (
        <>
          {rulesGate}
          <JoinScreen
            mode={view}
            busy={busy}
            error={error}
            onBack={() => setView("HOME")}
            onSubmit={(input) =>
              run(async () => {
                if (view === "JOIN") {
                  const known = seatFor(input.code, input.name);
                  const stillSeated = known
                    ? await api.state(known.code, known.accessToken).then(
                        (room) => room.meId !== null,
                        () => false,
                      )
                    : false;

                  if (known && stillSeated) {
                    save({
                      code: known.code,
                      playerId: known.playerId,
                      accessToken: known.accessToken,
                      name: known.name,
                    });
                    setView("HOME");

                    return;
                  }

                  if (known) {
                    forget(known.code);
                  }
                }

                const result =
                  view === "CREATE"
                    ? await api.createRoom(input.name, input.emoji)
                    : await api.joinRoom(input.code, input.name, input.emoji);

                save(result);
                setView("HOME");
              })
            }
          />
        </>
      );
    }

    return (
      <>
        {rulesGate}
        <HomeScreen
          seats={seats}
          onResume={(seat) =>
            save({ code: seat.code, playerId: seat.playerId, accessToken: seat.accessToken, name: seat.name })
          }
          onForget={forget}
          onCreate={() => setView("CREATE")}
          onJoin={() => setView("JOIN")}
          onRules={() => setAskedRules(true)}
          onHistory={() => setView("HISTORY")}
        />
      </>
    );
  }

  const leaveForGood = () => {
    forget(session.code);
    clear();
    setView("HOME");
  };

  if (gone) {
    return (
      <OutOfRoomScreen
        title="Essa sala acabou"
        message={`A sala ${session.code} não existe mais. Cada sala some 24 horas depois de aberta. Para jogar, abra uma nova.`}
        onHome={leaveForGood}
      />
    );
  }

  if (!state || state.room.code.toUpperCase() !== session.code.toUpperCase()) {
    return (
      <div className="stage-orange flex min-h-dvh flex-col items-center justify-center gap-4 px-8">
        <p className="display text-2xl text-ink">Entrando no bar...</p>
        {trouble ? (
          <p role="alert" className="max-w-xs rounded-2xl border-2 border-ink bg-flame-soft px-4 py-3 text-center text-sm font-semibold text-ink">
            {trouble}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            clear();
            setView("HOME");
          }}
          className="display rounded-xl px-3 py-2 text-base text-ink/60 hover:text-ink"
        >
          Voltar para o início
        </button>
      </div>
    );
  }

  const me = state.players.find((person) => person.id === state.meId) ?? null;
  const isHost = state.room.host_player_id !== null && state.room.host_player_id === state.meId;
  const canTouchLatest =
    latest !== null && state.meId !== null && [latest.created_by, latest.payer_id, state.room.host_player_id].includes(state.meId);
  const removePlayer = (playerId: string) =>
    run(async () => {
      await api.removePlayer(session.code, session.accessToken, playerId);
      await refresh();
    });
  const undoBill = (bill: BillView) =>
    run(async () => {
      await api.undoBill(session.code, session.accessToken, bill.id);
      await refresh();
    });

  if (!me && state.room.phase !== RoomPhase.Finished) {
    return (
      <OutOfRoomScreen
        title="Você não está mais nesta mesa"
        message={
          state.room.phase === RoomPhase.Lobby
            ? `Quem abriu a sala tirou você, ou o código ${state.room.code} já é de outra sala. Para entrar, use o código de novo.`
            : `Quem abriu a sala tirou você, ou o código ${state.room.code} já é de outra partida. Como ela já começou, não dá para entrar nela.`
        }
        onHome={leaveForGood}
      />
    );
  }

  const pendingBill =
    seen && latest && (latest.round_number > seen.round || (latest.round_number === seen.round && latest.id !== seen.billId))
      ? latest
      : null;
  const pendingFinish =
    !pendingBill && seen !== null && state.room.phase === RoomPhase.Finished && seen.finishedAt !== state.room.finished_at;

  const billSlam =
    pendingBill && roomId ? (
      <BillSlam
        key={pendingBill.id}
        bill={pendingBill}
        players={state.players}
        meId={state.meId}
        onDone={() =>
          markSeen(roomId, {
            round: pendingBill.round_number,
            billId: pendingBill.id,
            finishedAt: seen?.finishedAt ?? null,
          })
        }
      />
    ) : null;

  if (state.room.phase === RoomPhase.Finished) {
    const finalBoard = ranked(state.players);

    return (
      <>
        <TroubleBanner message={trouble} />
        {billSlam}
        {pendingFinish && roomId ? (
          <BankruptSlam
            broke={broke(state.players)}
            meId={state.meId}
            onDone={() =>
              markSeen(roomId, {
                round: latest?.round_number ?? 0,
                billId: latest?.id ?? null,
                finishedAt: state.room.finished_at,
              })
            }
          />
        ) : null}
        {pendingBill || pendingFinish ? null : (
          <VictoryScreen
            winners={winners(state.players)}
            ranked={finalBoard}
            bars={state.bills.length}
            meId={state.meId}
            canUndo={canTouchLatest}
            busy={busy}
            onUndo={() => {
              if (latest) {
                void undoBill(latest);
              }
            }}
            onNewTable={leaveForGood}
          />
        )}
      </>
    );
  }

  if (state.room.phase === RoomPhase.Lobby) {
    return (
      <>
        {rulesGate}
        <TroubleBanner message={trouble} />
        <LobbyScreen
          room={state.room}
          players={state.players}
          meId={state.meId}
          isHost={isHost}
          busy={busy}
          error={error}
          onStart={() => run(() => api.start(session.code, session.accessToken).then(() => refresh()))}
          onLeave={leave}
          onRemovePlayer={removePlayer}
          onEmoji={(emoji) =>
            run(async () => {
              await api.setEmoji(session.code, session.accessToken, emoji);
              await refresh();
            })
          }
          onPhoto={(blob) =>
            run(async () => {
              await api.sendAvatar(session.code, session.accessToken, blob);
              await refresh();
            })
          }
        />
      </>
    );
  }

  return (
    <>
      {rulesGate}
      <TroubleBanner message={trouble} />
      {billSlam}

      {sheet && me ? (
        <BillSheet
          key={`${sheet.roundNumber}-${sheet.bill?.id ?? "new"}`}
          roundNumber={sheet.roundNumber}
          meId={me.id}
          players={state.players}
          initial={sheet.bill ? draftFromBill(sheet.bill, me.id) : undefined}
          refunds={sheet.bill?.shares ?? []}
          busy={busy}
          error={error}
          onBack={() => setSheet(null)}
          onSave={(draft) =>
            run(async () => {
              if (sheet.bill) {
                await api.replaceBill(session.code, session.accessToken, sheet.bill.id, draft);
              } else {
                await api.saveBill(session.code, session.accessToken, draft);
              }

              sound.saved();
              setSheet(null);
              await refresh();
            })
          }
        />
      ) : null}

      <TableScreen
        room={state.room}
        players={state.players}
        bills={state.bills}
        meId={state.meId}
        isHost={isHost}
        busy={busy}
        error={error}
        quiet={quiet}
        onQuiet={(next) => rememberMuted(next)}
        onLaunchBill={() => setSheet({ roundNumber: state.room.round_number, bill: null })}
        onFixBill={(bill) => setSheet({ roundNumber: bill.round_number, bill })}
        onUndoBill={undoBill}
        onRemovePlayer={removePlayer}
        onRules={() => setAskedRules(true)}
        onLeave={leave}
      />
    </>
  );
}

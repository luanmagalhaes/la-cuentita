"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  clearSession,
  forgetSeat,
  saveSession,
  seatFor,
  seatsSnapshot,
  serverSeatsSnapshot,
  serverSessionSnapshot,
  sessionSnapshot,
  subscribeSeats,
  subscribeSession,
  type Session,
} from "@/lib/session";

export function useSession() {
  const session = useSyncExternalStore(subscribeSession, sessionSnapshot, serverSessionSnapshot);
  const seats = useSyncExternalStore(subscribeSeats, seatsSnapshot, serverSeatsSnapshot);

  const save = useCallback((next: Session) => saveSession(next), []);
  const clear = useCallback(() => clearSession(), []);
  const forget = useCallback((code: string) => forgetSeat(code), []);

  return { session, seats, save, clear, forget, seatFor };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type RoomState } from "@/lib/api";
import { readableError } from "@/lib/friendly";

const pollMs = 1500;

function seatKey(code: string, token: string | null): string {
  return `${code}:${token ?? ""}`;
}

function roomIsGone(cause: unknown): boolean {
  return cause instanceof ApiError && cause.status === 404;
}

interface Snapshot {
  key: string;
  state: RoomState;
}

export function useRoom(code: string | null, token: string | null) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [goneKey, setGoneKey] = useState<string | null>(null);
  const [trouble, setTrouble] = useState<{ key: string; message: string } | null>(null);
  const sequence = useRef(0);
  const key = code ? seatKey(code, token) : null;

  const load = useCallback(async () => {
    if (!code) {
      return;
    }

    const current = seatKey(code, token);
    sequence.current += 1;
    const ticket = sequence.current;

    try {
      const next = await api.state(code, token ?? undefined);

      if (ticket === sequence.current) {
        setSnapshot({ key: current, state: next });
        setTrouble(null);
      }
    } catch (cause) {
      if (ticket !== sequence.current) {
        return;
      }

      if (roomIsGone(cause)) {
        setGoneKey(current);

        return;
      }

      setTrouble({ key: current, message: readableError(cause) });
    }
  }, [code, token]);

  useEffect(() => {
    if (!code) {
      return;
    }

    let alive = true;
    let timer = 0;

    const loop = async () => {
      if (!alive) {
        return;
      }

      await load();

      if (alive) {
        timer = window.setTimeout(() => void loop(), pollMs);
      }
    };

    timer = window.setTimeout(() => void loop(), 0);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [code, load]);

  return {
    state: snapshot && snapshot.key === key ? snapshot.state : null,
    gone: key !== null && goneKey === key,
    trouble: trouble && trouble.key === key ? trouble.message : null,
    refresh: load,
  };
}

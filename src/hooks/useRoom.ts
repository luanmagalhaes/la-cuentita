"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type RoomState } from "@/lib/api";
import { readableError } from "@/lib/friendly";

const pollMs = 1500;

function seatKey(code: string, token: string | null): string {
  return `${code}:${token ?? ""}`;
}

function roomIsGone(cause: unknown): boolean {
  return cause instanceof ApiError && cause.status === 404;
}

export function useRoom(code: string | null, token: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [goneKey, setGoneKey] = useState<string | null>(null);
  const [trouble, setTrouble] = useState<string | null>(null);
  const key = code ? seatKey(code, token) : null;

  const absorb = useCallback(
    (cause: unknown) => {
      if (!code) {
        return;
      }

      if (roomIsGone(cause)) {
        setGoneKey(seatKey(code, token));

        return;
      }

      setTrouble(readableError(cause));
    },
    [code, token],
  );

  const refresh = useCallback(async () => {
    if (!code) {
      return;
    }

    try {
      setState(await api.state(code, token ?? undefined));
      setTrouble(null);
    } catch (cause) {
      absorb(cause);
    }
  }, [code, token, absorb]);

  useEffect(() => {
    if (!code) {
      return;
    }

    let alive = true;

    const tick = async () => {
      if (!alive) {
        return;
      }

      try {
        const next = await api.state(code, token ?? undefined);

        if (alive) {
          setState(next);
          setTrouble(null);
        }
      } catch (cause) {
        if (alive) {
          absorb(cause);
        }
      }
    };

    void tick();

    const timer = window.setInterval(() => void tick(), pollMs);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [code, token, absorb]);

  return {
    state: code ? state : null,
    gone: key !== null && goneKey === key,
    trouble: code ? trouble : null,
    refresh,
  };
}

export interface SeenMark {
  round: number;
  billId: string | null;
  finishedAt: string | null;
}

const prefix = "lacuentita.seen.";
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: SeenMark | null }>();

function read(roomId: string): string | null {
  try {
    return window.localStorage.getItem(prefix + roomId);
  } catch {
    return null;
  }
}

export function subscribeSeen(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function seenSnapshot(roomId: string): SeenMark | null {
  const raw = read(roomId);
  const hit = cache.get(roomId);

  if (hit && hit.raw === raw) {
    return hit.value;
  }

  let value: SeenMark | null = null;

  try {
    value = raw ? (JSON.parse(raw) as SeenMark) : null;
  } catch {
    value = null;
  }

  cache.set(roomId, { raw, value });

  return value;
}

export function serverSeenSnapshot(): SeenMark | null {
  return null;
}

export function markSeen(roomId: string, mark: SeenMark) {
  try {
    window.localStorage.setItem(prefix + roomId, JSON.stringify(mark));
  } catch {
    return;
  }

  listeners.forEach((listener) => listener());
}

export interface Session {
  code: string;
  playerId: string;
  accessToken: string;
  name: string;
}

const key = "lacuentita.session";
const recentKey = "lacuentita.recent";
const maxRecent = 6;
const listeners = new Set<() => void>();
const seatListeners = new Set<() => void>();
const emptySeats: RecentSeat[] = [];

let cachedRaw: string | null = null;
let cached: Session | null = null;
let cachedSeatsRaw: string | null = null;
let cachedSeats: RecentSeat[] = emptySeats;
let bootstrapped = false;

export interface RecentSeat {
  code: string;
  name: string;
  accessToken: string;
  playerId: string;
  savedAt: number;
}

function store(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key) ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

function bootstrap() {
  if (bootstrapped || typeof window === "undefined") {
    return;
  }

  bootstrapped = true;

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const token = params.get("token");

  if (!code || !token || process.env.NODE_ENV === "production") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        code: code.toUpperCase(),
        playerId: "",
        accessToken: token,
        name: params.get("name") ?? "Jogador",
      }),
    );
  } catch {
    return;
  } finally {
    window.history.replaceState({}, "", window.location.pathname);
  }
}

function readRecent(): RecentSeat[] {
  try {
    const raw = window.localStorage.getItem(recentKey);
    const parsed = raw ? (JSON.parse(raw) as RecentSeat[]) : [];

    return Array.isArray(parsed) ? parsed.filter((seat) => seat.code && seat.accessToken) : [];
  } catch {
    return [];
  }
}

function writeRecent(seats: RecentSeat[]) {
  try {
    window.localStorage.setItem(recentKey, JSON.stringify(seats.slice(0, maxRecent)));
  } catch {
    return;
  }

  seatListeners.forEach((listener) => listener());
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function sessionSnapshot(): Session | null {
  bootstrap();

  let raw: string | null = null;

  try {
    raw = store()?.getItem(key) ?? null;
  } catch {
    raw = null;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;

    try {
      const parsed = raw ? (JSON.parse(raw) as Session) : null;

      cached = parsed?.code && parsed.accessToken ? parsed : null;
    } catch {
      cached = null;
    }
  }

  return cached;
}

export function serverSessionSnapshot(): Session | null {
  return null;
}

export function saveSession(next: Session) {
  try {
    (store() ?? window.localStorage).setItem(key, JSON.stringify(next));
  } catch {
    return;
  }

  rememberSeat(next);
  listeners.forEach((listener) => listener());
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  } catch {
    return;
  }

  listeners.forEach((listener) => listener());
}

export function subscribeSeats(listener: () => void): () => void {
  seatListeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    seatListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function seatsSnapshot(): RecentSeat[] {
  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(recentKey);
  } catch {
    raw = null;
  }

  if (raw !== cachedSeatsRaw) {
    cachedSeatsRaw = raw;
    cachedSeats = readRecent();
  }

  return cachedSeats;
}

export function serverSeatsSnapshot(): RecentSeat[] {
  return emptySeats;
}

export function rememberSeat(session: Session) {
  const seats = readRecent().filter(
    (seat) => !(seat.code === session.code && seat.name === session.name),
  );

  writeRecent([
    {
      code: session.code,
      name: session.name,
      accessToken: session.accessToken,
      playerId: session.playerId,
      savedAt: Date.now(),
    },
    ...seats,
  ]);
}

export function seatFor(code: string, name: string): RecentSeat | null {
  const wanted = code.trim().toUpperCase();
  const who = name.trim().toLowerCase();

  return (
    readRecent().find(
      (seat) => seat.code === wanted && seat.name.trim().toLowerCase() === who,
    ) ?? null
  );
}

export function forgetSeat(code: string) {
  writeRecent(readRecent().filter((seat) => seat.code !== code.trim().toUpperCase()));
}

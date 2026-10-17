import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const aliases: Record<string, string> = {
  "/history": "/historico",
  "/historic": "/historico",
  "/historia": "/historico",
  "/ranking": "/historico",
  "/partidas": "/historico",
  "/home": "/",
  "/inicio": "/",
  "/room": "/",
  "/rooms": "/",
  "/salas": "/",
};

function normalizePath(pathname: string): string {
  let readable = pathname;

  try {
    readable = decodeURIComponent(pathname);
  } catch {
    readable = pathname;
  }

  const lowered = readable
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

  const trimmed =
    lowered.length > 1 && lowered.endsWith("/")
      ? lowered.slice(0, -1)
      : lowered;

  return aliases[trimmed] ?? trimmed;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalized = normalizePath(pathname);

  if (normalized === pathname) {
    return NextResponse.next();
  }

  const target = request.nextUrl.clone();

  target.pathname = normalized;

  return NextResponse.redirect(target);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\.).*)"],
};

const tutorialKey = "lacuentita.tutorial";
const mutedKey = "lacuentita.muted";
const listeners = new Set<() => void>();

function announce() {
  listeners.forEach((listener) => listener());
}

export function subscribeMatch(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function tutorialSnapshot(): boolean {
  try {
    return window.localStorage.getItem(tutorialKey) === "1";
  } catch {
    return false;
  }
}

export function serverTutorialSnapshot(): boolean {
  return true;
}

export function rememberTutorialSeen() {
  try {
    window.localStorage.setItem(tutorialKey, "1");
  } catch {
    return;
  }

  announce();
}

export function mutedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(mutedKey) === "1";
  } catch {
    return false;
  }
}

export function serverMutedSnapshot(): boolean {
  return false;
}

export function rememberMuted(next: boolean) {
  try {
    window.localStorage.setItem(mutedKey, next ? "1" : "0");
  } catch {
    return;
  }

  announce();
}

interface Note {
  hz: number;
  at: number;
  seconds: number;
  wave?: OscillatorType;
  gain?: number;
  slideTo?: number;
}

let context: AudioContext | null = null;
let muted = false;

function constructorFor(): typeof AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const scoped = window as Window & { webkitAudioContext?: typeof AudioContext };

  return window.AudioContext ?? scoped.webkitAudioContext ?? null;
}

function contextFor(): AudioContext | null {
  if (context) {
    return context;
  }

  const Ctor = constructorFor();

  if (!Ctor) {
    return null;
  }

  try {
    context = new Ctor();
  } catch {
    return null;
  }

  return context;
}

export function applyMuted(next: boolean) {
  muted = next;
}

export function unlockSound() {
  const audio = contextFor();

  if (audio && audio.state === "suspended") {
    void audio.resume().catch(() => undefined);
  }
}

function play(notes: readonly Note[]) {
  if (muted) {
    return;
  }

  const audio = contextFor();

  if (!audio) {
    return;
  }

  if (audio.state === "suspended") {
    void audio.resume().catch(() => undefined);
  }

  try {
    const start = audio.currentTime + 0.01;

    for (const note of notes) {
      const tone = audio.createOscillator();
      const level = audio.createGain();
      const from = start + note.at;
      const peak = note.gain ?? 0.12;

      tone.type = note.wave ?? "sine";
      tone.frequency.setValueAtTime(note.hz, from);

      if (note.slideTo) {
        tone.frequency.exponentialRampToValueAtTime(note.slideTo, from + note.seconds);
      }

      level.gain.setValueAtTime(0.0001, from);
      level.gain.exponentialRampToValueAtTime(peak, from + 0.014);
      level.gain.exponentialRampToValueAtTime(0.0001, from + note.seconds);

      tone.connect(level);
      level.connect(audio.destination);
      tone.start(from);
      tone.stop(from + note.seconds + 0.02);
    }
  } catch {
    return;
  }
}

export const sound = {
  tap: () => play([{ hz: 640, at: 0, seconds: 0.05, wave: "triangle", gain: 0.06 }]),

  pick: () => play([{ hz: 880, at: 0, seconds: 0.07, wave: "sine", gain: 0.08 }]),

  saved: () =>
    play([
      { hz: 587.33, at: 0, seconds: 0.09, wave: "triangle", gain: 0.1 },
      { hz: 880, at: 0.08, seconds: 0.16, wave: "triangle", gain: 0.1 },
    ]),

  flipSeven: () =>
    play([
      { hz: 523.25, at: 0, seconds: 0.11, wave: "square", gain: 0.09 },
      { hz: 659.25, at: 0.1, seconds: 0.11, wave: "square", gain: 0.09 },
      { hz: 783.99, at: 0.2, seconds: 0.11, wave: "square", gain: 0.1 },
      { hz: 1046.5, at: 0.3, seconds: 0.14, wave: "square", gain: 0.11 },
      { hz: 1318.5, at: 0.43, seconds: 0.36, wave: "triangle", gain: 0.13 },
      { hz: 1567.98, at: 0.47, seconds: 0.34, wave: "sine", gain: 0.09 },
    ]),

  bust: () =>
    play([
      { hz: 392, at: 0, seconds: 0.26, wave: "sawtooth", gain: 0.11, slideTo: 261.63 },
      { hz: 349.23, at: 0.26, seconds: 0.26, wave: "sawtooth", gain: 0.11, slideTo: 233.08 },
      { hz: 311.13, at: 0.52, seconds: 0.5, wave: "sawtooth", gain: 0.12, slideTo: 130.81 },
    ]),

  win: () =>
    play([
      { hz: 523.25, at: 0, seconds: 0.12, wave: "triangle", gain: 0.12 },
      { hz: 659.25, at: 0.12, seconds: 0.12, wave: "triangle", gain: 0.12 },
      { hz: 783.99, at: 0.24, seconds: 0.12, wave: "triangle", gain: 0.12 },
      { hz: 1046.5, at: 0.36, seconds: 0.42, wave: "triangle", gain: 0.14 },
    ]),
};

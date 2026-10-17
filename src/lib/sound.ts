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

  register: () =>
    play([
      { hz: 1318.5, at: 0, seconds: 0.07, wave: "square", gain: 0.07 },
      { hz: 1760, at: 0.06, seconds: 0.09, wave: "square", gain: 0.07 },
      { hz: 2637, at: 0.16, seconds: 0.5, wave: "triangle", gain: 0.1 },
      { hz: 3520, at: 0.18, seconds: 0.4, wave: "sine", gain: 0.05 },
    ]),

  sadTrombone: () =>
    play([
      { hz: 392, at: 0.55, seconds: 0.36, wave: "sawtooth", gain: 0.09 },
      { hz: 370, at: 0.92, seconds: 0.36, wave: "sawtooth", gain: 0.09 },
      { hz: 349.23, at: 1.29, seconds: 0.36, wave: "sawtooth", gain: 0.09 },
      { hz: 329.63, at: 1.66, seconds: 0.95, wave: "sawtooth", gain: 0.1, slideTo: 311.13 },
    ]),

  lucky: () =>
    play([
      { hz: 783.99, at: 0, seconds: 0.1, wave: "triangle", gain: 0.1 },
      { hz: 1046.5, at: 0.09, seconds: 0.1, wave: "triangle", gain: 0.1 },
      { hz: 1318.5, at: 0.18, seconds: 0.3, wave: "triangle", gain: 0.11 },
    ]),

  bankrupt: () =>
    play([
      { hz: 523.25, at: 0, seconds: 0.18, wave: "square", gain: 0.08, slideTo: 392 },
      { hz: 392, at: 0.2, seconds: 0.18, wave: "square", gain: 0.08, slideTo: 293.66 },
      { hz: 293.66, at: 0.4, seconds: 0.22, wave: "square", gain: 0.09, slideTo: 196 },
      { hz: 196, at: 0.64, seconds: 1.1, wave: "sawtooth", gain: 0.1, slideTo: 65.41 },
    ]),

  win: () =>
    play([
      { hz: 523.25, at: 0, seconds: 0.12, wave: "triangle", gain: 0.12 },
      { hz: 659.25, at: 0.12, seconds: 0.12, wave: "triangle", gain: 0.12 },
      { hz: 783.99, at: 0.24, seconds: 0.12, wave: "triangle", gain: 0.12 },
      { hz: 1046.5, at: 0.36, seconds: 0.3, wave: "triangle", gain: 0.14 },
      { hz: 783.99, at: 0.66, seconds: 0.12, wave: "triangle", gain: 0.12 },
      { hz: 1046.5, at: 0.78, seconds: 0.7, wave: "triangle", gain: 0.15 },
      { hz: 1318.5, at: 0.8, seconds: 0.66, wave: "sine", gain: 0.08 },
    ]),
};

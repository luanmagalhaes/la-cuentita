"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Wordmark } from "@/components/ui/Wordmark";
import { faces } from "@/data/faces";
import { maxNameLength } from "@/lib/game/limits";

interface JoinScreenProps {
  mode: "CREATE" | "JOIN";
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: (input: { name: string; code: string; emoji: string }) => void;
}

export function JoinScreen({ mode, busy, error, onBack, onSubmit }: JoinScreenProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [emoji, setEmoji] = useState(faces[0]);
  const creating = mode === "CREATE";
  const ready = name.trim().length > 0 && (creating || code.trim().length === 2);

  return (
    <Screen
      footer={
        <Button
          variant="ink"
          size="lg"
          fullWidth
          disabled={busy || !ready}
          onClick={() =>
            onSubmit({ name: name.trim(), code: code.trim().toUpperCase(), emoji })
          }
        >
          {busy ? "Um instante..." : creating ? "Criar a sala" : "Entrar"}
        </Button>
      }
    >
      <header className="mb-7">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="display cursor-pointer rounded-xl px-2 py-1 text-sm text-ink/60 transition-colors hover:text-ink"
          >
            ← Voltar
          </button>
          <Wordmark size="sm" className="opacity-50" />
        </div>
        <h1 className="display text-4xl text-ink">{creating ? "Criar sala" : "Entrar na sala"}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {creating
            ? "Você recebe um código para mandar pra galera."
            : "Peça o código de 2 números pra quem criou."}
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {creating ? null : (
          <label className="block">
            <span className="display mb-2 block text-xs uppercase tracking-[0.18em] text-ink/55">
              Código da sala
            </span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="00"
              maxLength={2}
              inputMode="numeric"
              autoComplete="off"
              className="display w-full rounded-2xl border-2 border-ink bg-paper px-4 py-4 text-2xl tracking-[0.3em] text-ink outline-none placeholder:text-ink/25 focus:ring-4 focus:ring-ink/20"
            />
          </label>
        )}

        <label className="block">
          <span className="display mb-2 block text-xs uppercase tracking-[0.18em] text-ink/55">
            Seu nome
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Como aparece no placar"
            maxLength={maxNameLength}
            autoComplete="off"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            lang="pt-BR"
            className="w-full rounded-2xl border-2 border-ink bg-paper px-4 py-4 text-lg text-ink outline-none placeholder:text-ink/30 focus:ring-4 focus:ring-ink/20"
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="display text-xs uppercase tracking-[0.18em] text-ink/55">
              Sua cara na mesa
            </span>
            <Avatar name={name || "?"} photo={null} emoji={emoji} size="md" />
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {faces.map((face) => (
              <button
                key={face}
                type="button"
                onClick={() => setEmoji(face)}
                aria-pressed={emoji === face}
                className={`cursor-pointer rounded-xl border-2 py-1.5 text-xl transition-transform hover:scale-110 ${
                  emoji === face ? "border-ink bg-gold" : "border-transparent bg-paper/70"
                }`}
              >
                {face}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink/55">
            Dá para trocar por uma foto depois, dentro da sala.
          </p>
        </div>

        {error ? (
          <p className="rounded-2xl border-2 border-ink bg-flame-soft p-4 text-sm font-semibold text-ink">
            {error}
          </p>
        ) : null}
      </div>
    </Screen>
  );
}

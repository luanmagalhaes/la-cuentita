"use client";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Wordmark } from "@/components/ui/Wordmark";

interface OutOfRoomScreenProps {
  title: string;
  message: string;
  onHome: () => void;
}

export function OutOfRoomScreen({ title, message, onHome }: OutOfRoomScreenProps) {
  return (
    <Screen
      footer={
        <Button variant="ink" size="lg" fullWidth onClick={onHome}>
          Voltar para o início
        </Button>
      }
    >
      <header className="mb-6 flex justify-end">
        <Wordmark size="sm" className="opacity-50" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span className="display text-3xl text-ink">{title}</span>
        <p className="max-w-xs text-sm font-semibold text-ink/60">{message}</p>
      </div>
    </Screen>
  );
}

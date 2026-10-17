"use client";

import { Screen } from "@/components/ui/Screen";
import { Wordmark } from "@/components/ui/Wordmark";

export function CuentitaApp() {
  return (
    <Screen>
      <div className="flex flex-1 items-center justify-center">
        <Wordmark size="lg" />
      </div>
    </Screen>
  );
}

"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmModalProps {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "calm";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  body,
  confirmLabel,
  cancelLabel = "Voltar",
  tone = "calm",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[58] flex items-end justify-center bg-ink/75 p-3 sm:items-center sm:p-4">
      <div className="animate-card-pop flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] border-4 border-ink bg-paper shadow-[0_14px_0_var(--color-ink)]">
        <div
          className={`shrink-0 px-5 py-4 ${tone === "danger" ? "bg-flame text-paper" : "bg-teal text-paper"}`}
        >
          <span className="display block text-xl leading-tight">{title}</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 text-sm text-ink/75">{body}</div>

        <div className="shrink-0 border-t-2 border-ink/10 px-5 pb-5 pt-4">
          <div className="flex flex-col gap-2">
            <Button
              variant={tone === "danger" ? "flame" : "ink"}
              size="lg"
              fullWidth
              disabled={busy}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
            <button
              type="button"
              onClick={onCancel}
              className="display cursor-pointer rounded-xl px-3 py-2 text-sm text-ink/55 transition-colors hover:text-ink"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

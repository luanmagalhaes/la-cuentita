"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PhotoCropper } from "@/components/ui/PhotoCropper";
import { ZoomablePhoto } from "@/components/ui/ZoomablePhoto";

interface MyPhotoProps {
  name: string;
  photo: string | null;
  emoji?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  busy?: boolean;
  action?: boolean;
  onPhoto: (photo: Blob) => void;
}

export function MyPhoto({
  name,
  photo,
  emoji = null,
  size = "md",
  busy = false,
  action = false,
  onPhoto,
}: MyPhotoProps) {
  const picker = useRef<HTMLInputElement>(null);
  const [cropping, setCropping] = useState<File | null>(null);

  const openPicker = () => picker.current?.click();

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <ZoomablePhoto
        name={name}
        photo={photo}
        emoji={emoji}
        size={size}
        canEdit
        busy={busy}
        onEdit={openPicker}
      />

      <input
        ref={picker}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            setCropping(file);
          }

          event.target.value = "";
        }}
      />

      {action ? (
        <Button variant="paper" disabled={busy} onClick={openPicker}>
          {photo ? "Trocar a foto" : "Usar uma foto"}
        </Button>
      ) : null}

      {cropping ? (
        <PhotoCropper
          file={cropping}
          busy={busy}
          onCancel={() => setCropping(null)}
          onDone={(blob) => {
            setCropping(null);
            onPhoto(blob);
          }}
        />
      ) : null}
    </div>
  );
}

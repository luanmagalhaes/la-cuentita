"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { PhotoViewer } from "@/components/ui/PhotoViewer";

interface ZoomablePhotoProps {
  name: string;
  photo: string | null;
  emoji?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  glow?: boolean;
  canEdit?: boolean;
  busy?: boolean;
  onEdit?: () => void;
}

function openLabelFor(name: string, photo: string | null): string {
  return photo ? `Ver a foto de ${name}` : `Pôr uma foto de ${name}`;
}

export function ZoomablePhoto({
  name,
  photo,
  emoji = null,
  size = "md",
  className = "",
  glow = false,
  canEdit = false,
  busy = false,
  onEdit,
}: ZoomablePhotoProps) {
  const [open, setOpen] = useState(false);

  if (!photo && !canEdit) {
    return <Avatar name={name} photo={null} emoji={emoji} size={size} className={className} glow={glow} />;
  }

  return (
    <>
      {open ? (
        <PhotoViewer
          name={name}
          photo={photo}
          emoji={emoji}
          canEdit={canEdit}
          busy={busy}
          onEdit={() => {
            setOpen(false);
            onEdit?.();
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={openLabelFor(name, photo)}
        className="shrink-0 rounded-2xl transition-transform active:scale-95"
      >
        <Avatar name={name} photo={photo} emoji={emoji} size={size} className={className} glow={glow} />
      </button>
    </>
  );
}

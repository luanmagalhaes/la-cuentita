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
}

export function ZoomablePhoto({ name, photo, emoji = null, size = "md", className = "", glow = false }: ZoomablePhotoProps) {
  const [open, setOpen] = useState(false);

  if (!photo) {
    return <Avatar name={name} photo={null} emoji={emoji} size={size} className={className} glow={glow} />;
  }

  return (
    <>
      {open ? <PhotoViewer name={name} photo={photo} onClose={() => setOpen(false)} /> : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver a foto de ${name}`}
        className="shrink-0 rounded-2xl transition-transform active:scale-95"
      >
        <Avatar name={name} photo={photo} emoji={emoji} size={size} className={className} glow={glow} />
      </button>
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";

interface ConfettiProps {
  running: boolean;
}

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  color: string;
  shape: 0 | 1;
}

const palette = ["#f2c14e", "#e8483c", "#05a2a2", "#a8d8ef", "#e58bb4", "#2b2f7e", "#7fd4d4"];

export function Confetti({ running }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !running) {
      return;
    }

    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (quiet) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const ratio = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const bits: Bit[] = [];
    let frame = 0;
    let alive = true;

    const spawn = (count: number) => {
      for (let index = 0; index < count; index += 1) {
        bits.push({
          x: Math.random() * width,
          y: -20 - Math.random() * height * 0.4,
          vx: (Math.random() - 0.5) * 1.6,
          vy: 1.6 + Math.random() * 2.6,
          size: 6 + Math.random() * 8,
          spin: (Math.random() - 0.5) * 0.24,
          angle: Math.random() * Math.PI,
          color: palette[Math.floor(Math.random() * palette.length)],
          shape: Math.random() > 0.45 ? 1 : 0,
        });
      }
    };

    spawn(150);

    const tick = () => {
      if (!alive) {
        return;
      }

      frame += 1;
      context.clearRect(0, 0, width, height);

      if (frame % 26 === 0 && bits.length < 320) {
        spawn(26);
      }

      for (let index = bits.length - 1; index >= 0; index -= 1) {
        const bit = bits[index];

        bit.x += bit.vx;
        bit.y += bit.vy;
        bit.vy += 0.012;
        bit.angle += bit.spin;

        if (bit.y > height + 40) {
          bits.splice(index, 1);

          continue;
        }

        context.save();
        context.translate(bit.x, bit.y);
        context.rotate(bit.angle);
        context.fillStyle = bit.color;

        if (bit.shape === 1) {
          context.fillRect(-bit.size / 2, -bit.size / 4, bit.size, bit.size / 2);
        } else {
          context.beginPath();
          context.arc(0, 0, bit.size / 2.6, 0, Math.PI * 2);
          context.fill();
        }

        context.restore();
      }

      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);

    return () => {
      alive = false;
      window.removeEventListener("resize", resize);
    };
  }, [running]);

  if (!running) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] h-full w-full"
    />
  );
}

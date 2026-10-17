import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = new URL("../../", import.meta.url);
const source = new URL("src/app/icon.svg", root);
const maskable = new URL("scripts/icons/maskable.svg", root);

const targets = [
  { from: source, to: "public/icon-192.png", size: 192 },
  { from: source, to: "public/icon-512.png", size: 512 },
  { from: source, to: "src/app/apple-icon.png", size: 180 },
  { from: maskable, to: "public/icon-maskable-512.png", size: 512 },
];

await mkdir(new URL("public/", root), { recursive: true });

for (const target of targets) {
  const svg = await readFile(target.from);
  const png = await sharp(svg, { density: 900 })
    .resize(target.size, target.size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(new URL(target.to, root), png);
  console.log(`${target.to} — ${target.size}x${target.size} — ${(png.length / 1024).toFixed(1)} kB`);
}

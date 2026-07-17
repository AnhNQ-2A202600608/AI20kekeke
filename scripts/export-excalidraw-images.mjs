import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const inputDir = path.resolve("docs/diagram/excalidraw");
const outputDir = path.resolve("docs/diagram/images");

fs.mkdirSync(outputDir, { recursive: true });

const paletteText = "#1e1e1e";
const margin = 40;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bounds(elements) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const el of elements) {
    if (el.isDeleted) continue;
    if (el.type === "arrow") {
      const xs = el.points.map((point) => el.x + point[0]);
      const ys = el.points.map((point) => el.y + point[1]);
      minX = Math.min(minX, ...xs);
      minY = Math.min(minY, ...ys);
      maxX = Math.max(maxX, ...xs);
      maxY = Math.max(maxY, ...ys);
      continue;
    }
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + (el.width || 0));
    maxY = Math.max(maxY, el.y + (el.height || 0));
  }
  return { minX, minY, maxX, maxY };
}

function renderText(el) {
  const lines = String(el.text || "").split("\n");
  const fontSize = el.fontSize || 14;
  const lineHeight = fontSize * (el.lineHeight || 1.25);
  const anchor =
    el.textAlign === "left" ? "start" : el.textAlign === "right" ? "end" : "middle";
  const x =
    el.textAlign === "left"
      ? el.x
      : el.textAlign === "right"
        ? el.x + el.width
        : el.x + el.width / 2;
  const totalHeight = lines.length * lineHeight;
  const startY =
    el.verticalAlign === "top"
      ? el.y + fontSize
      : el.verticalAlign === "bottom"
        ? el.y + el.height - totalHeight + fontSize
        : el.y + (el.height - totalHeight) / 2 + fontSize;

  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<tspan x="${x}" dy="${index === 0 ? 0 : dy}">${esc(line)}</tspan>`;
    })
    .join("");

  const fontFamily = el.fontFamily === 2 ? "Georgia, serif" : "Arial, sans-serif";
  const bg =
    el.backgroundColor && el.backgroundColor !== "transparent"
      ? `<rect x="${el.x - 4}" y="${el.y - 2}" width="${el.width + 8}" height="${el.height + 4}" fill="${el.backgroundColor}" rx="4"/>`
      : "";

  return `${bg}<text x="${x}" y="${startY}" fill="${el.strokeColor || paletteText}" font-size="${fontSize}" font-family="${fontFamily}" text-anchor="${anchor}">${tspans}</text>`;
}

function renderShape(el) {
  const fill = el.backgroundColor === "transparent" ? "none" : el.backgroundColor || "none";
  const strokeDash = el.strokeStyle === "dashed" ? ' stroke-dasharray="8 6"' : "";
  const stroke = el.strokeColor || "#1e1e1e";
  const sw = el.strokeWidth || 2;
  if (el.type === "ellipse") {
    return `<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${strokeDash}/>`;
  }
  return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${strokeDash}/>`;
}

function renderArrow(el) {
  const points = el.points.map((point) => [el.x + point[0], el.y + point[1]]);
  const d = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`)
    .join(" ");
  const stroke = el.strokeColor || "#495057";
  const end = el.endArrowhead ? ' marker-end="url(#arrowhead)"' : "";
  const start = el.startArrowhead ? ' marker-start="url(#arrowhead-start)"' : "";
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${el.strokeWidth || 2}"${start}${end}/>`;
}

function toSvg(diagram) {
  const active = diagram.elements.filter((el) => !el.isDeleted);
  const box = bounds(active);
  const width = Math.ceil(box.maxX - box.minX + margin * 2);
  const height = Math.ceil(box.maxY - box.minY + margin * 2);
  const tx = margin - box.minX;
  const ty = margin - box.minY;

  const shapes = active
    .filter((el) => el.type === "rectangle" || el.type === "ellipse")
    .map(renderShape)
    .join("\n");
  const arrows = active.filter((el) => el.type === "arrow").map(renderArrow).join("\n");
  const texts = active.filter((el) => el.type === "text").map(renderText).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#495057"/>
    </marker>
    <marker id="arrowhead-start" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M9,0 L9,6 L0,3 z" fill="#495057"/>
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g transform="translate(${tx}, ${ty})">
${shapes}
${arrows}
${texts}
  </g>
</svg>
`;
}

const files = fs
  .readdirSync(inputDir)
  .filter((file) => file.endsWith(".excalidraw"))
  .sort();

for (const file of files) {
  const source = path.join(inputDir, file);
  const base = path.basename(file, ".excalidraw");
  const svgPath = path.join(outputDir, `${base}.svg`);
  const pngPath = path.join(outputDir, `${base}.png`);
  const diagram = JSON.parse(fs.readFileSync(source, "utf8"));
  fs.writeFileSync(svgPath, toSvg(diagram), "utf8");
  execFileSync("magick", [svgPath, "-density", "180", "-background", "white", "-alpha", "remove", pngPath], {
    stdio: "pipe",
  });
}

console.log(`Exported ${files.length} diagrams to ${outputDir}`);

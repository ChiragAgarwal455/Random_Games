import { getHatchPattern } from './paperTexture';

export const INK_DARK = '#3B2820';
export const INK_SOFT = '#6B4F41';
export const INK_PENCIL = '#9B806D';

export function seededRand(seed: number): () => number {
  let s = Math.abs(Math.floor(seed)) % 2147483647 || 1337;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darkenHex(hex: string, factor = 0.18): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.round(r * (1 - factor))}, ${Math.round(g * (1 - factor))}, ${Math.round(b * (1 - factor))})`;
}

export function sketchLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed = 1,
  wobble = 1.1,
  color = INK_DARK,
  width = 2.0,
  doublePass = true
): void {
  const rand = seededRand(seed);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(2, Math.min(16, Math.ceil(dist / 22)));
  const nx = dist > 0.01 ? -dy / dist : 0;
  const ny = dist > 0.01 ? dx / dist : 0;

  const drawPass = (alpha: number, lw: number, wScale: number) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha *= alpha;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1 + (rand() - 0.5) * wobble * 0.4, y1 + (rand() - 0.5) * wobble * 0.4);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const offset = (rand() - 0.5) * wobble * wScale * (i === steps ? 0.35 : 1);
      ctx.lineTo(x1 + dx * t + nx * offset, y1 + dy * t + ny * offset);
    }
    ctx.stroke();
    ctx.restore();
  };

  drawPass(0.95, width, 1);
  if (doublePass) {
    drawPass(0.32, width * 0.72, 1.5);
  }
}

export function sketchRoundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 10,
  seed = 1,
  wobble = 0.85
): void {
  const rand = seededRand(seed);
  const rad = Math.min(r, w * 0.5, h * 0.5);
  const j = () => (rand() - 0.5) * wobble;

  ctx.beginPath();
  ctx.moveTo(x + rad + j(), y + j());
  ctx.lineTo(x + w - rad + j(), y + j());
  ctx.quadraticCurveTo(x + w + j(), y + j(), x + w + j(), y + rad + j());
  ctx.lineTo(x + w + j(), y + h - rad + j());
  ctx.quadraticCurveTo(x + w + j(), y + h + j(), x + w - rad + j(), y + h + j());
  ctx.lineTo(x + rad + j(), y + h + j());
  ctx.quadraticCurveTo(x + j(), y + h + j(), x + j(), y + h - rad + j());
  ctx.lineTo(x + j(), y + rad + j());
  ctx.quadraticCurveTo(x + j(), y + j(), x + rad + j(), y + j());
  ctx.closePath();
}

export function drawWatercolorRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: string,
  r = 10,
  seed = 1,
  strokeColor = INK_DARK,
  lineWidth = 2.0
): void {
  ctx.save();
  sketchRoundRectPath(ctx, x, y, w, h, r, seed, 0.9);
  const g = ctx.createLinearGradient(x, y, x + w * 0.3, y + h);
  g.addColorStop(0, fillColor);
  g.addColorStop(1, darkenHex(fillColor, 0.08));
  ctx.fillStyle = g;
  ctx.fill();

  // Soft watercolor edge ring
  ctx.strokeStyle = darkenHex(fillColor, 0.22);
  ctx.lineWidth = 2.6;
  ctx.globalAlpha *= 0.28;
  ctx.stroke();
  ctx.restore();

  if (lineWidth > 0) {
    ctx.save();
    sketchRoundRectPath(ctx, x, y, w, h, r, seed + 17, 1.0);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Faint pencil double-line
    sketchRoundRectPath(ctx, x + 0.6, y + 0.5, w, h, r, seed + 31, 1.45);
    ctx.globalAlpha *= 0.3;
    ctx.lineWidth = lineWidth * 0.7;
    ctx.stroke();
    ctx.restore();
  }
}

export function sketchEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fillColor: string | null,
  strokeColor: string | null = INK_DARK,
  lineWidth = 2.0,
  seed = 1,
  wobble = 0.85
): void {
  const rand = seededRand(seed);
  const segs = 24;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const dr = 1 + (rand() - 0.5) * 0.025 * wobble;
    const px = cx + Math.cos(a) * rx * dr;
    const py = cy + Math.sin(a) * ry * dr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor && lineWidth > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCastShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha = 0.24
): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx + 6, cy + 4, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(74, 50, 36, ${alpha * 0.55})`;
  ctx.fill();
  const hatch = getHatchPattern(ctx);
  if (hatch) {
    ctx.fillStyle = hatch;
    ctx.globalAlpha = alpha * 1.4;
    ctx.fill();
  }
  ctx.restore();
}

export function drawCuteHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color = '#DE7A84',
  stroke = true
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.bezierCurveTo(-size * 0.55, -size * 0.15, -size * 0.95, size * 0.35, 0, size * 0.95);
  ctx.bezierCurveTo(size * 0.95, size * 0.35, size * 0.55, -size * 0.15, 0, size * 0.35);
  ctx.fillStyle = color;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCuteSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color = '#F3BE5A'
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const xOut = Math.cos(a) * size;
    const yOut = Math.sin(a) * size;
    const xIn = Math.cos(a + Math.PI / 4) * size * 0.26;
    const yIn = Math.sin(a + Math.PI / 4) * size * 0.26;
    if (i === 0) ctx.moveTo(xOut, yOut);
    else ctx.lineTo(xOut, yOut);
    ctx.lineTo(xIn, yIn);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
}

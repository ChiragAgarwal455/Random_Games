let cachedPaperCanvas: HTMLCanvasElement | null = null;
let cachedHatchPattern: CanvasPattern | null = null;

export function getWatercolorPaperCanvas(width = 512, height = 512): HTMLCanvasElement {
  if (cachedPaperCanvas) return cachedPaperCanvas;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Warm cream base
  ctx.fillStyle = '#FAF3E3';
  ctx.fillRect(0, 0, width, height);

  // Cold-press fiber grain
  const img = ctx.getImageData(0, 0, width, height);
  const data = img.data;
  let seed = 4219;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const wave =
        Math.sin(x * 0.06 + y * 0.04) * 3.5 +
        Math.cos(x * 0.14 - y * 0.11) * 2.5 +
        (rand() - 0.5) * 14;
      data[i] = Math.max(0, Math.min(255, 249 + wave));
      data[i + 1] = Math.max(0, Math.min(255, 242 + wave * 0.96));
      data[i + 2] = Math.max(0, Math.min(255, 226 + wave * 0.9));
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Subtle paper fibers & warm flecks
  ctx.strokeStyle = 'rgba(135, 102, 74, 0.045)';
  ctx.lineWidth = 0.8;
  for (let k = 0; k < 240; k++) {
    const x = rand() * width;
    const y = rand() * height;
    const len = 4 + rand() * 14;
    const a = rand() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }

  // Soft watercolor edge bloom marks
  for (let w = 0; w < 6; w++) {
    const cx = rand() * width;
    const cy = rand() * height;
    const r = 45 + rand() * 95;
    const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    g.addColorStop(0, 'rgba(218, 194, 160, 0.035)');
    g.addColorStop(0.85, 'rgba(205, 175, 138, 0.06)');
    g.addColorStop(1, 'rgba(205, 175, 138, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  cachedPaperCanvas = canvas;
  return canvas;
}

export function getHatchPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (cachedHatchPattern) return cachedHatchPattern;
  const p = document.createElement('canvas');
  p.width = 12;
  p.height = 12;
  const pctx = p.getContext('2d')!;
  pctx.strokeStyle = 'rgba(59, 40, 32, 0.14)';
  pctx.lineWidth = 1.05;
  pctx.beginPath();
  pctx.moveTo(-2, 10);
  pctx.lineTo(10, -2);
  pctx.moveTo(2, 14);
  pctx.lineTo(14, 2);
  pctx.stroke();
  cachedHatchPattern = ctx.createPattern(p, 'repeat');
  return cachedHatchPattern;
}

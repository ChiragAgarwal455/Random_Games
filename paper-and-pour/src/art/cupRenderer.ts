import { CUP_META, MILK_META, SYRUP_META } from '../data/recipes';
import { IceCubeSim, LatteSurfaceSim, LiquidWaveSim, SurfaceRipple } from '../fluid/fluidSim';
import { ActiveDrinkContents, CupStyle, LatteStencil, SyrupType } from '../types/game';
import { darkenHex, drawCastShadow, hexToRgb, INK_DARK, INK_SOFT, sketchEllipse } from './sketchUtils';

export interface CupRenderOptions {
  cx: number;
  baseY: number;
  scale?: number;
  tiltPitch?: number; // 0.36 normal 2.5D counter, 0.72 latte-art zoom!
  drink: ActiveDrinkContents;
  waveSim: LiquidWaveSim;
  latteSim: LatteSurfaceSim;
  ripples: SurfaceRipple[];
  iceCubes: IceCubeSim[];
  stencil?: LatteStencil;
  showStencilGuide?: boolean;
  time: number;
  seed?: number;
}

export function getCupGeometry(style: CupStyle, cx: number, baseY: number, scale = 1, tiltPitch = 0.36) {
  const meta = CUP_META[style];
  const topRx = (meta.wide ? 64 : meta.tall ? 44 : 50) * scale;
  const botRx = (meta.wide ? 36 : meta.tall ? 33 : 37) * scale;
  const height = (meta.tall ? 124 : meta.wide ? 78 : 92) * scale;
  const topRy = topRx * tiltPitch;
  const botRy = botRx * tiltPitch * 0.85;
  const topY = baseY - height;
  return { meta, topRx, topRy, botRx, botRy, height, topY, cx, baseY };
}

export function getLiquidFillRatio(drink: ActiveDrinkContents): number {
  const syrupVol = Object.values(drink.syrups).reduce((acc, v) => acc + (v ?? 0) * 0.06, 0);
  const vol =
    drink.espressoShots * 0.17 +
    drink.water * 0.65 +
    drink.matchaAmount * 0.38 +
    drink.cocoaAmount * 0.38 +
    drink.milkAmount * 0.82 +
    syrupVol +
    drink.iceCount * 0.045;
  return Math.max(0, Math.min(0.88, vol));
}

export function draw25DCup(ctx: CanvasRenderingContext2D, opts: CupRenderOptions): void {
  const { drink, cx, baseY, scale = 1, tiltPitch = 0.36, waveSim, latteSim, ripples, iceCubes, time } = opts;
  if (!drink.cupStyle) return;

  const style = drink.cupStyle;
  const g = getCupGeometry(style, cx, baseY, scale, tiltPitch);
  const fill = getLiquidFillRatio(drink);

  // 1. Saucer (for mugs/bowls) & Cast Hatch Shadow
  const hasSaucer = style !== 'iced_glass' && style !== 'kraft_cup';
  drawCastShadow(ctx, cx, baseY + 5 * scale, g.botRx * (hasSaucer ? 1.55 : 1.15), g.botRy * (hasSaucer ? 1.8 : 1.25), 0.25);

  if (hasSaucer) {
    sketchEllipse(ctx, cx, baseY + 4 * scale, g.botRx * 1.52, g.botRy * 1.65, '#EFE5D5', INK_DARK, 2.0, 21);
    sketchEllipse(ctx, cx, baseY + 2 * scale, g.botRx * 1.12, g.botRy * 1.15, '#E2D4BF', INK_SOFT, 1.2, 22);
  }

  // Cookie resting on saucer edge if topped!
  if (drink.toppings.includes('cookie')) {
    const ckx = cx + g.botRx * (hasSaucer ? 1.15 : 1.15);
    const cky = baseY + (hasSaucer ? 2 : -4) * scale;
    sketchEllipse(ctx, ckx, cky, 15 * scale, 10 * scale, '#D7A368', INK_DARK, 1.8, 77);
    sketchEllipse(ctx, ckx - 3 * scale, cky - 1 * scale, 2.2 * scale, 1.5 * scale, '#5C3725', null, 0, 78);
    sketchEllipse(ctx, ckx + 4 * scale, cky + 2 * scale, 2 * scale, 1.4 * scale, '#5C3725', null, 0, 79);
    sketchEllipse(ctx, ckx + 1 * scale, cky - 3 * scale, 1.8 * scale, 1.3 * scale, '#5C3725', null, 0, 80);
  }

  // 2. Back rim & Interior shadow cavity
  if (g.meta.isGlass) {
    // Back rim arc of clear glass
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, g.topY, g.topRx, g.topRy, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  } else {
    // Solid mug interior shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, g.topY, g.topRx, g.topRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E4D5C1';
    ctx.fill();
    ctx.clip();

    // Inner depth shading
    const innerGrad = ctx.createLinearGradient(cx, g.topY - g.topRy, cx, g.topY + g.topRy);
    innerGrad.addColorStop(0, '#CBB8A0');
    innerGrad.addColorStop(1, '#EFE2D0');
    ctx.fillStyle = innerGrad;
    ctx.fillRect(cx - g.topRx - 4, g.topY - g.topRy - 4, g.topRx * 2 + 8, g.topRy * 2 + 8);
    ctx.restore();
  }

  // 3. Handle (drawn behind or beside depending on cup)
  if (style !== 'iced_glass' && style !== 'kraft_cup') {
    const hx = cx + g.topRx * 0.88;
    const hy = g.topY + g.height * 0.25;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.bezierCurveTo(
      hx + 27 * scale,
      hy - 6 * scale,
      hx + 26 * scale,
      hy + 42 * scale,
      hx - 7 * scale,
      hy + 38 * scale
    );
    ctx.lineWidth = 10 * scale;
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK_DARK;
    ctx.stroke();

    ctx.lineWidth = 6 * scale;
    ctx.strokeStyle = g.meta.baseColor;
    ctx.stroke();
    ctx.restore();
  }

  // 4. For Glass Cups: Draw 2.5D Stratified Sloshing Fluid Body BEFORE front glass tint!
  const liqY = g.baseY - 8 * scale - fill * (g.height - 16 * scale);
  const tFill = (g.baseY - liqY) / g.height;
  const liqRx = g.botRx + (g.topRx - g.botRx) * tFill - 3 * scale;
  const liqRy = liqRx * tiltPitch;

  if (g.meta.isGlass && fill > 0.01) {
    drawGlassFluidLayers(ctx, g, liqY, liqRx, liqRy, fill, drink, waveSim, iceCubes, scale, time);
  }

  // 5. Top 2.5D Elliptical Fluid Surface (both ceramic & glass!)
  if (fill > 0.015) {
    drawFluidTopSurface(ctx, g, liqY, liqRx, liqRy, fill, drink, waveSim, latteSim, ripples, iceCubes, opts, scale, time);
  }

  // 6. Outer Cup Body (for opaque ceramic/kraft) or Translucent Glass Reflections!
  if (g.meta.isGlass) {
    drawGlassExterior(ctx, g, scale);
  } else {
    drawCeramicExterior(ctx, g, style, scale);
  }

  // 7. Toppings above rim (Whipped Cream cloud, Drizzle, Dust, Steam)
  if (fill > 0.02) {
    const surfaceTopY = g.meta.isGlass ? liqY : g.topY + (1 - Math.min(1, fill / 0.85)) * g.topRy * 0.35;
    drawToppingsAndSteam(ctx, cx, surfaceTopY, liqRx, liqRy, drink, time, scale);
  }

  // 8. Cute Mug Ears / Face Details on Rim
  if (style === 'cat_mug') {
    drawCatMugFeatures(ctx, g, scale);
  } else if (style === 'frog_mug') {
    drawFrogMugFeatures(ctx, g, scale);
  }
}

function drawGlassFluidLayers(
  ctx: CanvasRenderingContext2D,
  g: ReturnType<typeof getCupGeometry>,
  liqY: number,
  liqRx: number,
  liqRy: number,
  fill: number,
  drink: ActiveDrinkContents,
  waveSim: LiquidWaveSim,
  iceCubes: IceCubeSim[],
  scale: number,
  time: number
): void {
  const { cx, baseY, botRx, botRy, topRx, height } = g;
  const innerBotY = baseY - 6 * scale;
  const innerBotRx = botRx - 3 * scale;

  ctx.save();
  // Clip to interior glass body below sloshing surface
  ctx.beginPath();
  const segs = 24;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const x = cx - liqRx + u * liqRx * 2;
    const wy = waveSim.sample(u) * scale * 0.7;
    if (i === 0) ctx.moveTo(x, liqY + wy);
    else ctx.lineTo(x, liqY + wy);
  }
  ctx.lineTo(cx + innerBotRx, innerBotY);
  ctx.ellipse(cx, innerBotY, innerBotRx, botRy * 0.82, 0, 0, Math.PI);
  ctx.lineTo(cx - liqRx, liqY + waveSim.sample(0) * scale * 0.7);
  ctx.closePath();
  ctx.clip();

  // Base background liquid color
  const totalHeight = Math.max(10, innerBotY - liqY);
  const grad = ctx.createLinearGradient(cx, liqY, cx, innerBotY);

  // Determine dominant tint
  let topCol = '#6A3B23';
  let midCol = '#E8D6BE';
  let botCol = '#E8D6BE';

  if (drink.matchaAmount > 0.1 && drink.milkAmount > 0.1) {
    topCol = '#7DA866';
    midCol = '#DDE8D2';
    botCol = '#F5EBDC';
  } else if (drink.matchaAmount > 0.1) {
    topCol = '#77A15E';
    midCol = '#6C9455';
    botCol = '#5E8248';
  } else if (drink.espressoShots > 0 && drink.milkAmount > 0.1) {
    topCol = '#6D3D24';
    midCol = '#C89E74';
    botCol = MILK_META[drink.milkType]?.color || '#FAF1DF';
  } else if (drink.espressoShots > 0) {
    topCol = '#4B2818';
    midCol = '#3A1D10';
    botCol = '#2E160B';
  } else if (drink.milkAmount > 0.05) {
    const mc = MILK_META[drink.milkType]?.color || '#FAF1DF';
    topCol = mc;
    midCol = mc;
    botCol = darkenHex(mc, 0.06);
  } else {
    topCol = '#D9EEF2';
    midCol = '#CBE6EC';
    botCol = '#BBDCE4';
  }

  // Bottom syrup band!
  const syrupEntries = Object.entries(drink.syrups).filter(([, amt]) => (amt ?? 0) > 0) as [SyrupType, number][];
  if (syrupEntries.length > 0) {
    botCol = SYRUP_META[syrupEntries[0][0]].color;
  }

  grad.addColorStop(0, topCol);
  grad.addColorStop(0.45, midCol);
  grad.addColorStop(0.85, midCol);
  grad.addColorStop(1, botCol);

  ctx.fillStyle = grad;
  ctx.fillRect(cx - topRx - 10, liqY - 24, topRx * 2 + 20, totalHeight + 48);

  // Swirling watercolor ribbons inside glass
  if (syrupEntries.length > 0 && drink.milkAmount > 0.05) {
    ctx.save();
    ctx.strokeStyle = SYRUP_META[syrupEntries[0][0]].color;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - innerBotRx * 0.6, innerBotY - 8 * scale);
    ctx.bezierCurveTo(
      cx + Math.sin(time * 1.4) * 14 * scale,
      innerBotY - totalHeight * 0.3,
      cx - Math.cos(time * 1.2) * 16 * scale,
      innerBotY - totalHeight * 0.55,
      cx + 8 * scale,
      liqY + totalHeight * 0.25
    );
    ctx.stroke();
    ctx.restore();
  }

  // Submerged floating ice cubes visible through glass!
  for (const ice of iceCubes) {
    const ix = cx + ice.nx * liqRx * 0.92;
    const bob = Math.sin(time * 2.4 + ice.bobPhase) * 2.2 * scale;
    const waveOff = waveSim.sample(ice.nx * 0.5 + 0.5) * scale * 0.6;
    const iy = liqY + 8 * scale + ice.depthOffset * 18 * scale + bob + waveOff;
    const sz = ice.size * scale;

    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(ice.angle + waveSim.sloshAngle * 0.65);
    ctx.fillStyle = 'rgba(242, 250, 255, 0.72)';
    ctx.strokeStyle = 'rgba(72, 92, 104, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-sz * 0.5, -sz * 0.5, sz, sz, 4 * scale);
    ctx.fill();
    ctx.stroke();

    // Ice highlight facet
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.moveTo(-sz * 0.3, -sz * 0.32);
    ctx.lineTo(sz * 0.15, -sz * 0.32);
    ctx.lineTo(-sz * 0.3, sz * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawFluidTopSurface(
  ctx: CanvasRenderingContext2D,
  g: ReturnType<typeof getCupGeometry>,
  liqY: number,
  liqRx: number,
  liqRy: number,
  fill: number,
  drink: ActiveDrinkContents,
  waveSim: LiquidWaveSim,
  latteSim: LatteSurfaceSim,
  ripples: SurfaceRipple[],
  iceCubes: IceCubeSim[],
  opts: CupRenderOptions,
  scale: number,
  time: number
): void {
  const { cx } = g;
  const surfY = g.meta.isGlass ? liqY : g.topY + (1 - Math.min(1, fill / 0.85)) * (g.height * 0.42);
  const surfRx = g.meta.isGlass ? liqRx : g.botRx + (g.topRx - g.botRx) * (1 - (surfY - g.topY) / g.height) - 3 * scale;
  const surfRy = surfRx * (g.topRy / g.topRx);

  ctx.save();
  // Clip to sloshing elliptical meniscus
  ctx.beginPath();
  const segs = 32;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const u = Math.cos(a) * 0.5 + 0.5;
    const waveY = waveSim.sample(u) * scale * 0.55;
    const px = cx + Math.cos(a) * surfRx;
    const py = surfY + Math.sin(a) * surfRy + waveY;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.clip();

  // Draw live 2D Eulerian Latte/Fluid Surface texture inside the 2.5D ellipse!
  const surfTex = latteSim.renderToCanvas();
  ctx.drawImage(surfTex, cx - surfRx, surfY - surfRy - 4 * scale, surfRx * 2, surfRy * 2 + 8 * scale);

  // Subtle glossy meniscus sheen
  const sheen = ctx.createRadialGradient(
    cx - surfRx * 0.35,
    surfY - surfRy * 0.3,
    surfRx * 0.05,
    cx,
    surfY,
    surfRx
  );
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  sheen.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(1, 'rgba(48, 25, 16, 0.16)');
  ctx.fillStyle = sheen;
  ctx.fillRect(cx - surfRx - 4, surfY - surfRy - 14, surfRx * 2 + 8, surfRy * 2 + 28);

  // Expanding concentric fluid ripples!
  for (const r of ripples) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      cx + r.nx * surfRx * 0.7,
      surfY + r.ny * surfRy * 0.7,
      r.radius * surfRx,
      r.radius * surfRy,
      0,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = `rgba(255, 248, 236, ${r.alpha * 0.7})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  // Top surface of floating ice cubes poking above meniscus
  if (!g.meta.isGlass || iceCubes.length > 0) {
    for (const ice of iceCubes) {
      const ix = cx + ice.nx * surfRx * 0.75;
      const iy = surfY + ice.ny * surfRy * 0.68 + Math.sin(time * 2.4 + ice.bobPhase) * 1.5 * scale;
      const sz = ice.size * scale * 0.85;
      ctx.save();
      ctx.translate(ix, iy);
      ctx.rotate(ice.angle);
      ctx.fillStyle = 'rgba(246, 252, 255, 0.85)';
      ctx.strokeStyle = 'rgba(72, 92, 104, 0.6)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.roundRect(-sz * 0.45, -sz * 0.32, sz * 0.9, sz * 0.64, 3 * scale);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // Optional Faint Pencil Latte Art Trace Guide!
  if (opts.showStencilGuide && opts.stencil && opts.stencil !== 'free') {
    drawLatteStencilGuide(ctx, cx, surfY, surfRx * 0.72, surfRy * 0.72, opts.stencil);
  }

  ctx.restore();

  // Soft liquid meniscus edge rim
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, surfY, surfRx, surfRy, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 246, 232, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function drawLatteStencilGuide(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  stencil: LatteStencil
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 251, 242, 0.65)';
  ctx.lineWidth = 2.0;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();

  if (stencil === 'heart') {
    ctx.moveTo(cx, cy - ry * 0.15);
    ctx.bezierCurveTo(cx - rx * 0.55, cy - ry * 0.75, cx - rx * 0.95, cy + ry * 0.05, cx, cy + ry * 0.72);
    ctx.bezierCurveTo(cx + rx * 0.95, cy + ry * 0.05, cx + rx * 0.55, cy - ry * 0.75, cx, cy - ry * 0.15);
  } else if (stencil === 'tulip') {
    for (let k = 0; k < 3; k++) {
      const yOff = (k - 1) * ry * 0.42;
      const rScale = 1 - k * 0.22;
      ctx.moveTo(cx - rx * 0.45 * rScale, cy + yOff);
      ctx.quadraticCurveTo(cx, cy + yOff + ry * 0.38 * rScale, cx + rx * 0.45 * rScale, cy + yOff);
    }
    ctx.moveTo(cx, cy - ry * 0.7);
    ctx.lineTo(cx, cy + ry * 0.75);
  } else if (stencil === 'bear') {
    ctx.ellipse(cx, cy + ry * 0.08, rx * 0.52, ry * 0.48, 0, 0, Math.PI * 2);
    ctx.moveTo(cx - rx * 0.32, cy - ry * 0.42);
    ctx.arc(cx - rx * 0.42, cy - ry * 0.42, rx * 0.16, 0, Math.PI * 2);
    ctx.moveTo(cx + rx * 0.58, cy - ry * 0.42);
    ctx.arc(cx + rx * 0.42, cy - ry * 0.42, rx * 0.16, 0, Math.PI * 2);
  } else if (stencil === 'swirl') {
    for (let t = 0; t < 28; t++) {
      const a = t * 0.45;
      const rad = (t / 28) * 0.85;
      const px = cx + Math.cos(a) * rx * rad;
      const py = cy + Math.sin(a) * ry * rad;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawGlassExterior(ctx: CanvasRenderingContext2D, g: ReturnType<typeof getCupGeometry>, scale: number): void {
  const { cx, topY, topRx, topRy, botRx, botRy, baseY } = g;

  ctx.save();
  // Translucent glass wash
  ctx.beginPath();
  ctx.moveTo(cx - topRx, topY);
  ctx.lineTo(cx - botRx, baseY);
  ctx.ellipse(cx, baseY, botRx, botRy, 0, Math.PI, 0, true);
  ctx.lineTo(cx + topRx, topY);
  ctx.ellipse(cx, topY, topRx, topRy, 0, 0, Math.PI);
  ctx.closePath();

  const glassGrad = ctx.createLinearGradient(cx - topRx, topY, cx + topRx, topY);
  glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
  glassGrad.addColorStop(0.22, 'rgba(235, 248, 252, 0.08)');
  glassGrad.addColorStop(0.78, 'rgba(220, 242, 248, 0.06)');
  glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
  ctx.fillStyle = glassGrad;
  ctx.fill();

  // Sketched glass outline
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Front lip arc
  ctx.beginPath();
  ctx.ellipse(cx, topY, topRx, topRy, 0, 0, Math.PI);
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Specular highlight ribbon & cute condensation droplets
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = 3.2 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - topRx * 0.65, topY + topRy + 10 * scale);
  ctx.lineTo(cx - botRx * 0.62, baseY - 12 * scale);
  ctx.stroke();

  // Condensation beads
  ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
  const drops = [
    [-0.4, 0.32],
    [0.52, 0.45],
    [-0.25, 0.65],
    [0.36, 0.74],
  ];
  for (const [dx, dy] of drops) {
    ctx.beginPath();
    ctx.arc(cx + dx * topRx, topY + dy * g.height, 2.2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCeramicExterior(
  ctx: CanvasRenderingContext2D,
  g: ReturnType<typeof getCupGeometry>,
  style: CupStyle,
  scale: number
): void {
  const { cx, topY, topRx, topRy, botRx, botRy, baseY, meta } = g;

  ctx.save();
  ctx.beginPath();
  // Front wall starts from left rim, curves down around base, up to right rim, and follows front ellipse arc!
  ctx.moveTo(cx - topRx, topY);
  ctx.quadraticCurveTo(cx - topRx * 0.94, baseY - 6 * scale, cx - botRx, baseY);
  ctx.ellipse(cx, baseY, botRx, botRy, 0, Math.PI, 0, true);
  ctx.quadraticCurveTo(cx + topRx * 0.94, baseY - 6 * scale, cx + topRx, topY);
  ctx.ellipse(cx, topY, topRx, topRy, 0, 0, Math.PI);
  ctx.closePath();

  const bodyGrad = ctx.createLinearGradient(cx - topRx, topY, cx + topRx, topY);
  bodyGrad.addColorStop(0, meta.baseColor);
  bodyGrad.addColorStop(0.65, meta.baseColor);
  bodyGrad.addColorStop(1, darkenHex(meta.baseColor, 0.14));
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Kraft sleeve or decorative stripe!
  if (style === 'kraft_cup') {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#C99F72';
    ctx.fillRect(cx - topRx - 5, topY + g.height * 0.32, topRx * 2 + 10, g.height * 0.38);
    ctx.strokeStyle = INK_SOFT;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(cx - topRx - 2, topY + g.height * 0.32, topRx * 2 + 4, g.height * 0.38);
    // Tiny sketched coffee leaf emblem on sleeve
    ctx.fillStyle = '#FAF3E3';
    ctx.beginPath();
    ctx.ellipse(cx, topY + g.height * 0.51, 10 * scale, 12 * scale, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (style === 'ceramic_mug') {
    // Cozy warm pastel band
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(201, 108, 80, 0.18)';
    ctx.fillRect(cx - topRx, baseY - 22 * scale, topRx * 2, 12 * scale);
    ctx.restore();
  }

  // Ink outline of exterior cup
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Full elliptical rim outline
  ctx.beginPath();
  ctx.ellipse(cx, topY, topRx, topRy, 0, 0, Math.PI * 2);
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 2.1;
  ctx.stroke();

  // Subtle rim thickness inner highlight
  ctx.beginPath();
  ctx.ellipse(cx, topY + 0.5, topRx - 2.5 * scale, Math.max(2, topRy - 1.5 * scale), 0, 0, Math.PI);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.restore();
}

function drawCatMugFeatures(ctx: CanvasRenderingContext2D, g: ReturnType<typeof getCupGeometry>, scale: number): void {
  const { cx, topY, topRx, height } = g;
  ctx.save();
  // Two cute cat ears rising from back rim
  for (const dir of [-1, 1]) {
    const ex = cx + dir * topRx * 0.62;
    const ey = topY - 2 * scale;
    ctx.beginPath();
    ctx.moveTo(ex - 9 * scale, ey + 2 * scale);
    ctx.lineTo(ex + dir * 2 * scale, ey - 14 * scale);
    ctx.lineTo(ex + 9 * scale, ey + 2 * scale);
    ctx.closePath();
    ctx.fillStyle = '#FFF7EC';
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Pink inner ear
    ctx.beginPath();
    ctx.moveTo(ex - 4 * scale, ey);
    ctx.lineTo(ex + dir * 1 * scale, ey - 8 * scale);
    ctx.lineTo(ex + 4 * scale, ey);
    ctx.closePath();
    ctx.fillStyle = '#F2B5BA';
    ctx.fill();
  }
  // Cute kitty face on cup front
  const fy = topY + height * 0.54;
  ctx.fillStyle = INK_DARK;
  ctx.beginPath();
  ctx.arc(cx - 12 * scale, fy, 2.5 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 12 * scale, fy, 2.5 * scale, 0, Math.PI * 2);
  ctx.fill();
  // Blush
  ctx.fillStyle = 'rgba(232, 139, 151, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - 17 * scale, fy + 4 * scale, 4.5 * scale, 2.8 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 17 * scale, fy + 4 * scale, 4.5 * scale, 2.8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  // Little ":3" mouth
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(cx - 3 * scale, fy + 3 * scale, 3 * scale, 0, Math.PI);
  ctx.arc(cx + 3 * scale, fy + 3 * scale, 3 * scale, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawFrogMugFeatures(ctx: CanvasRenderingContext2D, g: ReturnType<typeof getCupGeometry>, scale: number): void {
  const { cx, topY, height } = g;
  ctx.save();
  const fy = topY + height * 0.5;
  // Cute sleepy froggy eyes + cheeks
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + dir * 13 * scale, fy, 4.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFDF7';
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + dir * 13 * scale, fy, 2.1 * scale, 0, Math.PI * 2);
    ctx.fillStyle = INK_DARK;
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(232, 145, 145, 0.52)';
  ctx.beginPath();
  ctx.ellipse(cx - 19 * scale, fy + 5 * scale, 4.5 * scale, 2.6 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 19 * scale, fy + 5 * scale, 4.5 * scale, 2.6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, fy + 3 * scale, 6.5 * scale, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawToppingsAndSteam(
  ctx: CanvasRenderingContext2D,
  cx: number,
  surfY: number,
  surfRx: number,
  surfRy: number,
  drink: ActiveDrinkContents,
  time: number,
  scale: number
): void {
  // Whipped cream cloud!
  if (drink.toppings.includes('whipped_cream')) {
    ctx.save();
    const layers = [
      { y: -3, rx: surfRx * 0.72, ry: surfRy * 0.75 },
      { y: -12, rx: surfRx * 0.54, ry: surfRy * 0.6 },
      { y: -20, rx: surfRx * 0.34, ry: surfRy * 0.42 },
    ];
    for (const l of layers) {
      sketchEllipse(ctx, cx, surfY + l.y * scale, l.rx, l.ry, '#FFFDF7', INK_DARK, 1.7, 50 + Math.abs(l.y));
    }
    // Cute swirl peak
    ctx.beginPath();
    ctx.moveTo(cx - 6 * scale, surfY - 22 * scale);
    ctx.quadraticCurveTo(cx + 3 * scale, surfY - 34 * scale, cx + 6 * scale, surfY - 23 * scale);
    ctx.fillStyle = '#FFFDF7';
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  // Caramel drizzle spiral
  if (drink.toppings.includes('caramel_drizzle')) {
    ctx.save();
    ctx.strokeStyle = '#C67426';
    ctx.lineWidth = 2.6 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const topOff = drink.toppings.includes('whipped_cream') ? -14 * scale : 0;
    for (let i = 0; i <= 26; i++) {
      const a = i * 0.42;
      const r = (i / 26) * 0.65;
      const px = cx + Math.cos(a) * surfRx * r;
      const py = surfY + topOff + Math.sin(a) * surfRy * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Dusting particles (cinnamon, cocoa, matcha)
  const dustColor = drink.toppings.includes('matcha_dust')
    ? '#78A35F'
    : drink.toppings.includes('cocoa_dust')
    ? '#5C3523'
    : drink.toppings.includes('cinnamon')
    ? '#A85A32'
    : null;

  if (dustColor) {
    const topOff = drink.toppings.includes('whipped_cream') ? -14 * scale : 0;
    ctx.save();
    ctx.fillStyle = dustColor;
    for (let i = 0; i < 24; i++) {
      const a = i * 2.39996;
      const r = Math.sqrt((i + 0.5) / 24) * 0.62;
      const px = cx + Math.cos(a) * surfRx * r;
      const py = surfY + topOff + Math.sin(a) * surfRy * r;
      ctx.beginPath();
      ctx.arc(px, py, (1.4 + (i % 3) * 0.5) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Cozy curling steam wisps (only on hot drinks!)
  const isHot = drink.iceCount === 0 && drink.cupStyle !== 'iced_glass' && (drink.espressoShots > 0 || drink.water > 0 || drink.milkWasSteamed || drink.matchaAmount > 0 || drink.cocoaAmount > 0);
  if (isHot) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 252, 246, 0.78)';
    ctx.lineCap = 'round';
    for (let s = 0; s < 3; s++) {
      const phase = time * 1.1 + s * 2.1;
      const rise = (phase % 3.2) / 3.2; // 0..1
      const alpha = Math.sin(rise * Math.PI) * 0.65;
      const sx = cx + (s - 1) * 16 * scale + Math.sin(time * 1.8 + s) * 5 * scale;
      const sy = surfY - 12 * scale - rise * 48 * scale;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = (2.4 - rise * 0.9) * scale;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(
        sx - 8 * scale,
        sy - 12 * scale,
        sx + 8 * scale,
        sy - 24 * scale,
        sx - 3 * scale,
        sy - 36 * scale
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawParabolicPourStream(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width: number,
  time: number
): void {
  ctx.save();
  const mx = (x0 + x1) * 0.5 + (x1 - x0) * 0.15;
  const my = y0 + (y1 - y0) * 0.32;

  // Outer stream
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx, my, x1, y1);
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = width + 2.2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Inner rich liquid stream
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx, my, x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();

  // Flowing specular highlight dash moving downward!
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx, my, x1, y1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = Math.max(1.2, width * 0.32);
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -time * 150;
  ctx.stroke();
  ctx.restore();
}

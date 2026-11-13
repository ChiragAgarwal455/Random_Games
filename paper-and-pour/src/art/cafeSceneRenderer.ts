import { CUP_META, MILK_META, SYRUP_META, TOPPING_META } from '../data/recipes';
import {
  FluidParticle,
  IceCubeSim,
  LatteSurfaceSim,
  LiquidWaveSim,
  SurfaceRipple,
} from '../fluid/fluidSim';
import {
  ActiveDrinkContents,
  ActiveOrder,
  CafeCat,
  CupStyle,
  CustomerMood,
  GrinderState,
  LatteStencil,
  MilkType,
  PitcherState,
  SyrupType,
  ToppingType,
  UpgradeTrackId,
  WaitingGuest,
  WeatherMood,
  WhiskBowlState,
} from '../types/game';
import { drawCatWaitingLounge } from './catLoungeRenderer';
import { drawCustomerCharacter } from './characterRenderer';
import { draw25DCup, drawParabolicPourStream, getCupGeometry, getLiquidFillRatio } from './cupRenderer';
import { getWatercolorPaperCanvas } from './paperTexture';
import {
  darkenHex,
  drawCastShadow,
  drawCuteHeart,
  drawCuteSparkle,
  drawWatercolorRect,
  INK_DARK,
  INK_PENCIL,
  INK_SOFT,
  sketchEllipse,
  sketchLine,
} from './sketchUtils';

export interface HitZone {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  disabled?: boolean;
}

export interface TipCoinVisual {
  x: number;
  y: number;
  r: number;
  color: string;
  rot: number;
}

export interface SceneRenderState {
  width: number;
  height: number;
  time: number;
  day: number;
  weather: WeatherMood;
  upgradeLevels: Partial<Record<UpgradeTrackId, number>>;
  unlockedCups: string[];
  pointerX: number;
  pointerY: number;
  hoveredId: string | null;

  // Customer, Patience & Waiting Cat Lounge
  order: ActiveOrder | null;
  customerMood: CustomerMood;
  customerEnter: number;
  patience: number; // 0..1
  waitingGuests: WaitingGuest[];
  cats: CafeCat[];

  // Barista Crafting State
  drink: ActiveDrinkContents;
  waveSim: LiquidWaveSim;
  latteSim: LatteSurfaceSim;
  pitcherWave: LiquidWaveSim;
  ripples: SurfaceRipple[];
  iceCubes: IceCubeSim[];
  particles: FluidParticle[];

  grinder: GrinderState;
  shotCupFill: number;
  whiskBowl: WhiskBowlState;
  pitcher: PitcherState;
  pouringMode: 'none' | 'pitcher' | 'etch';
  isActivelyPouring: boolean;
  pourTargetNormX: number;
  pourTargetNormY: number;
  pouringStream: null | {
    fromX: number;
    fromY: number;
    color: string;
    width: number;
  };
  latteZoom: number;
  stencil: LatteStencil;
  showStencilGuide: boolean;
  kettleTilting: number;
  tipCoins: TipCoinVisual[];
  servingCupAnim: number;
}

const LOGICAL_W = 1280;
const LOGICAL_H = 720;

export const CUP_CENTER = { x: 575, y: 590 };
export const SERVE_COASTER = { x: 645, y: 266 };

export function computeHitZones(state: SceneRenderState): HitZone[] {
  const zones: HitZone[] = [];

  if (state.latteZoom > 0.5) {
    zones.push({
      id: 'latte_surface',
      label: state.pouringMode === 'etch' ? 'Drag to Etch Foam' : 'Hold & Move to Pour Microfoam',
      x: 340,
      y: 220,
      w: 500,
      h: 360,
    });
    zones.push({
      id: 'exit_latte_zoom',
      label: 'Back to Counter',
      x: 520,
      y: 625,
      w: 190,
      h: 48,
    });
    return zones;
  }

  // 0. Interactive Café Cats in Waiting Lounge!
  const catTier = state.upgradeLevels.cat_lounge ?? 0;
  for (const cat of state.cats) {
    if (cat.unlockTierRequired <= catTier) {
      zones.push({
        id: `cat:${cat.id}`,
        label: `Pet ${cat.name} 🐾`,
        sublabel: 'Purrs & Meows!',
        x: cat.x - 32,
        y: cat.y - 30,
        w: 64,
        h: 50,
      });
    }
  }

  // 1. Cup Rack (sleek 2 columns x up to 4 rows)
  const availCups: CupStyle[] = ['ceramic_mug', 'iced_glass', 'latte_bowl', 'kraft_cup'];
  if (state.unlockedCups.includes('cat_mug')) availCups.push('cat_mug');
  if (state.unlockedCups.includes('frog_mug')) availCups.push('frog_mug');
  if (state.unlockedCups.includes('owl_mug')) availCups.push('owl_mug');

  availCups.forEach((cup, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const locked = cup === 'iced_glass' && state.day < 2;
    zones.push({
      id: `cup:${cup}`,
      label: CUP_META[cup].label,
      sublabel: locked ? 'Unlocks Day 2' : 'Select Vessel',
      x: 28 + col * 58,
      y: 306 + row * 41,
      w: 54,
      h: 38,
      disabled: locked,
    });
  });

  // 2. Grinder, Tamper, Espresso Machine & Shot Cup
  zones.push({
    id: 'grinder',
    label: state.grinder.groundProgress >= 1 ? 'Beans Ground!' : 'Hold/Click to Grind Beans',
    sublabel: `${Math.round(state.grinder.groundProgress * 100)}%`,
    x: 34,
    y: 488,
    w: 102,
    h: 162,
  });

  zones.push({
    id: 'tamper',
    label: state.grinder.tamped ? 'Puck Tamped!' : 'Press to Tamp Grounds',
    x: 146,
    y: 556,
    w: 66,
    h: 92,
    disabled: state.grinder.groundProgress < 0.85,
  });

  zones.push({
    id: 'espresso_pull',
    label: state.grinder.pullingShot ? 'Extracting Espresso...' : 'Pull Espresso Shot',
    sublabel: state.grinder.tamped ? 'Ready to Pull' : 'Grind & Tamp First',
    x: 164,
    y: 318,
    w: 146,
    h: 185,
    disabled: !state.grinder.tamped || state.grinder.pullingShot,
  });

  if (state.shotCupFill > 0.15) {
    zones.push({
      id: 'pour_espresso_shot',
      label: 'Pour Espresso into Cup',
      sublabel: 'Fresh Golden Crema!',
      x: 205,
      y: 440,
      w: 76,
      h: 66,
    });
  }

  // 3. Hot Water Kettle & Rinse Bucket
  zones.push({
    id: 'kettle',
    label: 'Pour Hot Water',
    sublabel: 'For Americanos',
    x: 352,
    y: 492,
    w: 92,
    h: 94,
    disabled: !state.drink.cupStyle,
  });

  zones.push({
    id: 'trash_cup',
    label: 'Rinse & Start Fresh',
    x: 356,
    y: 604,
    w: 76,
    h: 72,
    disabled: !state.drink.cupStyle,
  });

  // 4. Matcha / Cocoa Whisk Station (Day 3+)
  const whiskLocked = state.day < 3;
  zones.push({
    id: 'scoop_matcha',
    label: 'Scoop Ceremonial Matcha',
    sublabel: whiskLocked ? 'Unlocks Day 3' : undefined,
    x: 330,
    y: 294,
    w: 58,
    h: 56,
    disabled: whiskLocked,
  });
  zones.push({
    id: 'scoop_cocoa',
    label: 'Scoop Dark Cocoa',
    sublabel: whiskLocked ? 'Unlocks Day 3' : undefined,
    x: 394,
    y: 294,
    w: 58,
    h: 56,
    disabled: whiskLocked,
  });
  zones.push({
    id: 'whisk_bowl',
    label: state.whiskBowl.readyToPour
      ? 'Pour Whisked Base into Cup'
      : state.whiskBowl.powder !== 'none'
      ? 'Swirl to Whisk!'
      : 'Bamboo Whisk Bowl',
    sublabel: whiskLocked ? 'Unlocks Day 3' : undefined,
    x: 332,
    y: 356,
    w: 118,
    h: 112,
    disabled: whiskLocked,
  });

  // 5. Center Active Cup & Serve Coaster
  if (state.drink.cupStyle) {
    zones.push({
      id: 'active_cup',
      label: state.pouringMode === 'pitcher' ? 'Hold to Pour Milk!' : 'Active Cup (Click to Swirl / Zoom Art)',
      x: 470,
      y: 445,
      w: 210,
      h: 210,
    });

    if (getLiquidFillRatio(state.drink) > 0.08 && state.order) {
      zones.push({
        id: 'serve_coaster',
        label: `Serve to ${state.order.customer.name}!`,
        sublabel: 'Slide Drink Across Counter',
        x: 590,
        y: 222,
        w: 112,
        h: 74,
      });
    }
  }

  // 6. Milk Cartons & Pitcher & Steam Wand & Ice
  const milks: MilkType[] = ['whole', 'oat', 'almond'];
  milks.forEach((m, idx) => {
    zones.push({
      id: `milk:${m}`,
      label: MILK_META[m].label,
      sublabel: 'Fill Milk Pitcher',
      x: 720 + idx * 66,
      y: 300,
      w: 60,
      h: 102,
    });
  });

  zones.push({
    id: 'steam_milk',
    label: state.pitcher.isSteaming ? 'Stop Steaming' : 'Steam Milk (Target 62°C)',
    sublabel: state.pitcher.fill > 0.1 ? `${Math.round(state.pitcher.tempC)}°C` : 'Add Milk First',
    x: 716,
    y: 416,
    w: 94,
    h: 102,
    disabled: state.pitcher.fill < 0.1,
  });

  zones.push({
    id: 'pitcher_pour',
    label: state.pitcher.fill > 0.1 ? 'Pour Milk / Latte Art' : 'Milk Pitcher (Empty)',
    sublabel: state.pitcher.fill > 0.1 ? 'Opens Pour & Art View' : 'Select a Milk Carton',
    x: 720,
    y: 526,
    w: 116,
    h: 120,
    disabled: state.pitcher.fill < 0.1 || !state.drink.cupStyle,
  });

  const iceLocked = state.day < 2;
  zones.push({
    id: 'ice_bucket',
    label: 'Add Ice Cube',
    sublabel: iceLocked ? 'Unlocks Day 2' : `${state.drink.iceCount} in cup`,
    x: 848,
    y: 530,
    w: 102,
    h: 118,
    disabled: iceLocked || !state.drink.cupStyle,
  });

  // 7. Syrup Bottles
  const syrups: SyrupType[] = ['vanilla', 'caramel', 'hazelnut', 'strawberry', 'lavender'];
  syrups.forEach((s, idx) => {
    const meta = SYRUP_META[s];
    const locked = state.day < meta.unlockDay;
    zones.push({
      id: `syrup:${s}`,
      label: meta.label,
      sublabel: locked ? `Unlocks Day ${meta.unlockDay}` : `Pump (${state.drink.syrups[s] ?? 0})`,
      x: 966 + idx * 58,
      y: 302,
      w: 54,
      h: 145,
      disabled: locked || !state.drink.cupStyle,
    });
  });

  // 8. Toppings & Cookie
  const toppings: ToppingType[] = ['cinnamon', 'cocoa_dust', 'matcha_dust', 'whipped_cream', 'caramel_drizzle', 'cookie'];
  toppings.forEach((t, idx) => {
    const meta = TOPPING_META[t];
    const locked = state.day < meta.unlockDay;
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    zones.push({
      id: `topping:${t}`,
      label: meta.label,
      sublabel: locked ? `Day ${meta.unlockDay}` : 'Add Topping',
      x: 966 + col * 94,
      y: 470 + row * 94,
      w: 88,
      h: 88,
      disabled: locked || !state.drink.cupStyle,
    });
  });

  return zones;
}

export function renderCafeScene(ctx: CanvasRenderingContext2D, state: SceneRenderState): void {
  const w = LOGICAL_W;
  const h = LOGICAL_H;
  const t = state.time;

  const px = ((state.pointerX / w) - 0.5) * 12 * (1 - state.latteZoom);
  const py = ((state.pointerY / h) - 0.5) * 7 * (1 - state.latteZoom);

  ctx.save();
  ctx.fillStyle = '#F7EFE0';
  ctx.fillRect(0, 0, w, h);

  // ==================== LAYER 0: GPGP-STYLE WARM INTERIOR & WINDOW ====================
  ctx.save();
  ctx.translate(px * 0.4, py * 0.4);
  drawBackWallAndWindow(ctx, state, t);
  ctx.restore();

  // ==================== LAYER 1: SHELVES, DECOR & CAT WAITING LOUNGE ====================
  ctx.save();
  ctx.translate(px * 0.65, py * 0.65);
  drawCafeShelvesAndDecor(ctx, state, t);
  drawCatWaitingLounge(
    ctx,
    state.waitingGuests,
    state.cats,
    state.upgradeLevels.cat_lounge ?? 0,
    state.hoveredId,
    t
  );
  ctx.restore();

  // ==================== LAYER 2: ACTIVE COUNTER CUSTOMER & PATIENCE METER ====================
  ctx.save();
  ctx.translate(px * 0.82, py * 0.6);
  if (state.order) {
    drawCustomerCharacter(
      ctx,
      state.order.customer,
      478,
      268,
      state.customerMood,
      t,
      state.customerEnter
    );
    drawPatienceMeter(ctx, 362, 92, state.patience, state.customerMood, t);
  }
  ctx.restore();

  // ==================== LAYER 3: 2.5D WOODEN COUNTERTOP ====================
  draw25DCounterSurface(ctx, state, t);
  drawServingCoasterAndTipJar(ctx, state, t);

  // ==================== LAYER 4: BARISTA STATIONS ====================
  if (state.latteZoom < 0.92) {
    ctx.save();
    ctx.globalAlpha = 1 - state.latteZoom;
    drawCupRack(ctx, state);
    drawGrinderAndTamper(ctx, state, t);
    drawEspressoMachine(ctx, state, t);
    drawMatchaWhiskStation(ctx, state, t);
    drawKettleAndRinse(ctx, state, t);
    drawMilkAndIceStation(ctx, state, t);
    drawSyrupsAndToppings(ctx, state);
    ctx.restore();
  }

  // ==================== LAYER 5: ACTIVE 2.5D CUP & FLUIDS ====================
  const zoom = state.latteZoom;
  const cupX = CUP_CENTER.x + (595 - CUP_CENTER.x) * zoom + (state.servingCupAnim * (SERVE_COASTER.x - CUP_CENTER.x));
  const cupY = CUP_CENTER.y + (505 - CUP_CENTER.y) * zoom + (state.servingCupAnim * (SERVE_COASTER.y - CUP_CENTER.y));
  const cupScale = (1 + zoom * 0.68) * (1 - state.servingCupAnim * 0.42);
  const tiltPitch = 0.36 + zoom * 0.38;

  if (zoom > 0.05) {
    ctx.save();
    ctx.fillStyle = `rgba(250, 243, 227, ${zoom * 0.88})`;
    ctx.fillRect(0, 0, w, h);
    drawCastShadow(ctx, cupX, cupY + 12, 175 * zoom, 82 * zoom, 0.25);
    sketchEllipse(ctx, cupX, cupY + 8, 168 * zoom, 78 * zoom, '#E4CCB0', INK_DARK, 2.4, 88);
    ctx.restore();
  } else {
    drawBrewMat(ctx);
  }

  if (state.drink.cupStyle) {
    draw25DCup(ctx, {
      cx: cupX,
      baseY: cupY,
      scale: cupScale,
      tiltPitch,
      drink: state.drink,
      waveSim: state.waveSim,
      latteSim: state.latteSim,
      ripples: state.ripples,
      iceCubes: state.iceCubes,
      stencil: state.stencil,
      showStencilGuide: state.showStencilGuide && (zoom > 0.4 || state.pouringMode !== 'none'),
      time: t,
    });
  } else if (zoom < 0.1) {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = INK_PENCIL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(CUP_CENTER.x, CUP_CENTER.y, 48, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '18px "Patrick Hand", cursive, sans-serif';
    ctx.fillStyle = INK_SOFT;
    ctx.textAlign = 'center';
    ctx.fillText('Pick a cup on the rack ←', CUP_CENTER.x, CUP_CENTER.y - 24);
    ctx.restore();
  }

  if (zoom > 0.4 && state.drink.cupStyle) {
    drawInteractivePourPitcherOrPen(ctx, state, cupX, cupY, cupScale, tiltPitch, t);
    ctx.save();
    ctx.fillStyle = INK_DARK;
    ctx.font = 'bold 26px "Patrick Hand", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      state.pouringMode === 'etch'
        ? '✨ Drag across the foam with your wooden skewer to draw fine details!'
        : '🥛 Hold & move across the coffee to pour velvety latte art!',
      620,
      104
    );
    ctx.restore();
  }

  if (zoom < 0.2 && state.hoveredId && !state.hoveredId.startsWith('cat:')) {
    const zones = computeHitZones(state);
    const hz = zones.find((z) => z.id === state.hoveredId && !z.disabled);
    if (hz) {
      ctx.save();
      ctx.strokeStyle = 'rgba(201, 108, 80, 0.72)';
      ctx.lineWidth = 2.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(hz.x - 2, hz.y - 2, hz.w + 4, hz.h + 4, 12);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (state.pouringStream && state.drink.cupStyle) {
    const g = getCupGeometry(state.drink.cupStyle, cupX, cupY, cupScale, tiltPitch);
    const fill = getLiquidFillRatio(state.drink);
    const hitY = g.baseY - 8 * cupScale - fill * (g.height - 18 * cupScale);
    drawParabolicPourStream(
      ctx,
      state.pouringStream.fromX,
      state.pouringStream.fromY,
      cupX + state.pourTargetNormX * g.topRx * 0.5,
      hitY,
      state.pouringStream.color,
      state.pouringStream.width,
      t
    );
  }

  drawParticles(ctx, state.particles);

  // Subtle Cold-Press Gouache Paper Grain Overlay
  ctx.save();
  const paper = getWatercolorPaperCanvas();
  const pat = ctx.createPattern(paper, 'repeat');
  if (pat) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.21;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();

  ctx.restore();
}

function drawBackWallAndWindow(ctx: CanvasRenderingContext2D, state: SceneRenderState, t: number): void {
  const w = LOGICAL_W;
  const lightTier = state.upgradeLevels.lighting ?? 0;

  // Warm GPGP gouache café plaster + soft terracotta brickwork accents
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 275);
  wallGrad.addColorStop(0, '#F6E8D0');
  wallGrad.addColorStop(0.75, '#EED9B8');
  wallGrad.addColorStop(1, '#E2C49A');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(-20, -20, w + 40, 295);

  // Painterly warm brick tiles scattered delicately along wall
  ctx.fillStyle = 'rgba(189, 123, 86, 0.13)';
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 18; c++) {
      if ((r * 7 + c * 3) % 4 === 0) {
        ctx.fillRect(c * 72 + (r % 2) * 32, 22 + r * 36, 46, 20);
      }
    }
  }

  // Warm wood wainscoting paneling
  ctx.fillStyle = '#D5B289';
  ctx.fillRect(-20, 214, w + 40, 62);
  sketchLine(ctx, 0, 214, w, 214, 11, 0.6, INK_DARK, 2.4);

  // Arched Window (x = 326..668, y = 26..218)
  const wx = 326;
  const wy = 26;
  const ww = 342;
  const wh = 192;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(wx, wy + wh);
  ctx.lineTo(wx, wy + 72);
  ctx.quadraticCurveTo(wx, wy, wx + ww * 0.5, wy);
  ctx.quadraticCurveTo(wx + ww, wy, wx + ww, wy + 72);
  ctx.lineTo(wx + ww, wy + wh);
  ctx.closePath();

  const skyGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  if (state.weather === 'rain') {
    skyGrad.addColorStop(0, '#96AEB9');
    skyGrad.addColorStop(1, '#D6E0DF');
  } else if (state.weather === 'mist') {
    skyGrad.addColorStop(0, '#B8CBCC');
    skyGrad.addColorStop(1, '#F2E7D5');
  } else if (state.weather === 'sun') {
    skyGrad.addColorStop(0, '#A7CEE0');
    skyGrad.addColorStop(1, '#FDE9C0');
  } else {
    skyGrad.addColorStop(0, '#6E7299');
    skyGrad.addColorStop(0.55, '#C7969B');
    skyGrad.addColorStop(1, '#F3C594');
  }
  ctx.fillStyle = skyGrad;
  ctx.fill();

  ctx.save();
  ctx.clip();

  // Tier 3 Lighting: Stained-glass sun catcher arch at top of window!
  if (lightTier >= 3) {
    const panels = ['#E7938C', '#F2C777', '#8DB389', '#94B8CD', '#E7938C'];
    panels.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.68;
      ctx.fillRect(wx + (ww / panels.length) * i, wy, ww / panels.length + 1, 52);
    });
    ctx.globalAlpha = 1;
    sketchLine(ctx, wx, wy + 52, wx + ww, wy + 52, 81, 0.4, INK_DARK, 2.0);
  }

  // Cozy illustrated café street outside
  ctx.fillStyle = state.weather === 'dusk' ? '#635361' : '#B7A292';
  ctx.fillRect(wx + 10, wy + 108, 70, 95);
  ctx.fillRect(wx + 260, wy + 98, 74, 102);
  ctx.fillStyle = '#FCE192';
  ctx.fillRect(wx + 28, wy + 132, 16, 22);
  ctx.fillRect(wx + 286, wy + 126, 17, 22);

  const sway = Math.sin(t * 1.2) * 3.5;
  sketchEllipse(ctx, wx + 188 + sway, wy + 132, 74, 50, state.weather === 'dusk' ? '#667E65' : '#8FAE7F', null, 0, 12);
  sketchEllipse(ctx, wx + 112 + sway * 0.7, wy + 146, 48, 38, '#7F9E74', null, 0, 13);

  if (state.weather === 'rain') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 24; r++) {
      const rx = wx + ((r * 47 + t * 55) % ww);
      const ry = wy + ((r * 73 + t * 240) % wh);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 15);
      ctx.stroke();
    }
  } else if (state.weather === 'sun' || state.weather === 'mist') {
    ctx.fillStyle = 'rgba(255, 248, 210, 0.24)';
    ctx.beginPath();
    ctx.moveTo(wx + 48, wy);
    ctx.lineTo(wx + 150, wy);
    ctx.lineTo(wx + 275, wy + wh);
    ctx.lineTo(wx + 135, wy + wh);
    ctx.closePath();
    ctx.fill();
  } else if (state.weather === 'dusk') {
    ctx.fillStyle = '#FFFDF2';
    for (let s = 0; s < 10; s++) {
      const sx = wx + 30 + (s * 34) % (ww - 60);
      const sy = wy + 25 + (s * 23) % 70;
      const pulse = 1.2 + Math.sin(t * 2.5 + s) * 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Window Frame & Mullions
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 6;
  ctx.stroke();
  sketchLine(ctx, wx + ww * 0.5, wy + 2, wx + ww * 0.5, wy + wh, 14, 0.5, INK_DARK, 3.0);
  sketchLine(ctx, wx + 4, wy + 106, wx + ww - 4, wy + 106, 15, 0.5, INK_DARK, 3.0);

  // GPGP-style warm terracotta & cream striped awning top header over window
  const stripeW = 28;
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#C96E52' : '#FAF1E0';
    ctx.beginPath();
    ctx.roundRect(wx - 4 + i * stripeW, wy - 10, stripeW + 1, 22, [0, 0, 8, 8]);
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // Wooden Sill
  drawWatercolorRect(ctx, wx - 12, wy + wh - 4, ww + 24, 18, '#B88B61', 4, 16);
  ctx.restore();

  // Tier 1+ Lighting: Paper Café Lanterns hanging symmetrically!
  if (lightTier >= 1) {
    for (const lx of [356, 638]) {
      sketchLine(ctx, lx, 0, lx, 44, 30, 0.3, INK_DARK, 1.8, false);
      const glow = ctx.createRadialGradient(lx, 56, 4, lx, 56, 36);
      glow.addColorStop(0, 'rgba(255, 226, 140, 0.55)');
      glow.addColorStop(1, 'rgba(255, 226, 140, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, 56, 36, 0, Math.PI * 2);
      ctx.fill();
      sketchEllipse(ctx, lx, 56, 14, 16, '#FCE4A2', INK_DARK, 1.9, 31);
      sketchLine(ctx, lx - 10, 56, lx + 10, 56, 32, 0.3, INK_SOFT, 1.1, false);
    }
  }

  // Tier 2+ Lighting: Amber String Fairy Lights across Window!
  if (lightTier >= 2) {
    ctx.save();
    ctx.strokeStyle = INK_SOFT;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(318, 46);
    ctx.quadraticCurveTo(497, 86, 676, 46);
    ctx.stroke();
    for (let b = 0; b < 8; b++) {
      const u = (b + 0.5) / 8;
      const bx = 318 + u * 358;
      const by = 46 + Math.sin(u * Math.PI) * 20;
      const glow = 0.75 + Math.sin(t * 2.6 + b * 0.9) * 0.25;
      const g = ctx.createRadialGradient(bx, by + 5, 1, bx, by + 5, 15);
      g.addColorStop(0, `rgba(255, 224, 130, ${0.72 * glow})`);
      g.addColorStop(1, 'rgba(255, 224, 130, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by + 5, 15, 0, Math.PI * 2);
      ctx.fill();
      sketchEllipse(ctx, bx, by + 5, 4.2, 5.5, '#FFE394', INK_DARK, 1.3, 30 + b);
    }
    ctx.restore();
  }

  // Greenery Tier 1+: Windowsill Succulents
  const greenTier = state.upgradeLevels.greenery ?? 0;
  if (greenTier >= 1) {
    for (let p = 0; p < 2; p++) {
      const sx = 352 + p * 26;
      const sy = 207;
      drawWatercolorRect(ctx, sx - 9, sy - 8, 18, 14, '#C87654', 4, 48 + p);
      sketchEllipse(ctx, sx, sy - 12, 10, 7, '#7CA467', INK_DARK, 1.5, 50 + p);
    }
  }
}

function drawCafeShelvesAndDecor(ctx: CanvasRenderingContext2D, state: SceneRenderState, t: number): void {
  const greenTier = state.upgradeLevels.greenery ?? 0;
  const wallTier = state.upgradeLevels.wall_art ?? 0;
  const musicTier = state.upgradeLevels.music_corner ?? 0;
  const counterTier = state.upgradeLevels.counter_charm ?? 0;
  const cushionTier = state.upgradeLevels.patience_cushions ?? 0;

  // Left Wall Upper Shelf (x = 32..265, y = 104)
  drawWatercolorRect(ctx, 32, 104, 232, 12, '#B6865D', 4, 21);
  // Glass Bean & Matcha Jars
  drawWatercolorRect(ctx, 44, 54, 34, 50, '#E2EFEF', 8, 22);
  drawWatercolorRect(ctx, 48, 72, 26, 28, '#5E3826', 4, 23, INK_SOFT, 1.0);
  drawWatercolorRect(ctx, 42, 46, 38, 9, '#C28E5C', 4, 24);

  drawWatercolorRect(ctx, 90, 62, 32, 42, '#E2EFEF', 8, 25);
  drawWatercolorRect(ctx, 94, 80, 24, 20, '#7D9E66', 4, 26, INK_SOFT, 1.0);
  drawWatercolorRect(ctx, 88, 55, 36, 8, '#C28E5C', 4, 27);

  // Music Corner Upgrades (Tier 1 Radio -> Tier 2 Vinyl -> Tier 3 Guitar!)
  if (musicTier === 1) {
    drawWatercolorRect(ctx, 134, 66, 56, 38, '#D9A467', 9, 28);
    sketchEllipse(ctx, 148, 86, 9, 9, '#FAF2E3', INK_DARK, 1.4, 29);
    drawWatercolorRect(ctx, 165, 76, 18, 18, '#6B4F41', 3, 30);
  } else if (musicTier >= 2) {
    drawWatercolorRect(ctx, 132, 74, 62, 30, '#9E6340', 6, 28);
    sketchEllipse(ctx, 160, 72, 20, 7, '#342B28', INK_DARK, 1.6, 29);
    sketchEllipse(ctx, 160, 72, 6, 2.3, '#D97B5E', null, 0, 30);
    ctx.save();
    ctx.fillStyle = INK_SOFT;
    ctx.font = '18px serif';
    ctx.globalAlpha = 0.5 + Math.sin(t * 2.5) * 0.25;
    ctx.fillText('♪', 184 + Math.sin(t * 2) * 4, 56 - ((t * 14) % 16));
    ctx.restore();
  }
  if (musicTier >= 3) {
    // Honey-spruce acoustic guitar resting beside shelf!
    ctx.save();
    ctx.translate(226, 78);
    ctx.rotate(0.18);
    sketchEllipse(ctx, 0, 14, 15, 18, '#D99B58', INK_DARK, 1.9, 31);
    sketchEllipse(ctx, 0, -2, 11, 12, '#D99B58', INK_DARK, 1.9, 32);
    sketchEllipse(ctx, 0, 10, 5, 5, '#4A2C1D', null, 0, 33);
    drawWatercolorRect(ctx, -3, -34, 6, 30, '#8A5636', 2, 34);
    ctx.restore();
  }

  // Greenery Tier 2: Trailing Pothos Vine on Left Shelf!
  if (greenTier >= 2) {
    drawWatercolorRect(ctx, 200, 68, 34, 36, '#C97B5B', 6, 35);
    ctx.save();
    ctx.strokeStyle = '#537349';
    ctx.lineWidth = 2;
    for (let v = 0; v < 2; v++) {
      const vx = 208 + v * 14;
      ctx.beginPath();
      ctx.moveTo(vx, 104);
      ctx.quadraticCurveTo(vx - 8, 128, vx - 3 + Math.sin(t + v) * 3, 148);
      ctx.stroke();
      for (let l = 0; l < 3; l++) {
        sketchEllipse(ctx, vx - 3 + (l % 2) * 7, 112 + l * 12, 6, 4, '#7EA468', INK_DARK, 1.2, 36 + l);
      }
    }
    ctx.restore();
  }

  // Greenery Tier 3: Hanging Botanical Fern Basket by Right Wall!
  if (greenTier >= 3) {
    sketchLine(ctx, 684, 0, 684, 38, 39, 0.3, INK_SOFT, 1.5, false);
    drawWatercolorRect(ctx, 668, 38, 32, 22, '#C88D5B', 6, 40);
    for (let f = -2; f <= 2; f++) {
      sketchEllipse(ctx, 684 + f * 9, 36 + Math.abs(f) * 3, 10, 5, '#6F9860', INK_DARK, 1.3, 41 + f);
    }
  }

  // Wall Art & Chalkboard Menu (x = 700..892)
  drawWatercolorRect(
    ctx,
    700,
    68,
    192,
    130,
    '#434A42',
    8,
    40,
    wallTier >= 1 ? '#C78E54' : '#8D6443',
    wallTier >= 1 ? 7 : 5
  );
  ctx.save();
  ctx.fillStyle = '#FAF3E3';
  ctx.font = 'bold 16px "Patrick Hand", cursive, sans-serif';
  ctx.fillText(wallTier >= 1 ? '✨ Paper & Pour Menu' : '☕ Paper & Pour', 715, 95);
  ctx.font = '13px "Patrick Hand", cursive, sans-serif';
  ctx.fillStyle = '#E6D8C2';
  ctx.fillText('• Fresh Ground Espresso', 715, 118);
  ctx.fillText('• Velvety Microfoam', 715, 138);
  ctx.fillText(state.day >= 2 ? '• Iced Glass Brews' : '• Hazelnut Warmers', 715, 158);
  ctx.fillText(state.day >= 3 ? '• Whisked Jade Matcha' : '• Made with Care ♥', 715, 178);
  ctx.restore();

  // Wall Art Tier 2+: Framed Gouache Postcards above shelf/window
  if (wallTier >= 2) {
    drawWatercolorRect(ctx, 276, 54, 34, 42, '#FAF3E3', 4, 44, '#8A5A3A', 3);
    sketchEllipse(ctx, 293, 75, 8, 8, '#E48A92', null, 0, 45);
  }
  if (wallTier >= 3) {
    // Nana's Brass Clock & Heirloom Portrait!
    sketchEllipse(ctx, 916, 84, 18, 18, '#F6ECD8', '#C69546', 4, 46);
    sketchLine(ctx, 916, 84, 916, 73, 47, 0.2, INK_DARK, 2, false);
    sketchLine(ctx, 916, 84, 924, 86, 48, 0.2, INK_DARK, 1.8, false);
  }

  // Corkboard backing on far-right wall behind the Order Sticky Note
  drawWatercolorRect(ctx, 948, 64, 304, 184, '#D6B185', 10, 41, '#9E734D', 4);

  // Countertop Charm Upgrades (Daisy Vase -> Croissant Cloche -> Copper Kettle)
  if (counterTier >= 1) {
    const vx = 918;
    const vy = 198;
    sketchEllipse(ctx, vx, vy + 4, 16, 21, '#B5D1D4', INK_DARK, 1.9, 61);
    for (let f = -1; f <= 1; f++) {
      sketchLine(ctx, vx, vy - 16, vx + f * 12, vy - 46, 62 + f, 0.6, '#658554', 2.0);
      sketchEllipse(ctx, vx + f * 12, vy - 48, 7, 7, f === 0 ? '#F7D065' : '#FAF4E8', INK_DARK, 1.4, 65 + f);
      sketchEllipse(ctx, vx + f * 12, vy - 48, 2.8, 2.8, '#E2993D', null, 0, 68 + f);
    }
  }
  if (counterTier >= 2) {
    // Glass Croissant Cloche at x = 836, y = 236
    const cx = 842;
    const cy = 248;
    sketchEllipse(ctx, cx, cy + 6, 26, 8, '#D9C2A2', INK_DARK, 1.8, 70);
    sketchEllipse(ctx, cx - 5, cy, 10, 6, '#DF9E52', INK_DARK, 1.4, 71);
    sketchEllipse(ctx, cx + 8, cy + 1, 9, 5.5, '#D48F44', INK_DARK, 1.4, 72);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy + 3, 22, Math.PI, Math.PI * 2);
    ctx.fillStyle = 'rgba(229, 245, 249, 0.42)';
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    sketchEllipse(ctx, cx, cy - 20, 4, 4, '#FAF3E3', INK_DARK, 1.4, 73);
    ctx.restore();
  }
  if (counterTier >= 3) {
    // Polished Copper Display Tea Pot beside cloche
    sketchEllipse(ctx, 888, 248, 14, 13, '#D4834E', INK_DARK, 1.8, 74);
    drawWatercolorRect(ctx, 882, 232, 12, 6, '#B86A39', 3, 75);
  }

  // Patience Cushions Tier 2+: Complimentary Shortbread Cookie Dish near Waiting Bench!
  if (cushionTier >= 2) {
    sketchEllipse(ctx, 294, 248, 16, 6, '#FAF3E3', INK_DARK, 1.6, 76);
    sketchEllipse(ctx, 290, 245, 5, 3, '#D8A262', INK_DARK, 1.2, 77);
    sketchEllipse(ctx, 298, 245, 5, 3, '#D8A262', INK_DARK, 1.2, 78);
  }
}

function drawPatienceMeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  patience: number,
  mood: CustomerMood,
  time: number
): void {
  if (mood === 'tasting' || mood === 'delighted') return;
  const pct = Math.max(0, Math.min(1, patience));
  const barCol = pct > 0.58 ? '#7EA86B' : pct > 0.3 ? '#E5A842' : '#D9644F';
  const shake = pct < 0.25 ? Math.sin(time * 22) * 1.4 : 0;

  ctx.save();
  ctx.translate(x + shake, y);
  drawWatercolorRect(ctx, 0, 0, 22, 118, '#FAF2E3', 10, 490);
  const fillH = Math.max(4, 96 * pct);
  drawWatercolorRect(ctx, 4, 14 + (96 - fillH), 14, fillH, barCol, 6, 491, INK_DARK, 1.2);

  // Cute status glyph at top of meter
  ctx.fillStyle = barCol;
  ctx.font = 'bold 12px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(pct > 0.58 ? '♥' : pct > 0.3 ? '⏳' : '!', 11, 12);
  ctx.restore();
}

function draw25DCounterSurface(ctx: CanvasRenderingContext2D, _state: SceneRenderState, _t: number): void {
  const w = LOGICAL_W;
  const h = LOGICAL_H;

  const lipGrad = ctx.createLinearGradient(0, 260, 0, 286);
  lipGrad.addColorStop(0, '#BC8B5E');
  lipGrad.addColorStop(1, '#9A6C44');
  ctx.fillStyle = lipGrad;
  ctx.fillRect(0, 260, w, 26);

  const woodGrad = ctx.createLinearGradient(0, 284, 0, h);
  woodGrad.addColorStop(0, '#E2C096');
  woodGrad.addColorStop(0.5, '#D4AE80');
  woodGrad.addColorStop(1, '#C19663');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(0, 284, w, h - 284);

  ctx.save();
  ctx.strokeStyle = 'rgba(112, 74, 44, 0.22)';
  ctx.lineWidth = 1.6;
  const vanishX = w * 0.5;
  const vanishY = -180;
  for (let i = -8; i <= 8; i++) {
    const bottomX = vanishX + i * 115;
    const topX = vanishX + (bottomX - vanishX) * ((284 - vanishY) / (h - vanishY));
    ctx.beginPath();
    ctx.moveTo(topX, 284);
    ctx.lineTo(bottomX, h);
    ctx.stroke();
  }
  ctx.restore();

  sketchLine(ctx, 0, 260, w, 260, 101, 0.6, INK_DARK, 2.5);
  sketchLine(ctx, 0, 284, w, 284, 102, 0.6, INK_DARK, 2.2);
}

function drawServingCoasterAndTipJar(ctx: CanvasRenderingContext2D, state: SceneRenderState, t: number): void {
  const cx = SERVE_COASTER.x;
  const cy = SERVE_COASTER.y;
  const ready = Boolean(state.drink.cupStyle && getLiquidFillRatio(state.drink) > 0.08 && state.order);
  const hovered = state.hoveredId === 'serve_coaster';

  ctx.save();
  if (ready) {
    const pulse = 0.55 + Math.sin(t * 4) * 0.25;
    ctx.strokeStyle = `rgba(218, 146, 58, ${pulse})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 56, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  sketchEllipse(ctx, cx, cy, 48, 17, hovered ? '#F6D99F' : '#DFC39B', INK_DARK, 2.0, 110);
  sketchEllipse(ctx, cx, cy, 36, 12, '#EAD4B2', INK_SOFT, 1.2, 111);
  if (ready) {
    drawWatercolorRect(ctx, cx - 44, cy - 42, 88, 21, '#FFF8E8', 8, 118, INK_DARK, 1.5);
    ctx.fillStyle = '#B85438';
    ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Serve Here ↑', cx, cy - 27);
  }
  ctx.restore();

  const jx = 768;
  const jy = 236;
  drawCastShadow(ctx, jx, jy + 32, 34, 11, 0.22);
  ctx.save();
  for (const c of state.tipCoins) {
    sketchEllipse(ctx, jx + c.x, jy + c.y, c.r, c.r * 0.6, c.color, INK_DARK, 1.3, 112);
  }
  drawWatercolorRect(ctx, jx - 28, jy - 24, 56, 56, 'rgba(225, 244, 248, 0.45)', 10, 113, INK_DARK, 2.0);
  drawWatercolorRect(ctx, jx - 22, jy - 31, 44, 9, '#C79F71', 4, 114, INK_DARK, 1.8);
  drawWatercolorRect(ctx, jx - 21, jy - 2, 42, 22, '#FAF3E3', 4, 115, INK_SOFT, 1.4);
  ctx.fillStyle = INK_DARK;
  ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TIPS ♥', jx, jy + 13);
  ctx.restore();
}

function drawBrewMat(ctx: CanvasRenderingContext2D): void {
  drawWatercolorRect(ctx, 456, 515, 240, 136, '#B88F68', 18, 120, INK_DARK, 2.2);
  drawWatercolorRect(ctx, 468, 526, 216, 114, '#CBA57E', 14, 121, INK_SOFT, 1.4);
  sketchEllipse(ctx, CUP_CENTER.x, CUP_CENTER.y + 4, 62, 22, '#B68D66', INK_SOFT, 1.5, 122);
}

function drawCupRack(ctx: CanvasRenderingContext2D, state: SceneRenderState): void {
  const availCups: CupStyle[] = ['ceramic_mug', 'iced_glass', 'latte_bowl', 'kraft_cup'];
  if (state.unlockedCups.includes('cat_mug')) availCups.push('cat_mug');
  if (state.unlockedCups.includes('frog_mug')) availCups.push('frog_mug');
  if (state.unlockedCups.includes('owl_mug')) availCups.push('owl_mug');

  const rackH = availCups.length > 6 ? 186 : 168;
  drawWatercolorRect(ctx, 20, 286, 130, rackH, '#E9D6BB', 12, 130, INK_DARK, 2.0);
  ctx.fillStyle = INK_SOFT;
  ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
  ctx.fillText('CUPS & GLASSES', 32, 302);

  availCups.forEach((cup, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 29 + col * 58;
    const y = 306 + row * 41;
    const isSel = state.drink.cupStyle === cup;
    const hovered = state.hoveredId === `cup:${cup}`;
    const locked = cup === 'iced_glass' && state.day < 2;

    ctx.save();
    if (locked) ctx.globalAlpha = 0.45;
    drawWatercolorRect(
      ctx,
      x,
      y,
      52,
      38,
      isSel ? '#F6D799' : hovered ? '#FFF8EB' : '#FAF2E3',
      8,
      140 + idx,
      isSel ? '#C96C50' : INK_DARK,
      isSel ? 2.4 : 1.5
    );

    const cx = x + 26;
    const meta = CUP_META[cup];
    if (meta.isGlass) {
      drawWatercolorRect(ctx, cx - 9, y + 7, 18, 25, '#D7EEF2', 3, 150 + idx, INK_DARK, 1.5);
    } else {
      sketchEllipse(ctx, cx, y + 12, 12, 4, meta.baseColor, INK_DARK, 1.4, 151 + idx);
      drawWatercolorRect(ctx, cx - 11, y + 12, 22, 18, meta.baseColor, 6, 152 + idx, INK_DARK, 1.5);
      if (cup === 'cat_mug') {
        ctx.fillStyle = '#3B2820';
        ctx.beginPath();
        ctx.moveTo(cx - 10, y + 11);
        ctx.lineTo(cx - 7, y + 5);
        ctx.lineTo(cx - 3, y + 11);
        ctx.moveTo(cx + 3, y + 11);
        ctx.lineTo(cx + 7, y + 5);
        ctx.lineTo(cx + 10, y + 11);
        ctx.fill();
        ctx.fillRect(cx - 5, y + 19, 2.2, 2.2);
        ctx.fillRect(cx + 3, y + 19, 2.2, 2.2);
      } else if (cup === 'frog_mug') {
        ctx.fillStyle = '#536E46';
        ctx.beginPath();
        ctx.arc(cx - 5, y + 18, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + 5, y + 18, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (cup === 'owl_mug') {
        ctx.fillStyle = '#56436E';
        ctx.beginPath();
        ctx.arc(cx - 5, y + 18, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + 5, y + 18, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (locked) {
      ctx.fillStyle = INK_DARK;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('D2', x + 48, y + 11);
    }
    ctx.restore();
  });
}

function drawGrinderAndTamper(ctx: CanvasRenderingContext2D, state: SceneRenderState, t: number): void {
  const gx = 85;
  const gy = 596;
  const eqTier = state.upgradeLevels.equipment ?? 0;
  const shake = state.grinder.groundProgress > 0 && state.grinder.groundProgress < 1 && state.hoveredId === 'grinder' ? Math.sin(t * 45) * 1.6 : 0;

  drawCastShadow(ctx, gx, gy + 54, 46, 15, 0.24);
  ctx.save();
  ctx.translate(shake, 0);

  drawWatercolorRect(ctx, gx - 26, gy - 102, 52, 48, 'rgba(232, 245, 245, 0.72)', 10, 160);
  for (let b = 0; b < 11; b++) {
    sketchEllipse(
      ctx,
      gx - 15 + (b * 9) % 32,
      gy - 66 - Math.floor(b / 4) * 9,
      6.5,
      4.5,
      '#583222',
      INK_DARK,
      1.2,
      161 + b
    );
  }
  drawWatercolorRect(ctx, gx - 30, gy - 109, 60, 10, eqTier >= 1 ? '#E3B956' : '#C79B55', 4, 175);

  drawWatercolorRect(ctx, gx - 34, gy - 54, 68, 98, eqTier >= 1 ? '#7B5133' : '#9E6E47', 10, 176);
  drawWatercolorRect(ctx, gx - 26, gy - 44, 52, 24, '#FAF2E3', 6, 177);
  ctx.fillStyle = INK_DARK;
  ctx.font = 'bold 14px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.grinder.groundProgress >= 1 ? 'GROUND!' : 'GRIND', gx, gy - 27);

  drawWatercolorRect(ctx, gx - 22, gy - 10, 44, 10, '#EADBC4', 4, 178, INK_SOFT, 1.2);
  if (state.grinder.groundProgress > 0) {
    drawWatercolorRect(ctx, gx - 21, gy - 9, 42 * state.grinder.groundProgress, 8, '#542D1C', 3, 179, INK_DARK, 0);
  }
  ctx.restore();

  const tx = 179;
  const ty = 612;
  drawCastShadow(ctx, tx, ty + 18, 28, 10, 0.22);
  sketchEllipse(ctx, tx, ty + 12, 26, 10, '#6B4F41', INK_DARK, 1.8, 180);
  drawWatercolorRect(ctx, tx - 16, ty - 14, 32, 22, eqTier >= 3 ? '#E6BC5A' : '#D3CFC9', 6, 181);
  if (state.grinder.groundProgress > 0.1) {
    const moundH = state.grinder.tamped ? 3 : 11 * state.grinder.groundProgress;
    sketchEllipse(ctx, tx, ty - 14 - moundH * 0.35, 14, 4 + moundH * 0.4, '#4B2818', INK_DARK, 1.3, 182);
  }
  const tampY = state.grinder.tamped ? ty - 18 : ty - 38;
  drawWatercolorRect(ctx, tx - 10, tampY - 22, 20, 14, '#B9784F', 6, 183);
  drawWatercolorRect(ctx, tx - 13, tampY - 8, 26, 7, '#D8A955', 3, 184);
  ctx.fillStyle = INK_DARK;
  ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.grinder.tamped ? 'Tamped ✓' : 'Tamp!', tx, ty + 32);
}

function drawEspressoMachine(ctx: CanvasRenderingContext2D, state: SceneRenderState, t: number): void {
  const mx = 164;
  const my = 318;
  const mw = 144;
  const mh = 185;
  const eqTier = state.upgradeLevels.equipment ?? 0;

  drawCastShadow(ctx, mx + mw * 0.5, my + mh + 6, 74, 18, 0.26);

  drawWatercolorRect(ctx, mx, my, mw, mh, '#F7EEDB', 16, 190);
  drawWatercolorRect(ctx, mx + 8, my + 8, mw - 16, 44, eqTier >= 2 ? '#C4775A' : '#8FA886', 10, 191);

  const gaugeX = mx + mw * 0.5;
  const gaugeY = my + 30;
  sketchEllipse(ctx, gaugeX, gaugeY, 17, 17, '#FFFDF7', INK_DARK, 1.9, 192);
  const needleAngle = -Math.PI * 0.75 + (state.grinder.pullingShot ? 1.45 + Math.sin(t * 14) * 0.08 : 0.2);
  sketchLine(
    ctx,
    gaugeX,
    gaugeY,
    gaugeX + Math.cos(needleAngle) * 12,
    gaugeY + Math.sin(needleAngle) * 12,
    193,
    0.3,
    '#C95B48',
    2.2,
    false
  );

  const leverDown = state.grinder.pullingShot;
  drawWatercolorRect(ctx, mx + mw * 0.5 - 24, my + 60, 48, 20, '#D7A850', 6, 194);
  sketchLine(
    ctx,
    mx + mw * 0.5 + 24,
    my + 68,
    mx + mw * 0.5 + 48,
    leverDown ? my + 90 : my + 50,
    195,
    0.5,
    INK_DARK,
    4.0,
    false
  );
  sketchEllipse(ctx, mx + mw * 0.5 + 48, leverDown ? my + 90 : my + 50, 6, 6, '#B8694B', INK_DARK, 1.5, 196);

  drawWatercolorRect(ctx, mx + 10, my + mh - 24, mw - 20, 22, '#B5B0A8', 6, 197);

  const sx = mx + mw * 0.5;
  const sy = my + mh - 26;
  drawWatercolorRect(ctx, sx - 18, sy - 34, 36, 34, 'rgba(235, 248, 250, 0.75)', 6, 198);
  if (state.shotCupFill > 0.02) {
    const hFill = 28 * Math.min(1, state.shotCupFill);
    drawWatercolorRect(ctx, sx - 15, sy - 2 - hFill, 30, hFill, '#482515', 3, 199, INK_SOFT, 0.8);
    drawWatercolorRect(ctx, sx - 15, sy - 2 - hFill, 30, Math.min(7, hFill), '#C88446', 2, 200, INK_SOFT, 0.6);
  }

  if (state.grinder.pullingShot) {
    drawParabolicPourStream(ctx, sx - 5, my + 81, sx - 4, sy - 24, '#542B18', 3.5, t);
    drawParabolicPourStream(ctx, sx + 5, my + 81, sx + 4, sy - 24, '#C58044', 3.5, t);
  }

  ctx.save();
  ctx.strokeStyle = '#C9C4BC';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(mx + mw - 4, my + 84);
  ctx.quadraticCurveTo(mx + mw + 16, my + 92, mx + mw + 14, my + 124);
  ctx.stroke();
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = INK_DARK;
  ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  if (state.shotCupFill > 0.15) {
    ctx.fillStyle = '#B85438';
    ctx.fillText('Click Shot to Pour →', sx + 22, sy + 42);
  } else {
    ctx.fillText(state.grinder.pullingShot ? 'Brewing...' : 'Pull Espresso', sx, my + 98);
  }
}

function drawMatchaWhiskStation(ctx: CanvasRenderingContext2D, state: SceneRenderState, t: number): void {
  const locked = state.day < 3;
  ctx.save();
  if (locked) ctx.globalAlpha = 0.45;

  drawWatercolorRect(ctx, 332, 294, 54, 48, '#87AC6B', 8, 210);
  ctx.fillStyle = INK_DARK;
  ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Matcha', 359, 324);

  drawWatercolorRect(ctx, 394, 294, 54, 48, '#7A4C37', 8, 211);
  ctx.fillStyle = '#FAF3E3';
  ctx.fillText('Cocoa', 421, 324);

  const bx = 390;
  const by = 418;
  drawCastShadow(ctx, bx, by + 18, 42, 14, 0.2);
  sketchEllipse(ctx, bx, by - 10, 44, 15, '#EFE4D3', INK_DARK, 2.0, 212);
  drawWatercolorRect(ctx, bx - 40, by - 10, 80, 30, '#EFE4D3', 14, 213);

  if (state.whiskBowl.powder !== 'none') {
    const col = state.whiskBowl.powder === 'matcha' ? '#7AA45E' : '#5F3725';
    const foamCol = state.whiskBowl.powder === 'matcha' ? '#A4C88B' : '#8A5A42';
    sketchEllipse(
      ctx,
      bx,
      by - 8,
      36,
      11,
      state.whiskBowl.whiskProgress > 0.4 ? foamCol : col,
      INK_SOFT,
      1.2,
      214
    );
  }

  const wx = bx + (state.whiskBowl.whiskProgress > 0 && !state.whiskBowl.readyToPour ? Math.sin(t * 18) * 9 : 14);
  const wy = by - 26;
  drawWatercolorRect(ctx, wx - 6, wy - 20, 12, 22, '#DFBE86', 4, 215);
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 1.4;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(wx + i * 2, wy + 2);
    ctx.lineTo(wx + i * 3.5, wy + 15);
    ctx.stroke();
  }

  ctx.fillStyle = INK_DARK;
  ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
  ctx.fillText(
    locked
      ? 'Unlocks Day 3'
      : state.whiskBowl.readyToPour
      ? 'Pour Bowl →'
      : state.whiskBowl.powder !== 'none'
      ? `Whisk ${Math.round(state.whiskBowl.whiskProgress * 100)}%`
      : 'Whisk Bowl',
    bx,
    by + 36
  );
  ctx.restore();
}

function drawKettleAndRinse(ctx: CanvasRenderingContext2D, state: SceneRenderState, _t: number): void {
  const kx = 398;
  const ky = 545;
  drawCastShadow(ctx, kx, ky + 28, 34, 11, 0.22);
  ctx.save();
  ctx.translate(kx, ky);
  ctx.rotate(state.kettleTilting * 0.45);
  ctx.strokeStyle = '#C98553';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(20, 10);
  ctx.quadraticCurveTo(38, 6, 36, -20);
  ctx.stroke();
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  drawWatercolorRect(ctx, -26, -18, 52, 42, '#D4925E', 12, 220);
  sketchEllipse(ctx, 0, -18, 22, 7, '#BC7744', INK_DARK, 1.8, 221);
  sketchEllipse(ctx, 0, -25, 6, 5, '#4A3128', INK_DARK, 1.5, 222);
  ctx.restore();
  ctx.fillStyle = INK_DARK;
  ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Hot Water', kx, ky + 41);

  const rx = 394;
  const ry = 638;
  drawCastShadow(ctx, rx, ry + 26, 28, 10, 0.2);
  drawWatercolorRect(ctx, rx - 24, ry - 20, 48, 46, '#C8C2B8', 8, 225);
  sketchEllipse(ctx, rx, ry - 20, 24, 7, '#A7A096', INK_DARK, 1.8, 226);
  ctx.fillStyle = INK_DARK;
  ctx.fillText('Rinse Cup', rx, ry + 39);
}

function drawMilkAndIceStation(ctx: CanvasRenderingContext2D, state: SceneRenderState, t: number): void {
  const milks: MilkType[] = ['whole', 'oat', 'almond'];
  milks.forEach((m, idx) => {
    const mx = 724 + idx * 66;
    const my = 316;
    const meta = MILK_META[m];
    const isSel = state.pitcher.milkType === m && state.pitcher.fill > 0.05;
    drawCastShadow(ctx, mx + 26, my + 84, 26, 8, 0.18);
    ctx.beginPath();
    ctx.moveTo(mx + 2, my + 16);
    ctx.lineTo(mx + 26, my);
    ctx.lineTo(mx + 50, my + 16);
    ctx.closePath();
    ctx.fillStyle = '#FAF4E8';
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    drawWatercolorRect(
      ctx,
      mx,
      my + 16,
      52,
      68,
      meta.cartonColor,
      5,
      230 + idx,
      isSel ? '#C96C50' : INK_DARK,
      isSel ? 2.4 : 1.8
    );
    drawWatercolorRect(ctx, mx + 6, my + 32, 40, 32, '#FAF3E3', 4, 235 + idx, INK_SOFT, 1.1);
    ctx.fillStyle = INK_DARK;
    ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m.toUpperCase(), mx + 26, my + 52);
  });

  const sx = 762;
  const sy = 468;
  drawWatercolorRect(ctx, sx - 42, sy - 46, 84, 92, '#E9DEC8', 10, 240);
  sketchEllipse(ctx, sx, sy - 14, 24, 24, '#FFFDF7', INK_DARK, 1.9, 241);
  ctx.save();
  ctx.strokeStyle = '#7AA865';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(sx, sy - 14, 17, -0.35, 0.25);
  ctx.stroke();
  const tempNorm = Math.max(0, Math.min(1, (state.pitcher.tempC - 12) / 68));
  const ang = -Math.PI * 0.85 + tempNorm * Math.PI * 1.35;
  sketchLine(ctx, sx, sy - 14, sx + Math.cos(ang) * 16, sy - 14 + Math.sin(ang) * 16, 242, 0.2, '#C95B48', 2.2, false);
  ctx.restore();

  ctx.fillStyle = state.pitcher.isSteaming ? '#C95B48' : INK_DARK;
  ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    state.pitcher.isSteaming
      ? `Steaming ${Math.round(state.pitcher.tempC)}°C`
      : state.pitcher.fill > 0.1
      ? 'Steam Milk'
      : 'Steamer',
    sx,
    sy + 32
  );

  const px = 776;
  const py = 594;
  drawCastShadow(ctx, px, py + 38, 42, 14, 0.22);
  ctx.save();
  if (state.pitcher.isSteaming) {
    ctx.translate(Math.sin(t * 28) * 1.4, -12);
    for (let p = 0; p < 3; p++) {
      const puff = (t * 1.4 + p * 0.6) % 1;
      ctx.save();
      ctx.globalAlpha = (1 - puff) * 0.65;
      sketchEllipse(ctx, px + (p - 1) * 14, py - 35 - puff * 28, 9, 6, '#FFFDF7', null, 0, 243 + p);
      ctx.restore();
    }
  }

  drawWatercolorRect(ctx, px - 34, py - 24, 68, 62, '#D8D6D2', 12, 245);
  sketchEllipse(ctx, px, py - 24, 34, 11, '#BDBAB4', INK_DARK, 2.0, 246);
  if (state.pitcher.fill > 0.05) {
    const mc = MILK_META[state.pitcher.milkType]?.color || '#FAF1DF';
    const slosh = state.pitcherWave.sample(0.3) * 0.35;
    sketchEllipse(ctx, px, py - 18 + slosh, 29, 9, mc, INK_SOFT, 1.0, 247);
  }
  ctx.fillStyle = INK_DARK;
  ctx.font = 'bold 14px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.pitcher.fill > 0.1 ? 'Pour Milk →' : 'Pitcher', px, py + 56);
  ctx.restore();

  const ix = 898;
  const iy = 594;
  const iceLocked = state.day < 2;
  ctx.save();
  if (iceLocked) ctx.globalAlpha = 0.45;
  drawCastShadow(ctx, ix, iy + 38, 38, 13, 0.2);
  drawWatercolorRect(ctx, ix - 36, iy - 24, 72, 62, '#C8D8DE', 10, 250);
  sketchEllipse(ctx, ix, iy - 24, 36, 11, '#A4B8C2', INK_DARK, 1.8, 251);
  for (let c = 0; c < 4; c++) {
    drawWatercolorRect(ctx, ix - 24 + c * 13, iy - 34 + (c % 2) * 5, 16, 14, '#EEF8FB', 3, 252 + c);
  }
  ctx.fillStyle = INK_DARK;
  ctx.font = 'bold 14px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(iceLocked ? 'Ice (Day 2)' : '+ Add Ice', ix, iy + 56);
  ctx.restore();
}

function drawSyrupsAndToppings(ctx: CanvasRenderingContext2D, state: SceneRenderState): void {
  drawWatercolorRect(ctx, 962, 428, 294, 14, '#B5855A', 4, 260);
  const syrups: SyrupType[] = ['vanilla', 'caramel', 'hazelnut', 'strawberry', 'lavender'];

  syrups.forEach((s, idx) => {
    const meta = SYRUP_META[s];
    const locked = state.day < meta.unlockDay;
    const x = 972 + idx * 58;
    const y = 324;
    ctx.save();
    if (locked) ctx.globalAlpha = 0.4;
    drawCastShadow(ctx, x + 20, y + 106, 20, 6, 0.16);
    sketchLine(ctx, x + 20, y + 10, x + 20, y - 6, 262 + idx, 0.3, INK_DARK, 3.0, false);
    sketchLine(ctx, x + 20, y - 6, x + 9, y - 2, 263 + idx, 0.3, INK_DARK, 2.5, false);
    drawWatercolorRect(ctx, x + 4, y + 12, 32, 92, meta.bottleColor, 8, 265 + idx);
    drawWatercolorRect(ctx, x + 7, y + 36, 26, 42, '#FAF3E3', 4, 270 + idx, INK_SOFT, 1.1);
    ctx.fillStyle = INK_DARK;
    ctx.font = 'bold 11px "Patrick Hand", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(meta.short, x + 20, y + 60);
    if (locked) ctx.fillText(`D${meta.unlockDay}`, x + 20, y + 74);
    ctx.restore();
  });

  const toppings: ToppingType[] = ['cinnamon', 'cocoa_dust', 'matcha_dust', 'whipped_cream', 'caramel_drizzle', 'cookie'];
  toppings.forEach((top, idx) => {
    const meta = TOPPING_META[top];
    const locked = state.day < meta.unlockDay;
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 966 + col * 94;
    const y = 472 + row * 94;
    const added = state.drink.toppings.includes(top);

    ctx.save();
    if (locked) ctx.globalAlpha = 0.42;
    drawWatercolorRect(
      ctx,
      x,
      y,
      88,
      84,
      added ? '#F3D8A0' : '#F4E8D4',
      12,
      280 + idx,
      added ? '#C96C50' : INK_DARK,
      added ? 2.2 : 1.7
    );

    const cx = x + 44;
    const cy = y + 34;
    if (top === 'whipped_cream') {
      sketchEllipse(ctx, cx, cy + 5, 18, 9, '#FFFDF7', INK_DARK, 1.5, 290);
      sketchEllipse(ctx, cx, cy - 3, 12, 7, '#FFFDF7', INK_DARK, 1.5, 291);
      sketchEllipse(ctx, cx, cy - 10, 6, 5, '#FFFDF7', INK_DARK, 1.5, 292);
    } else if (top === 'cookie') {
      sketchEllipse(ctx, cx, cy, 17, 13, '#D7A468', INK_DARK, 1.7, 293);
      ctx.fillStyle = '#5B3522';
      ctx.fillRect(cx - 5, cy - 3, 3, 3);
      ctx.fillRect(cx + 4, cy + 2, 3, 3);
      ctx.fillRect(cx - 2, cy + 5, 3, 3);
    } else if (top === 'caramel_drizzle') {
      drawWatercolorRect(ctx, cx - 10, cy - 14, 20, 28, '#D78A38', 6, 294);
    } else {
      drawWatercolorRect(ctx, cx - 11, cy - 12, 22, 26, meta.color, 5, 295 + idx);
      drawWatercolorRect(ctx, cx - 12, cy - 18, 24, 7, '#C9C4BC', 3, 298 + idx);
    }

    ctx.fillStyle = INK_DARK;
    ctx.font = 'bold 12px "Patrick Hand", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(locked ? `${meta.short} (D${meta.unlockDay})` : meta.short, cx, y + 72);
    ctx.restore();
  });
}

function drawInteractivePourPitcherOrPen(
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  cupX: number,
  cupY: number,
  cupScale: number,
  tiltPitch: number,
  t: number
): void {
  const g = getCupGeometry(state.drink.cupStyle!, cupX, cupY, cupScale, tiltPitch);
  const fill = getLiquidFillRatio(state.drink);
  const surfY = g.meta.isGlass
    ? g.baseY - 8 * cupScale - fill * (g.height - 16 * cupScale)
    : g.topY + (1 - Math.min(1, Math.max(0.15, fill) / 0.85)) * (g.height * 0.42);
  const targetX = cupX + state.pourTargetNormX * g.topRx * 0.72;
  const targetY = surfY + state.pourTargetNormY * g.topRy * 0.72;

  if (state.pouringMode === 'etch') {
    ctx.save();
    ctx.translate(targetX, targetY);
    ctx.rotate(-0.45);
    sketchLine(ctx, 0, 0, 72, -105, 305, 0.4, '#C89B63', 4.5, false);
    sketchLine(ctx, 0, 0, 4, -6, 306, 0.2, INK_DARK, 2.0, false);
    ctx.restore();
    return;
  }

  const px = targetX + 95;
  const py = targetY - 125;
  const tilt = state.isActivelyPouring ? -0.78 : -0.18;

  if (state.isActivelyPouring && state.pitcher.fill > 0.01) {
    const spoutX = px - 36;
    const spoutY = py + 12;
    const mc = MILK_META[state.pitcher.milkType]?.foamColor || '#FFFDF7';
    drawParabolicPourStream(ctx, spoutX, spoutY, targetX, targetY, mc, 7.5, t);
  }

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(tilt);
  drawWatercolorRect(ctx, -32, -30, 64, 66, '#DEDBD6', 12, 310);
  ctx.beginPath();
  ctx.moveTo(-32, -28);
  ctx.lineTo(-48, -32);
  ctx.lineTo(-32, -10);
  ctx.closePath();
  ctx.fillStyle = '#DEDBD6';
  ctx.fill();
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 2;
  ctx.stroke();
  sketchEllipse(ctx, 0, -30, 32, 10, '#C7C3BD', INK_DARK, 2.0, 311);
  if (state.pitcher.fill > 0.02) {
    sketchEllipse(ctx, -4, -26, 26, 8, '#FFFDF7', null, 0, 312);
  }
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: FluidParticle[]): void {
  for (const p of particles) {
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.kind === 'heart') {
      drawCuteHeart(ctx, p.x, p.y, p.size, p.color);
    } else if (p.kind === 'sparkle') {
      drawCuteSparkle(ctx, p.x, p.y, p.size, p.color);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

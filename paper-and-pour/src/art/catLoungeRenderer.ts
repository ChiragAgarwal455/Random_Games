import { CafeCat, WaitingGuest } from '../types/game';
import { drawCustomerCharacter } from './characterRenderer';
import {
  drawCastShadow,
  drawCuteHeart,
  drawWatercolorRect,
  INK_DARK,
  INK_SOFT,
  sketchEllipse,
  sketchLine,
} from './sketchUtils';

export function drawCatWaitingLounge(
  ctx: CanvasRenderingContext2D,
  waitingGuests: WaitingGuest[],
  cats: CafeCat[],
  catLoungeTier: number,
  hoveredId: string | null,
  time: number
): void {
  // Left waiting lounge area on customer side (x = 18..315, y = 132..262)
  ctx.save();

  // 1. Cozy Velvet Waiting Bench (shifted right cleanly beside the Cat Tree!)
  const benchColor = catLoungeTier >= 3 ? '#B6777D' : '#8FA385';
  drawWatercolorRect(ctx, 64, 178, 240, 42, benchColor, 10, 401);
  drawWatercolorRect(ctx, 60, 210, 248, 48, '#C89E72', 8, 402);
  // Quilted cushions
  drawWatercolorRect(ctx, 72, 198, 104, 18, '#F6ECD8', 7, 403);
  drawWatercolorRect(ctx, 190, 198, 104, 18, '#F6ECD8', 7, 404);

  // Small cozy lounge plaque centered neatly on the wooden bench base (never behind heads!)
  drawWatercolorRect(ctx, 114, 218, 140, 20, '#FAF2E1', 6, 405);
  ctx.fillStyle = INK_DARK;
  ctx.font = 'bold 12px "Patrick Hand", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐾 Cat Waiting Lounge', 184, 232);

  // Tier 1+: Braided Patchwork Rug & Yarn Ball
  if (catLoungeTier >= 1) {
    sketchEllipse(ctx, 176, 251, 82, 13, '#E8C9A5', INK_DARK, 1.8, 410);
    sketchEllipse(ctx, 176, 251, 58, 8, '#D38879', INK_SOFT, 1.2, 411);
    sketchEllipse(ctx, 276, 249, 10, 9, '#E68D97', INK_DARK, 1.5, 412);
    sketchLine(ctx, 270, 245, 282, 252, 413, 0.3, INK_SOFT, 1.2, false);
  }

  // Tier 2+: Wooden Two-Story Cat Tree standing cleanly in left corner!
  if (catLoungeTier >= 2) {
    drawWatercolorRect(ctx, 22, 152, 30, 100, '#C8A379', 6, 415);
    for (let s = 0; s < 4; s++) {
      sketchLine(ctx, 30, 170 + s * 14, 44, 170 + s * 14, 416 + s, 0.4, '#8A6746', 2.2, false);
    }
    drawWatercolorRect(ctx, 12, 143, 50, 12, '#EAD6BA', 5, 420);
    const sway = Math.sin(time * 2.5) * 4;
    sketchLine(ctx, 50, 155, 50 + sway, 177, 421, 0.3, INK_SOFT, 1.3, false);
    sketchEllipse(ctx, 50 + sway, 179, 5, 3, '#DF8B94', INK_DARK, 1.2, 422);
  }

  // 2. Waiting Customers seated on the bench!
  waitingGuests.slice(0, 2).forEach((wg, idx) => {
    const gx = 124 + idx * 112;
    const gy = 212;
    drawCustomerCharacter(
      ctx,
      wg.customer,
      gx,
      gy,
      wg.isPetting ? 'warm_smile' : 'waiting',
      time + idx * 1.3,
      1,
      0.66,
      wg.isPetting
    );
    if (wg.petHeartTimer > 0) {
      const rise = (1 - wg.petHeartTimer / 1.4) * 20;
      ctx.save();
      ctx.globalAlpha = Math.min(1, wg.petHeartTimer);
      drawCuteHeart(ctx, gx + 18, gy - 42 - rise, 8, '#E7828D');
      ctx.restore();
    }
  });

  // 3. Cute Interactive Café Cats!
  cats.forEach((cat) => {
    if (cat.unlockTierRequired > catLoungeTier) return;
    drawSingleCafeCat(ctx, cat, hoveredId === `cat:${cat.id}`, time);
  });

  ctx.restore();
}

function drawSingleCafeCat(
  ctx: CanvasRenderingContext2D,
  cat: CafeCat,
  isHovered: boolean,
  time: number
): void {
  const x = cat.x;
  const y = cat.y;
  const isHappy = cat.happyTimer > 0 || cat.state === 'being_petted';
  const squish = isHappy ? Math.sin(time * 10) * 1.8 : Math.sin(time * 2.4 + cat.tailPhase) * 0.9;

  const bodyColors =
    cat.coat === 'calico'
      ? { base: '#FFF7EA', patch1: '#DF925A', patch2: '#4A3932' }
      : cat.coat === 'ginger'
      ? { base: '#EAA15F', patch1: '#D17B3C', patch2: '#FFF3DF' }
      : { base: '#49423E', patch1: '#FAF4EB', patch2: '#37302D' };

  ctx.save();
  if (isHovered) {
    ctx.strokeStyle = 'rgba(201, 108, 80, 0.72)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(x, y - 6, 32, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawCastShadow(ctx, x, y + 10, 22, 6, 0.2);

  ctx.translate(x, y);
  ctx.scale(cat.facing, 1);

  // Tail swish
  const tailWag = Math.sin(time * (isHappy ? 6.5 : 2.3) + cat.tailPhase) * 6;
  ctx.save();
  ctx.strokeStyle = bodyColors.base;
  ctx.lineWidth = 6.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.quadraticCurveTo(-30, -4 + tailWag, -26, -15 + tailWag);
  ctx.stroke();
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 2.0;
  ctx.stroke();
  ctx.restore();

  // Plump Loaf Body
  sketchEllipse(ctx, -2, 2 + squish * 0.4, 21, 13 - squish * 0.3, bodyColors.base, INK_DARK, 2.0, 440);
  if (cat.coat === 'calico') {
    sketchEllipse(ctx, -9, -1, 7, 5, bodyColors.patch1, null, 0, 441);
    sketchEllipse(ctx, 2, -4, 6, 4.5, bodyColors.patch2, null, 0, 442);
  } else if (cat.coat === 'tuxedo') {
    sketchEllipse(ctx, 9, 4, 8, 7, bodyColors.patch1, null, 0, 443);
  }

  // Head + Ears
  const hx = 13;
  const hy = -9 + squish * 0.6;
  // Back ears
  for (const dx of [-7, 6]) {
    ctx.beginPath();
    ctx.moveTo(hx + dx - 5, hy - 5);
    ctx.lineTo(hx + dx, hy - 16);
    ctx.lineTo(hx + dx + 5, hy - 5);
    ctx.closePath();
    ctx.fillStyle = cat.coat === 'calico' && dx < 0 ? bodyColors.patch1 : bodyColors.base;
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.9;
    ctx.stroke();
  }

  sketchEllipse(ctx, hx, hy, 13.5, 11.5, bodyColors.base, INK_DARK, 2.0, 445);
  if (cat.coat === 'tuxedo') {
    sketchEllipse(ctx, hx + 2, hy + 4, 8, 5.5, '#FAF4EB', null, 0, 446);
  }

  // Happy squinted eyes or blinking cute eyes
  ctx.strokeStyle = INK_DARK;
  ctx.fillStyle = INK_DARK;
  ctx.lineWidth = 1.8;
  for (const ex of [hx - 3, hx + 6]) {
    if (isHappy) {
      ctx.beginPath();
      ctx.arc(ex, hy - 1, 3, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(ex, hy - 1, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Pink cheek & tiny ":3" mouth
  ctx.fillStyle = 'rgba(232, 139, 151, 0.55)';
  ctx.beginPath();
  ctx.arc(hx - 6, hy + 3, 2.6, 0, Math.PI * 2);
  ctx.arc(hx + 8, hy + 3, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hx + 2, hy + 3, 2.2, 0, Math.PI);
  ctx.stroke();

  // Floating "purr~" & hearts when petted!
  ctx.scale(cat.facing, 1); // unflip text!
  if (isHappy) {
    const floatY = -28 - ((time * 16) % 14);
    drawCuteHeart(ctx, 10, floatY, 7.5, '#E47B86');
    ctx.fillStyle = '#B25242';
    ctx.font = 'bold 12px "Patrick Hand", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('purr~ ♪', -12, floatY + 6);
  }
  ctx.restore();
}

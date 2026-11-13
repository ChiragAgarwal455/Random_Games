import { CustomerMood, CustomerProfile } from '../types/game';
import { darkenHex, drawCuteHeart, drawCuteSparkle, INK_DARK, INK_SOFT, sketchEllipse } from './sketchUtils';

export function drawCustomerCharacter(
  ctx: CanvasRenderingContext2D,
  customer: CustomerProfile,
  cx: number,
  counterTopY: number,
  mood: CustomerMood,
  time: number,
  enterProgress = 1
): void {
  const breathe = Math.sin(time * 2.1) * 2.4;
  const excitedHop = mood === 'delighted' ? Math.abs(Math.sin(time * 5.2)) * 7 : 0;
  const y = counterTopY + 12 + breathe - excitedHop;

  // Slide in smoothly from left
  const slideOffset = (1 - enterProgress) * -140;
  const x = cx + slideOffset;
  const alpha = Math.min(1, enterProgress * 1.25);

  ctx.save();
  ctx.globalAlpha = alpha;

  const fur = customer.accentColor;
  const outfit = customer.scarfOrOutfitColor;

  // 1. Torso & Outfit peeking up behind 2.5D counter
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 62, y + 6);
  ctx.quadraticCurveTo(x - 56, y - 48, x, y - 50);
  ctx.quadraticCurveTo(x + 56, y - 48, x + 62, y + 6);
  ctx.closePath();
  ctx.fillStyle = outfit;
  ctx.fill();
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Cute outfit details (collar / buttons / scarf)
  if (customer.species === 'bear' || customer.species === 'tortoise') {
    // Cream shirt triangle + buttons or bow tie
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 46);
    ctx.lineTo(x, y - 16);
    ctx.lineTo(x + 16, y - 46);
    ctx.closePath();
    ctx.fillStyle = '#FAF3E3';
    ctx.fill();
    ctx.stroke();

    if (customer.species === 'tortoise') {
      // Cute tweed bow tie!
      ctx.fillStyle = '#B85D43';
      ctx.beginPath();
      ctx.moveTo(x, y - 40);
      ctx.lineTo(x - 12, y - 47);
      ctx.lineTo(x - 12, y - 33);
      ctx.closePath();
      ctx.moveTo(x, y - 40);
      ctx.lineTo(x + 12, y - 47);
      ctx.lineTo(x + 12, y - 33);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (customer.species === 'fox' || customer.species === 'owl') {
    // Cozy wrapped scarf!
    ctx.beginPath();
    ctx.ellipse(x, y - 44, 42, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = darkenHex(outfit, 0.12);
    ctx.fill();
    ctx.stroke();
    // Scarf tail
    ctx.beginPath();
    ctx.roundRect(x + 12, y - 42, 16, 32, 6);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 2. Head & Species-Specific Ears/Hats
  const headY = y - 92;
  const headRx = customer.species === 'bear' ? 52 : customer.species === 'owl' ? 50 : 46;
  const headRy = customer.species === 'bunny' ? 42 : 44;

  // Back ears before head
  if (customer.species === 'bear') {
    for (const dir of [-1, 1]) {
      sketchEllipse(ctx, x + dir * 40, headY - 30, 15, 15, fur, INK_DARK, 2.2, 10 + dir);
      sketchEllipse(ctx, x + dir * 40, headY - 30, 8, 8, '#E6B7A9', null, 0, 11 + dir);
    }
  } else if (customer.species === 'bunny') {
    const earWiggle = Math.sin(time * 2.8) * 0.08;
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(x + dir * 22, headY - 34);
      ctx.rotate(dir * 0.22 + (dir === 1 ? earWiggle : -earWiggle * 0.5));
      sketchEllipse(ctx, 0, -26, 12, 30, fur, INK_DARK, 2.2, 20 + dir);
      sketchEllipse(ctx, 0, -24, 6, 20, '#F3C0C6', null, 0, 21 + dir);
      ctx.restore();
    }
  } else if (customer.species === 'cat' || customer.species === 'fox') {
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + dir * 18, headY - 34);
      ctx.lineTo(x + dir * 44, headY - 62);
      ctx.lineTo(x + dir * 44, headY - 22);
      ctx.closePath();
      ctx.fillStyle = fur;
      ctx.fill();
      ctx.strokeStyle = INK_DARK;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + dir * 24, headY - 35);
      ctx.lineTo(x + dir * 39, headY - 52);
      ctx.lineTo(x + dir * 39, headY - 27);
      ctx.closePath();
      ctx.fillStyle = customer.species === 'fox' ? '#FAF1E4' : '#E8B3B8';
      ctx.fill();
      ctx.restore();
    }
  } else if (customer.species === 'owl') {
    // Cute feather tufts
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + dir * 24, headY - 36);
      ctx.lineTo(x + dir * 44, headY - 54);
      ctx.lineTo(x + dir * 38, headY - 26);
      ctx.closePath();
      ctx.fillStyle = fur;
      ctx.fill();
      ctx.strokeStyle = INK_DARK;
      ctx.lineWidth = 2.1;
      ctx.stroke();
    }
  } else if (customer.species === 'duck') {
    // Fluffy tuft on top + star clip!
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - 6, headY - 40);
    ctx.quadraticCurveTo(x - 14, headY - 58, x, headY - 50);
    ctx.quadraticCurveTo(x + 12, headY - 62, x + 8, headY - 40);
    ctx.fillStyle = fur;
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawCuteSparkle(ctx, x - 24, headY - 32, 7, '#F5CB5C');
    ctx.restore();
  }

  // Main Head Circle/Oval
  sketchEllipse(ctx, x, headY, headRx, headRy, fur, INK_DARK, 2.4, 3);

  // Species facial markings
  if (customer.species === 'fox') {
    // Cream fox cheeks
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x - 20, headY + 14, 24, 19, -0.15, 0, Math.PI * 2);
    ctx.ellipse(x + 20, headY + 14, 24, 19, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#FAF2E6';
    ctx.fill();
    ctx.restore();
  } else if (customer.species === 'cat') {
    // Tuxedo muzzle patch
    sketchEllipse(ctx, x, headY + 16, 22, 16, '#FAF4EB', null, 0, 8);
  } else if (customer.species === 'owl') {
    // Cream facial disc
    sketchEllipse(ctx, x - 16, headY - 2, 19, 19, '#F3EAE0', INK_SOFT, 1.4, 9);
    sketchEllipse(ctx, x + 16, headY - 2, 19, 19, '#F3EAE0', INK_SOFT, 1.4, 10);
  } else if (customer.species === 'tortoise') {
    // Cozy moss shell peeking behind shoulders
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y - 34, 58, Math.PI * 1.05, Math.PI * 1.95);
    ctx.strokeStyle = '#536B48';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();
    // Cute wispy white Grandpa eyebrows
    ctx.strokeStyle = '#FAF3E3';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 26, headY - 14);
    ctx.quadraticCurveTo(x - 16, headY - 20, x - 8, headY - 13);
    ctx.moveTo(x + 26, headY - 14);
    ctx.quadraticCurveTo(x + 16, headY - 20, x + 8, headY - 13);
    ctx.stroke();
  }

  // Cute Accessories on Head
  if (customer.species === 'bunny') {
    // Strawberry beret!
    ctx.save();
    ctx.translate(x + 12, headY - 36);
    ctx.rotate(0.18);
    sketchEllipse(ctx, 0, 0, 26, 11, '#E27D89', INK_DARK, 2.0, 55);
    sketchEllipse(ctx, 0, -10, 3, 4, '#5E3829', INK_DARK, 1.4, 56);
    ctx.restore();
  } else if (customer.species === 'cat') {
    // Fisherman yellow knitted beanie!
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, headY - 30, 34, 18, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#E6B348';
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(x - 36, headY - 34, 72, 11, 5);
    ctx.fillStyle = '#D6A035';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 3. Eyes (with natural blinking + happy "^ ^" curves when delighted!)
  const blinkCycle = time % 4.3;
  const isBlinking = blinkCycle > 4.15;
  const happyEyes = mood === 'delighted' || mood === 'tasting' || mood === 'warm_smile';

  for (const dir of [-1, 1]) {
    const ex = x + dir * (customer.species === 'owl' ? 16 : 18);
    const ey = headY - 2;
    ctx.save();
    ctx.strokeStyle = INK_DARK;
    ctx.fillStyle = INK_DARK;
    ctx.lineWidth = 2.3;
    ctx.lineCap = 'round';

    if (happyEyes) {
      ctx.beginPath();
      ctx.arc(ex, ey + 2, 6.5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (isBlinking) {
      ctx.beginPath();
      ctx.moveTo(ex - 6, ey);
      ctx.lineTo(ex + 6, ey);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(ex, ey, 4.4, 0, Math.PI * 2);
      ctx.fill();
      // Cute catchlight sparkle
      ctx.fillStyle = '#FFFDF7';
      ctx.beginPath();
      ctx.arc(ex - 1.5, ey - 1.6, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Barnaby's round reading glasses!
  if (customer.species === 'bear') {
    ctx.save();
    ctx.strokeStyle = '#6A4E3C';
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.arc(x - 18, headY - 1, 11, 0, Math.PI * 2);
    ctx.moveTo(x - 7, headY - 1);
    ctx.lineTo(x + 7, headY - 1);
    ctx.moveTo(x + 29, headY - 1);
    ctx.arc(x + 18, headY - 1, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Rosy Watercolor Blush Cheeks
  ctx.save();
  ctx.fillStyle = mood === 'delighted' ? 'rgba(232, 120, 134, 0.55)' : 'rgba(232, 139, 151, 0.36)';
  ctx.beginPath();
  ctx.ellipse(x - 28, headY + 9, 8.5, 5.2, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 28, headY + 9, 8.5, 5.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Nose / Beak & Mouth
  if (customer.species === 'duck') {
    sketchEllipse(ctx, x, headY + 8, 12, 6.5, '#EC974A', INK_DARK, 2.0, 44);
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, headY + 8, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (customer.species === 'owl') {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - 5, headY + 3);
    ctx.lineTo(x + 5, headY + 3);
    ctx.lineTo(x, headY + 12);
    ctx.closePath();
    ctx.fillStyle = '#E8A54B';
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  } else {
    // Muzzle / Nose
    if (customer.species === 'bear') {
      sketchEllipse(ctx, x, headY + 11, 16, 12, '#E9D3BC', INK_SOFT, 1.5, 19);
    }
    ctx.fillStyle = customer.species === 'bunny' ? '#E48B96' : '#4A3128';
    ctx.beginPath();
    ctx.ellipse(x, headY + 7, 5, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute ":3" smile
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (mood === 'delighted' || mood === 'tasting') {
      ctx.arc(x, headY + 11, 7, 0.1 * Math.PI, 0.9 * Math.PI);
    } else {
      ctx.arc(x - 4.5, headY + 12, 4.5, 0.05 * Math.PI, 0.9 * Math.PI);
      ctx.moveTo(x, headY + 12);
      ctx.arc(x + 4.5, headY + 12, 4.5, 0.1 * Math.PI, 0.95 * Math.PI);
    }
    ctx.stroke();
  }

  // Cute Paws resting gently on the counter lip!
  if (mood !== 'tasting') {
    for (const dir of [-1, 1]) {
      const px = x + dir * 38;
      const py = counterTopY + 10 + Math.sin(time * 2.1 + dir) * 1.5;
      sketchEllipse(ctx, px, py, 12, 8, fur, INK_DARK, 2.0, 90 + dir);
    }
  }

  // Floating Hearts & Sparkles when tasting / delighted!
  if (mood === 'delighted' || mood === 'tasting') {
    for (let i = 0; i < 3; i++) {
      const floatUp = ((time * 0.9 + i * 0.7) % 1.8) / 1.8;
      const hx = x + (i - 1) * 34 + Math.sin(time * 3 + i) * 6;
      const hy = headY - 45 - floatUp * 38;
      ctx.save();
      ctx.globalAlpha = Math.sin(floatUp * Math.PI) * 0.9;
      if (i % 2 === 0) {
        drawCuteHeart(ctx, hx, hy, 11, '#E57A86');
      } else {
        drawCuteSparkle(ctx, hx, hy, 9, '#F3BE5A');
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

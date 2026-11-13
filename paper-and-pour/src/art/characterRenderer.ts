import { CustomerMood, CustomerProfile } from '../types/game';
import {
  darkenHex,
  drawCuteHeart,
  drawCuteSparkle,
  INK_DARK,
  INK_SOFT,
  lightenHex,
  sketchEllipse,
} from './sketchUtils';

export function drawCustomerCharacter(
  ctx: CanvasRenderingContext2D,
  customer: CustomerProfile,
  cx: number,
  counterTopY: number,
  mood: CustomerMood,
  time: number,
  enterProgress = 1,
  scale = 1,
  isPettingCat = false
): void {
  const isImpatient = mood === 'impatient';
  const isFrustrated = mood === 'frustrated';

  // GPGP-style lively breathing & fidget when impatient/frustrated
  const breathe = isFrustrated
    ? Math.sin(time * 7.5) * 2.1 * scale
    : isImpatient
    ? Math.sin(time * 4.2) * 2.0 * scale
    : Math.sin(time * 2.1) * 2.4 * scale;
  const excitedHop = mood === 'delighted' ? Math.abs(Math.sin(time * 5.4)) * 7 * scale : 0;
  const swayX = isFrustrated ? Math.sin(time * 6.4) * 2.2 * scale : 0;

  const y = counterTopY + 12 * scale + breathe - excitedHop;
  const slideOffset = (1 - enterProgress) * -120 * scale;
  const x = cx + slideOffset + swayX;
  const alpha = Math.min(1, enterProgress * 1.25);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  const fur = customer.accentColor;
  const outfit = customer.scarfOrOutfitColor;

  // 1. Torso & Outfit with GPGP painterly gouache folds
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-64, 6);
  ctx.quadraticCurveTo(-58, -50, 0, -52);
  ctx.quadraticCurveTo(58, -50, 64, 6);
  ctx.closePath();

  const bodyGrad = ctx.createLinearGradient(-45, -50, 45, 10);
  bodyGrad.addColorStop(0, lightenHex(outfit, 0.14));
  bodyGrad.addColorStop(0.6, outfit);
  bodyGrad.addColorStop(1, darkenHex(outfit, 0.18));
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // Outfit accents
  if (customer.species === 'bear' || customer.species === 'tortoise') {
    ctx.beginPath();
    ctx.moveTo(-18, -48);
    ctx.lineTo(0, -14);
    ctx.lineTo(18, -48);
    ctx.closePath();
    ctx.fillStyle = '#FAF3E3';
    ctx.fill();
    ctx.stroke();

    // Pocket watch / cardigan seam line
    ctx.strokeStyle = darkenHex(outfit, 0.25);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-26, -30);
    ctx.quadraticCurveTo(-24, -10, -28, 2);
    ctx.moveTo(26, -30);
    ctx.quadraticCurveTo(24, -10, 28, 2);
    ctx.stroke();

    if (customer.species === 'tortoise') {
      ctx.fillStyle = '#B85D43';
      ctx.strokeStyle = INK_DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.lineTo(-13, -47);
      ctx.lineTo(-13, -33);
      ctx.closePath();
      ctx.moveTo(0, -40);
      ctx.lineTo(13, -47);
      ctx.lineTo(13, -33);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (customer.species === 'fox' || customer.species === 'owl') {
    sketchEllipse(ctx, 0, -44, 44, 14, darkenHex(outfit, 0.08), INK_DARK, 2.2, 6);
    ctx.beginPath();
    ctx.roundRect(12, -42, 17, 34, 6);
    ctx.fillStyle = darkenHex(outfit, 0.12);
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    // Striped scarf fringe
    ctx.strokeStyle = '#FAF2E3';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(14, -22);
    ctx.lineTo(27, -22);
    ctx.stroke();
  } else if (customer.species === 'duck' || customer.species === 'bunny') {
    // Cozy peter-pan collar
    ctx.fillStyle = '#FFFDF7';
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-11, -44, 12, 6, 0.35, 0, Math.PI * 2);
    ctx.ellipse(11, -44, 12, 6, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 2. Head & Ears
  const headY = -94;
  const headRx = customer.species === 'bear' ? 53 : customer.species === 'owl' ? 51 : 47;
  const headRy = customer.species === 'bunny' ? 43 : 45;

  if (customer.species === 'bear') {
    for (const dir of [-1, 1]) {
      sketchEllipse(ctx, dir * 41, headY - 31, 15, 15, fur, INK_DARK, 2.4, 10 + dir);
      sketchEllipse(ctx, dir * 41, headY - 31, 8, 8, '#E6B7A9', null, 0, 11 + dir);
    }
  } else if (customer.species === 'bunny') {
    const earWiggle = isFrustrated ? Math.sin(time * 12) * 0.12 : Math.sin(time * 2.8) * 0.08;
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(dir * 22, headY - 35);
      ctx.rotate(dir * (isFrustrated ? 0.38 : 0.22) + (dir === 1 ? earWiggle : -earWiggle * 0.5));
      sketchEllipse(ctx, 0, -26, 12.5, 31, fur, INK_DARK, 2.3, 20 + dir);
      sketchEllipse(ctx, 0, -24, 6, 20, '#F3C0C6', null, 0, 21 + dir);
      ctx.restore();
    }
  } else if (customer.species === 'cat' || customer.species === 'fox') {
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(dir * 18, headY - 34);
      ctx.lineTo(dir * 45, headY - 63);
      ctx.lineTo(dir * 45, headY - 22);
      ctx.closePath();
      ctx.fillStyle = fur;
      ctx.fill();
      ctx.strokeStyle = INK_DARK;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(dir * 24, headY - 35);
      ctx.lineTo(dir * 39, headY - 53);
      ctx.lineTo(dir * 39, headY - 27);
      ctx.closePath();
      ctx.fillStyle = customer.species === 'fox' ? '#FAF1E4' : '#E8B3B8';
      ctx.fill();
      ctx.restore();
    }
  } else if (customer.species === 'owl') {
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 24, headY - 36);
      ctx.lineTo(dir * 44, headY - 55);
      ctx.lineTo(dir * 38, headY - 26);
      ctx.closePath();
      ctx.fillStyle = fur;
      ctx.fill();
      ctx.strokeStyle = INK_DARK;
      ctx.lineWidth = 2.3;
      ctx.stroke();
    }
  } else if (customer.species === 'duck') {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-6, headY - 41);
    ctx.quadraticCurveTo(-14, headY - 59, 0, headY - 51);
    ctx.quadraticCurveTo(12, headY - 63, 8, headY - 41);
    ctx.fillStyle = fur;
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    drawCuteSparkle(ctx, -24, headY - 32, 7.5, '#F5CB5C');
    ctx.restore();
  }

  // Main Head with warm gouache shading
  sketchEllipse(ctx, 0, headY, headRx, headRy, fur, INK_DARK, 2.5, 3);

  // Facial markings
  if (customer.species === 'fox') {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-20, headY + 14, 24, 19, -0.15, 0, Math.PI * 2);
    ctx.ellipse(20, headY + 14, 24, 19, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#FAF2E6';
    ctx.fill();
    ctx.restore();
  } else if (customer.species === 'cat') {
    sketchEllipse(ctx, 0, headY + 16, 22, 16, '#FAF4EB', null, 0, 8);
  } else if (customer.species === 'owl') {
    sketchEllipse(ctx, -16, headY - 2, 19, 19, '#F3EAE0', INK_SOFT, 1.5, 9);
    sketchEllipse(ctx, 16, headY - 2, 19, 19, '#F3EAE0', INK_SOFT, 1.5, 10);
  } else if (customer.species === 'tortoise') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -34, 59, Math.PI * 1.05, Math.PI * 1.95);
    ctx.strokeStyle = '#536B48';
    ctx.lineWidth = 8.5;
    ctx.stroke();
    ctx.restore();
  }

  // Hats
  if (customer.species === 'bunny') {
    ctx.save();
    ctx.translate(12, headY - 37);
    ctx.rotate(0.18);
    sketchEllipse(ctx, 0, 0, 27, 11.5, '#E27D89', INK_DARK, 2.2, 55);
    sketchEllipse(ctx, 0, -10, 3.2, 4.2, '#5E3829', INK_DARK, 1.5, 56);
    ctx.restore();
  } else if (customer.species === 'cat') {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, headY - 31, 35, 19, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#E6B348';
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 2.3;
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-37, headY - 35, 74, 11.5, 5);
    ctx.fillStyle = '#D6A035';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 3. EXPRESSIVE EYES & EYEBROWS (GPGP style!)
  const blinkCycle = time % 4.3;
  const isBlinking = blinkCycle > 4.15;
  const happyEyes = mood === 'delighted' || mood === 'tasting' || mood === 'warm_smile';

  for (const dir of [-1, 1]) {
    const ex = dir * (customer.species === 'owl' ? 16 : 18);
    const ey = headY - 2;
    ctx.save();
    ctx.strokeStyle = INK_DARK;
    ctx.fillStyle = INK_DARK;
    ctx.lineWidth = 2.4;
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
      ctx.arc(ex, ey, 4.6, 0, Math.PI * 2);
      ctx.fill();
      // Catchlight sparkle
      ctx.fillStyle = '#FFFDF7';
      ctx.beginPath();
      ctx.arc(ex - 1.5, ey - 1.7, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Half-lidded tired/impatient upper eyelid!
      if (isImpatient || isFrustrated) {
        ctx.fillStyle = fur;
        ctx.beginPath();
        ctx.arc(ex, ey - 1.2, 5.2, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = INK_DARK;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ex - 5.5, ey - 1.2);
        ctx.lineTo(ex + 5.5, ey - 1.2);
        ctx.stroke();
      }
    }

    // Eyebrows showing patience state!
    const browColor = customer.species === 'tortoise' ? '#FAF3E3' : INK_DARK;
    ctx.strokeStyle = browColor;
    ctx.lineWidth = customer.species === 'tortoise' ? 3.5 : 2.2;
    ctx.beginPath();
    if (isFrustrated) {
      // Dramatic V-furrowed brows!
      ctx.moveTo(ex - dir * 8, ey - 13);
      ctx.lineTo(ex + dir * 7, ey - 8);
    } else if (isImpatient) {
      // Slightly raised/worried angled brows
      ctx.moveTo(ex - 7, ey - 10 - dir * 1.5);
      ctx.lineTo(ex + 7, ey - 11 + dir * 1.5);
    } else {
      // Gentle soft arch
      ctx.moveTo(ex - 6, ey - 11);
      ctx.quadraticCurveTo(ex, ey - 14, ex + 6, ey - 11);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Barnaby's round reading glasses
  if (customer.species === 'bear') {
    ctx.save();
    ctx.strokeStyle = '#6A4E3C';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(-18, headY - 1, 11, 0, Math.PI * 2);
    ctx.moveTo(-7, headY - 1);
    ctx.lineTo(7, headY - 1);
    ctx.moveTo(29, headY - 1);
    ctx.arc(18, headY - 1, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Cheek Blush (darker/warmer when delighted or frustrated!)
  ctx.save();
  ctx.fillStyle = isFrustrated
    ? 'rgba(218, 96, 86, 0.5)'
    : mood === 'delighted'
    ? 'rgba(232, 120, 134, 0.58)'
    : 'rgba(232, 139, 151, 0.36)';
  ctx.beginPath();
  ctx.ellipse(-28, headY + 9, 8.8, 5.4, 0, 0, Math.PI * 2);
  ctx.ellipse(28, headY + 9, 8.8, 5.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Nose / Beak & Mouth Expression!
  if (customer.species === 'duck') {
    sketchEllipse(ctx, 0, headY + 8, 12.5, 6.8, '#EC974A', INK_DARK, 2.1, 44);
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    if (isFrustrated) {
      ctx.moveTo(-7, headY + 10);
      ctx.quadraticCurveTo(0, headY + 6, 7, headY + 10);
    } else if (isImpatient) {
      ctx.moveTo(-6, headY + 9);
      ctx.lineTo(6, headY + 9);
    } else {
      ctx.arc(0, headY + 8, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    }
    ctx.stroke();
  } else if (customer.species === 'owl') {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-5, headY + 3);
    ctx.lineTo(5, headY + 3);
    ctx.lineTo(0, headY + 12);
    ctx.closePath();
    ctx.fillStyle = '#E8A54B';
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  } else {
    if (customer.species === 'bear') {
      sketchEllipse(ctx, 0, headY + 11, 16, 12, '#E9D3BC', INK_SOFT, 1.5, 19);
    }
    ctx.fillStyle = customer.species === 'bunny' ? '#E48B96' : '#4A3128';
    ctx.beginPath();
    ctx.ellipse(0, headY + 7, 5.2, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (isFrustrated) {
      // Dramatic wavy frown!
      ctx.moveTo(-9, headY + 16);
      ctx.quadraticCurveTo(-4, headY + 11, 0, headY + 15);
      ctx.quadraticCurveTo(4, headY + 11, 9, headY + 16);
    } else if (isImpatient) {
      // Flat hesitant mouth
      ctx.moveTo(-7, headY + 15);
      ctx.quadraticCurveTo(0, headY + 13, 7, headY + 15);
    } else if (mood === 'delighted' || mood === 'tasting') {
      ctx.arc(0, headY + 11, 7.5, 0.1 * Math.PI, 0.9 * Math.PI);
    } else {
      ctx.arc(-4.5, headY + 12, 4.5, 0.05 * Math.PI, 0.9 * Math.PI);
      ctx.moveTo(0, headY + 12);
      ctx.arc(4.5, headY + 12, 4.5, 0.1 * Math.PI, 0.95 * Math.PI);
    }
    ctx.stroke();
  }

  // 6. Paws / Hands (tapping if impatient, reaching down gently if petting a cat!)
  if (mood !== 'tasting') {
    const tapOffset = isImpatient || isFrustrated ? Math.abs(Math.sin(time * 9)) * 4 : 0;
    const petMotion = isPettingCat ? Math.sin(time * 6.5) * 6 : 0;
    for (const dir of [-1, 1]) {
      const px = dir * 38;
      const py =
        dir === 1 && isPettingCat
          ? 2 + petMotion
          : -2 + (dir === -1 ? tapOffset : Math.sin(time * 2.1 + dir) * 1.5);
      sketchEllipse(ctx, px, py, 12.5, 8.5, fur, INK_DARK, 2.1, 90 + dir);
    }
  }

  // 7. Mood Particles (Sweat drop / Comic frustration puff / Joy hearts!)
  if (isImpatient) {
    // Cute comic sweat droplet beside temple
    const dropY = headY - 18 + (time * 12) % 8;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(36, dropY - 6);
    ctx.quadraticCurveTo(43, dropY + 2, 36, dropY + 5);
    ctx.quadraticCurveTo(29, dropY + 2, 36, dropY - 6);
    ctx.fillStyle = '#B8E2F2';
    ctx.fill();
    ctx.strokeStyle = INK_DARK;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  } else if (isFrustrated) {
    // Comic frustration puff / squiggle!
    const puffScale = 0.85 + Math.sin(time * 8) * 0.15;
    ctx.save();
    ctx.translate(42, headY - 38);
    ctx.scale(puffScale, puffScale);
    ctx.strokeStyle = '#D15947';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-5, -5, 5, 0, Math.PI * 0.5);
    ctx.moveTo(5, -5);
    ctx.arc(5, -5, 5, Math.PI * 0.5, Math.PI);
    ctx.moveTo(-5, 5);
    ctx.arc(-5, 5, 5, Math.PI * 1.5, Math.PI * 2);
    ctx.moveTo(5, 5);
    ctx.arc(5, 5, 5, Math.PI, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
  } else if (mood === 'delighted' || mood === 'tasting') {
    for (let i = 0; i < 3; i++) {
      const floatUp = ((time * 0.9 + i * 0.7) % 1.8) / 1.8;
      const hx = (i - 1) * 34 + Math.sin(time * 3 + i) * 6;
      const hy = headY - 45 - floatUp * 38;
      ctx.save();
      ctx.globalAlpha = Math.sin(floatUp * Math.PI) * 0.95;
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

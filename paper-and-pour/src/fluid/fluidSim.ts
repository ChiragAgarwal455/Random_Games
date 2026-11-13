export class LiquidWaveSim {
  public readonly n = 28;
  public h: Float32Array;
  public v: Float32Array;
  public sloshAngle = 0;
  public sloshAngVel = 0;

  constructor() {
    this.h = new Float32Array(this.n);
    this.v = new Float32Array(this.n);
  }

  public reset(): void {
    this.h.fill(0);
    this.v.fill(0);
    this.sloshAngle = 0;
    this.sloshAngVel = 0;
  }

  public exciteLateral(accel: number): void {
    this.sloshAngVel += accel * 0.14;
    for (let i = 0; i < this.n; i++) {
      const u = (i / (this.n - 1)) * 2 - 1;
      this.v[i] += u * accel * 0.25;
    }
  }

  public splash(normX: number, strength: number): void {
    const center = Math.max(1, Math.min(this.n - 2, normX * (this.n - 1)));
    for (let i = 0; i < this.n; i++) {
      const dist = Math.abs(i - center);
      if (dist < 4.5) {
        const weight = Math.exp(-dist * dist * 0.35);
        this.v[i] -= strength * weight;
      }
    }
  }

  public step(dt: number): void {
    const clampedDt = Math.min(0.033, Math.max(0.004, dt));
    const steps = 2;
    const subDt = clampedDt / steps;

    for (let s = 0; s < steps; s++) {
      // Rotational slosh mode
      const spring = -22.0 * this.sloshAngle - 3.6 * this.sloshAngVel;
      this.sloshAngVel += spring * subDt;
      this.sloshAngle += this.sloshAngVel * subDt;
      this.sloshAngle = Math.max(-0.24, Math.min(0.24, this.sloshAngle));

      const tension = 0.28;
      const damping = 0.045;
      const spread = 0.22;

      for (let i = 0; i < this.n; i++) {
        const accel = -tension * this.h[i] - damping * this.v[i];
        this.v[i] += accel;
        this.h[i] += this.v[i] * subDt * 60;
      }

      // Propagate to neighbors
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < this.n; i++) {
          if (i > 0) {
            const dL = spread * (this.h[i] - this.h[i - 1]);
            this.v[i - 1] += dL;
          }
          if (i < this.n - 1) {
            const dR = spread * (this.h[i] - this.h[i + 1]);
            this.v[i + 1] += dR;
          }
        }
      }

      // Clamp extremes
      for (let i = 0; i < this.n; i++) {
        this.h[i] = Math.max(-14, Math.min(14, this.h[i]));
      }
    }
  }

  public sample(normX: number): number {
    const f = Math.max(0, Math.min(1, normX)) * (this.n - 1);
    const i0 = Math.floor(f);
    const i1 = Math.min(this.n - 1, i0 + 1);
    const t = f - i0;
    const wave = this.h[i0] * (1 - t) + this.h[i1] * t;
    const tilt = (normX - 0.5) * Math.sin(this.sloshAngle) * 28;
    return wave + tilt;
  }
}

export interface SurfaceRipple {
  nx: number; // -1..1
  ny: number; // -1..1
  radius: number;
  maxRadius: number;
  alpha: number;
}

export interface IceCubeSim {
  nx: number; // -0.6..0.6
  ny: number; // -0.5..0.5
  depthOffset: number;
  bobPhase: number;
  angle: number;
  angVel: number;
  size: number;
  dropAnim: number; // 0..1 falling in
}

export interface FluidParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: 'drop' | 'dust' | 'steam' | 'sparkle' | 'heart' | 'syrup_drop';
}

export class LatteSurfaceSim {
  public readonly size = 84;
  private foam: Float32Array;
  private foamTmp: Float32Array;
  private crema: Float32Array;
  private cremaTmp: Float32Array;
  private vx: Float32Array;
  private vy: Float32Array;
  private vxTmp: Float32Array;
  private vyTmp: Float32Array;

  public baseColor: [number, number, number] = [92, 52, 32]; // espresso brown
  public cremaColor: [number, number, number] = [199, 130, 70];
  public foamColor: [number, number, number] = [253, 247, 236];
  public swirlTint: [number, number, number] | null = null;
  public swirlStrength = 0;

  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imgData: ImageData;
  private dirty = true;

  constructor() {
    const count = this.size * this.size;
    this.foam = new Float32Array(count);
    this.foamTmp = new Float32Array(count);
    this.crema = new Float32Array(count);
    this.cremaTmp = new Float32Array(count);
    this.vx = new Float32Array(count);
    this.vy = new Float32Array(count);
    this.vxTmp = new Float32Array(count);
    this.vyTmp = new Float32Array(count);

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d')!;
    this.imgData = this.ctx.createImageData(this.size, this.size);
    this.reset();
  }

  public reset(): void {
    this.foam.fill(0);
    this.crema.fill(0);
    this.vx.fill(0);
    this.vy.fill(0);
    this.baseColor = [78, 42, 26];
    this.cremaColor = [199, 130, 70];
    this.foamColor = [253, 247, 236];
    this.swirlTint = null;
    this.swirlStrength = 0;
    this.dirty = true;
  }

  public setPalette(
    base: [number, number, number],
    crema: [number, number, number],
    foam: [number, number, number]
  ): void {
    this.baseColor = base;
    this.cremaColor = crema;
    this.foamColor = foam;
    this.dirty = true;
  }

  public seedCrema(amount = 0.85): void {
    const s = this.size;
    const half = s * 0.5;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const dx = (x - half) / half;
        const dy = (y - half) / half;
        const r2 = dx * dx + dy * dy;
        if (r2 <= 1) {
          const i = y * s + x;
          const mottling = 0.86 + 0.14 * Math.sin(x * 0.45 + y * 0.35);
          this.crema[i] = Math.min(1, Math.max(this.crema[i], amount * mottling * (1 - r2 * 0.12)));
        }
      }
    }
    this.dirty = true;
  }

  public seedSyrupSwirl(rgb: [number, number, number], amount = 0.55): void {
    this.swirlTint = rgb;
    this.swirlStrength = Math.min(0.85, this.swirlStrength + amount);
    // Add gentle spiral velocity
    const s = this.size;
    const half = s * 0.5;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const dx = (x - half) / half;
        const dy = (y - half) / half;
        const r = Math.hypot(dx, dy);
        if (r > 0.05 && r < 0.96) {
          const i = y * s + x;
          this.vx[i] += (-dy / r) * 0.45;
          this.vy[i] += (dx / r) * 0.45;
        }
      }
    }
    this.dirty = true;
  }

  public injectMilkPour(nx: number, ny: number, dirX: number, dirY: number, foamLevel: number, rate: number): void {
    const s = this.size;
    const cx = (nx * 0.5 + 0.5) * s;
    const cy = (ny * 0.5 + 0.5) * s;
    const radius = 5.5 + foamLevel * 4.5;
    const rSq = radius * radius;

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 < rSq * 2.2) {
          const i = y * s + x;
          const falloff = Math.exp(-d2 / (rSq * 0.62));
          // High foam floats bright cream, low foam blends base lighter
          const deposit = rate * (0.45 + foamLevel * 0.95) * falloff * 1.8;
          this.foam[i] = Math.min(1, this.foam[i] + deposit);

          // Radial outward push + pointer motion drag
          const dist = Math.sqrt(d2) + 0.5;
          this.vx[i] += (dx / dist) * 0.95 * rate + dirX * 1.45 * falloff;
          this.vy[i] += (dy / dist) * 0.95 * rate + dirY * 1.45 * falloff;
        }
      }
    }
    this.dirty = true;
  }

  public etchDrag(nx: number, ny: number, dxNorm: number, dyNorm: number): void {
    const s = this.size;
    const cx = (nx * 0.5 + 0.5) * s;
    const cy = (ny * 0.5 + 0.5) * s;
    const radius = 4.2;
    const rSq = radius * radius;

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 < rSq * 2) {
          const i = y * s + x;
          const w = Math.exp(-d2 / rSq);
          this.vx[i] += dxNorm * 3.8 * w;
          this.vy[i] += dyNorm * 3.8 * w;
          // Etching slightly parts foam near needle tip to bring crema ribbon through
          if (d2 < rSq * 0.35) {
            this.foam[i] = Math.max(0, this.foam[i] - 0.08 * w);
          }
        }
      }
    }
    this.dirty = true;
  }

  public step(dt: number): void {
    const s = this.size;
    const half = s * 0.5;
    let hasVel = false;

    for (let i = 0; i < this.vx.length; i++) {
      if (Math.abs(this.vx[i]) > 0.008 || Math.abs(this.vy[i]) > 0.008) {
        hasVel = true;
        break;
      }
    }
    if (!hasVel) return;

    const advScale = Math.min(1.8, dt * 42);

    // Semi-Lagrangian Advection for foam, crema, and velocity
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = y * s + x;
        const dx = (x - half) / half;
        const dy = (y - half) / half;
        if (dx * dx + dy * dy > 1.04) {
          this.vxTmp[i] = 0;
          this.vyTmp[i] = 0;
          this.foamTmp[i] = this.foam[i];
          this.cremaTmp[i] = this.crema[i];
          continue;
        }

        const sx = Math.max(0, Math.min(s - 1.001, x - this.vx[i] * advScale));
        const sy = Math.max(0, Math.min(s - 1.001, y - this.vy[i] * advScale));

        this.foamTmp[i] = this.bilerp(this.foam, sx, sy);
        this.cremaTmp[i] = this.bilerp(this.crema, sx, sy);
        this.vxTmp[i] = this.bilerp(this.vx, sx, sy) * 0.91;
        this.vyTmp[i] = this.bilerp(this.vy, sx, sy) * 0.91;
      }
    }

    this.foam.set(this.foamTmp);
    this.crema.set(this.cremaTmp);
    this.vx.set(this.vxTmp);
    this.vy.set(this.vyTmp);
    this.dirty = true;
  }

  private bilerp(arr: Float32Array, x: number, y: number): number {
    const s = this.size;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(s - 1, x0 + 1);
    const y1 = Math.min(s - 1, y0 + 1);
    const fx = x - x0;
    const fy = y - y0;
    const v00 = arr[y0 * s + x0];
    const v10 = arr[y0 * s + x1];
    const v01 = arr[y1 * s + x0];
    const v11 = arr[y1 * s + x1];
    return (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
  }

  public computeArtScore(): number {
    // Rewards pleasing balance of foam + crema contrast inside cup
    const s = this.size;
    const half = s * 0.5;
    let total = 0;
    let foamSum = 0;
    let edgeContrast = 0;

    for (let y = 1; y < s - 1; y++) {
      for (let x = 1; x < s - 1; x++) {
        const dx = (x - half) / half;
        const dy = (y - half) / half;
        if (dx * dx + dy * dy <= 0.88) {
          const i = y * s + x;
          total++;
          foamSum += this.foam[i];
          const diff =
            Math.abs(this.foam[i] - this.foam[i + 1]) +
            Math.abs(this.foam[i] - this.foam[i + s]);
          edgeContrast += diff;
        }
      }
    }
    if (total === 0) return 0;
    const avgFoam = foamSum / total;
    const balance = 1 - Math.abs(avgFoam - 0.42) * 1.4;
    const patternDetail = Math.min(1, (edgeContrast / total) * 14);
    const score = Math.max(0, Math.min(1, balance * 0.45 + patternDetail * 0.55));
    return avgFoam < 0.05 ? 0 : score;
  }

  public renderToCanvas(): HTMLCanvasElement {
    if (!this.dirty) return this.canvas;
    this.dirty = false;

    const s = this.size;
    const half = s * 0.5;
    const data = this.imgData.data;

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const dx = (x - half) / half;
        const dy = (y - half) / half;
        const r2 = dx * dx + dy * dy;
        const idx = (y * s + x) * 4;

        if (r2 > 1.0) {
          data[idx + 3] = 0;
          continue;
        }

        const i = y * s + x;
        const cr = this.crema[i];
        const fm = this.foam[i];

        // Layer 1: base liquid -> crema
        let r = this.baseColor[0] * (1 - cr) + this.cremaColor[0] * cr;
        let g = this.baseColor[1] * (1 - cr) + this.cremaColor[1] * cr;
        let b = this.baseColor[2] * (1 - cr) + this.cremaColor[2] * cr;

        // Subtle watercolor swirl tint (caramel/strawberry/lavender)
        if (this.swirlTint && this.swirlStrength > 0.01) {
          const ribbon = Math.max(0, Math.sin(x * 0.25 + y * 0.18 + fm * 4.2)) * this.swirlStrength * 0.45;
          r = r * (1 - ribbon) + this.swirlTint[0] * ribbon;
          g = g * (1 - ribbon) + this.swirlTint[1] * ribbon;
          b = b * (1 - ribbon) + this.swirlTint[2] * ribbon;
        }

        // Layer 2: velvety microfoam on top
        const foamBlend = Math.min(1, fm * 1.15);
        r = r * (1 - foamBlend) + this.foamColor[0] * foamBlend;
        g = g * (1 - foamBlend) + this.foamColor[1] * foamBlend;
        b = b * (1 - foamBlend) + this.foamColor[2] * foamBlend;

        // Soft ambient occlusion near cup rim
        const rimShade = r2 > 0.72 ? 1 - (r2 - 0.72) * 0.35 : 1;
        data[idx] = Math.round(r * rimShade);
        data[idx + 1] = Math.round(g * rimShade);
        data[idx + 2] = Math.round(b * rimShade);
        data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(this.imgData, 0, 0);
    return this.canvas;
  }
}

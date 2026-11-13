import { AudioMixSettings } from '../types/game';

class AsmrAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private foleyGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private pinkBuffer: AudioBuffer | null = null;
  private brownBuffer: AudioBuffer | null = null;
  private whiteBuffer: AudioBuffer | null = null;

  private started = false;
  private timers: number[] = [];
  private mix: AudioMixSettings = {
    masterMuted: false,
    rain: 0.55,
    ambience: 0.45,
    music: 0.38,
    foley: 0.78,
  };

  // Active continuous foley nodes
  private grindNode: { gain: GainNode; stop: () => void } | null = null;
  private espressoNode: { gain: GainNode; stop: () => void } | null = null;
  private steamNode: { gain: GainNode; filter: BiquadFilterNode; stop: () => void } | null = null;
  private pourNode: { gain: GainNode; filter: BiquadFilterNode; stop: () => void } | null = null;
  private lastWhiskTime = 0;

  public initAndResume(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.setupGraph();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (!this.started) {
      this.started = true;
      this.startAmbientLayers();
    }
  }

  public getMix(): AudioMixSettings {
    return { ...this.mix };
  }

  public setMix(next: Partial<AudioMixSettings>): AudioMixSettings {
    this.mix = { ...this.mix, ...next };
    this.applyVolumes();
    return this.getMix();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const masterTarget = this.mix.masterMuted ? 0.0001 : 0.85;
    this.masterGain.gain.setTargetAtTime(masterTarget, t, 0.08);
    this.rainGain?.gain.setTargetAtTime(this.mix.rain * 0.42, t, 0.12);
    this.ambienceGain?.gain.setTargetAtTime(this.mix.ambience * 0.36, t, 0.12);
    this.musicGain?.gain.setTargetAtTime(this.mix.music * 0.32, t, 0.14);
    this.foleyGain?.gain.setTargetAtTime(this.mix.foley * 0.85, t, 0.05);
  }

  private setupGraph(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 3.5;
    compressor.attack.value = 0.015;
    compressor.release.value = 0.25;

    const warmthFilter = ctx.createBiquadFilter();
    warmthFilter.type = 'lowpass';
    warmthFilter.frequency.value = 8200;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.mix.masterMuted ? 0 : 0.85;

    this.masterGain.connect(warmthFilter);
    warmthFilter.connect(compressor);
    compressor.connect(ctx.destination);

    this.rainGain = ctx.createGain();
    this.ambienceGain = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.foleyGain = ctx.createGain();

    this.rainGain.connect(this.masterGain);
    this.ambienceGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    this.foleyGain.connect(this.masterGain);

    this.reverbNode = this.createWarmReverb(2.3);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.38;
    this.reverbNode.connect(reverbReturn);
    reverbReturn.connect(this.masterGain);

    this.pinkBuffer = this.makeNoiseBuffer('pink', 4);
    this.brownBuffer = this.makeNoiseBuffer('brown', 4);
    this.whiteBuffer = this.makeNoiseBuffer('white', 3);

    this.applyVolumes();
  }

  private createWarmReverb(seconds: number): ConvolverNode {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let prev = 0;
      for (let i = 0; i < len; i++) {
        const decay = Math.pow(1 - i / len, 2.7);
        const white = Math.random() * 2 - 1;
        prev = prev * 0.55 + white * 0.45;
        data[i] = prev * decay;
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = impulse;
    return conv;
  }

  private makeNoiseBuffer(type: 'white' | 'pink' | 'brown', seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const out = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let lastBrown = 0;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'white') {
          out[i] = w * 0.5;
        } else if (type === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179;
          b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.96900 * b2 + w * 0.1538520;
          b3 = 0.86650 * b3 + w * 0.3104856;
          b4 = 0.55000 * b4 + w * 0.5329522;
          b5 = -0.7616 * b5 - w * 0.0168980;
          out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.07;
          b6 = w * 0.115926;
        } else {
          lastBrown = (lastBrown + 0.02 * w) / 1.02;
          out[i] = lastBrown * 2.2;
        }
      }
      // Crossfade loop seam for click-free looping
      const fade = Math.min(2048, Math.floor(length * 0.05));
      for (let i = 0; i < fade; i++) {
        const alpha = i / fade;
        const endIdx = length - fade + i;
        const blended = out[endIdx] * (1 - alpha) + out[i] * alpha;
        out[i] = blended;
      }
    }
    return buffer;
  }

  private startAmbientLayers(): void {
    if (!this.ctx || !this.rainGain || !this.ambienceGain || !this.musicGain) return;
    const ctx = this.ctx;

    // 1. Rain on Window (Warm Pink Noise + Swell LFO + Window Droplets)
    if (this.pinkBuffer) {
      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = this.pinkBuffer;
      rainSrc.loop = true;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 950;
      bp.Q.value = 0.45;

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 220;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.09;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 260;
      lfo.connect(lfoGain).connect(bp.frequency);
      lfo.start();

      rainSrc.connect(hp).connect(bp).connect(this.rainGain);
      rainSrc.start();
    }

    // 2. Cozy Café Warm Room Bed & Vinyl Dust
    if (this.brownBuffer) {
      const roomSrc = ctx.createBufferSource();
      roomSrc.buffer = this.brownBuffer;
      roomSrc.loop = true;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;

      roomSrc.connect(lp).connect(this.ambienceGain);
      roomSrc.start();
    }

    // Gentle stochastic raindrop & vinyl crackle scheduler
    const dripInterval = window.setInterval(() => {
      if (!this.ctx || this.mix.masterMuted || this.ctx.state !== 'running') return;
      if (this.mix.rain > 0.05 && Math.random() < 0.55) {
        this.triggerRaindrop();
      }
      if (this.mix.ambience > 0.05 && Math.random() < 0.38) {
        this.triggerVinylCrackle();
      }
      if (this.mix.ambience > 0.15 && Math.random() < 0.06) {
        this.triggerDistantCupClink();
      }
    }, 320);
    this.timers.push(dripInterval);

    // 3. Soft Felt-Piano Cozy Loop
    this.startGentleMusicLoop();
  }

  private triggerRaindrop(): void {
    if (!this.ctx || !this.rainGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + Math.random() * 0.25;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f0 = 900 + Math.random() * 1400;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.52, t + 0.055);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.015 + Math.random() * 0.015, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);
    osc.connect(g).connect(this.rainGain);
    if (this.reverbNode) g.connect(this.reverbNode);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  private triggerVinylCrackle(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + Math.random() * 0.2;
    const osc = ctx.createOscillator();
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 2400 + Math.random() * 1800;
    hp.Q.value = 2.0;
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 180 + Math.random() * 300;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.012, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    osc.connect(hp).connect(g).connect(this.ambienceGain);
    osc.start(t);
    osc.stop(t + 0.018);
  }

  private triggerDistantCupClink(): void {
    if (!this.ctx || !this.ambienceGain || !this.reverbNode) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const base = 1850 + Math.random() * 550;
    [base, base * 1.48].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(idx === 0 ? 0.016 : 0.008, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(g);
      g.connect(this.ambienceGain!);
      g.connect(this.reverbNode!);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  private startGentleMusicLoop(): void {
    // Cozy Cmaj9 - Am9 - Fmaj9 - G6 progressions in gentle felt-piano style
    const chords = [
      [261.63, 329.63, 392.0, 493.88, 587.33], // Cmaj9
      [220.0, 261.63, 329.63, 392.0, 493.88],  // Am9
      [174.61, 220.0, 261.63, 329.63, 392.0],  // Fmaj9
      [196.0, 246.94, 293.66, 329.63, 440.0],  // G6/9
    ];
    let step = 0;

    const scheduleNote = () => {
      if (!this.ctx || !this.musicGain || this.mix.masterMuted || this.mix.music < 0.02) return;
      if (this.ctx.state !== 'running') return;
      const chordIdx = Math.floor(step / 6) % chords.length;
      const noteInChord = step % 6;
      const chord = chords[chordIdx];

      // Leave breathing spaces in the pattern
      if (noteInChord !== 5) {
        const idx = noteInChord < chord.length ? noteInChord : Math.floor(Math.random() * chord.length);
        const freq = chord[idx] * (Math.random() < 0.18 ? 2 : 1);
        this.playFeltPianoNote(freq, noteInChord === 0 ? 0.14 : 0.085);
      }
      step++;
    };

    const interval = window.setInterval(scheduleNote, 760);
    this.timers.push(interval);
  }

  private playFeltPianoNote(freq: number, peakGain: number): void {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 2, t);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1150, t);
    lp.frequency.exponentialRampToValueAtTime(380, t + 1.8);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peakGain, t + 0.035);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

    const g2 = ctx.createGain();
    g2.gain.value = 0.25;

    osc1.connect(lp);
    osc2.connect(g2).connect(lp);
    lp.connect(g);
    g.connect(this.musicGain);
    if (this.reverbNode) g.connect(this.reverbNode);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 2.5);
    osc2.stop(t + 2.5);
  }

  // ==================== INTERACTIVE BARISTA ASMR FOLEY ====================

  public startGrind(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain || this.grindNode || !this.whiteBuffer) return;
    const ctx = this.ctx;

    const src = ctx.createBufferSource();
    src.buffer = this.whiteBuffer;
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1150;
    bp.Q.value = 1.6;

    // Burr rotation modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 14;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 380;
    lfo.connect(lfoGain).connect(bp.frequency);

    const rumble = ctx.createOscillator();
    rumble.type = 'triangle';
    rumble.frequency.value = 92;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.08;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.06);

    src.connect(bp).connect(g);
    rumble.connect(rumbleGain).connect(g);
    g.connect(this.foleyGain);

    src.start();
    lfo.start();
    rumble.start();

    this.grindNode = {
      gain: g,
      stop: () => {
        const now = ctx.currentTime;
        g.gain.setTargetAtTime(0.0001, now, 0.04);
        window.setTimeout(() => {
          try {
            src.stop();
            lfo.stop();
            rumble.stop();
          } catch {
            // ignore
          }
        }, 180);
      },
    };
  }

  public stopGrind(): void {
    if (this.grindNode) {
      this.grindNode.stop();
      this.grindNode = null;
    }
  }

  public playTamp(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, t);
    osc.frequency.exponentialRampToValueAtTime(52, t + 0.12);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(g).connect(this.foleyGain);
    osc.start(t);
    osc.stop(t + 0.18);

    // Soft brass tamper rim click
    const ping = ctx.createOscillator();
    const pg = ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.value = 1480;
    pg.gain.setValueAtTime(0.06, t + 0.04);
    pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    ping.connect(pg).connect(this.foleyGain);
    ping.start(t + 0.04);
    ping.stop(t + 0.12);
  }

  public startEspressoPull(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain || this.espressoNode || !this.pinkBuffer) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Gentle 9-bar extraction hum + liquid hiss
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 110;
    const humG = ctx.createGain();
    humG.gain.value = 0.07;

    const noise = ctx.createBufferSource();
    noise.buffer = this.pinkBuffer;
    noise.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1550;
    bp.Q.value = 0.9;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.2);

    hum.connect(humG).connect(g);
    noise.connect(bp).connect(g);
    g.connect(this.foleyGain);

    hum.start(t);
    noise.start(t);

    this.espressoNode = {
      gain: g,
      stop: () => {
        const now = ctx.currentTime;
        g.gain.setTargetAtTime(0.0001, now, 0.08);
        window.setTimeout(() => {
          try {
            hum.stop();
            noise.stop();
          } catch {
            // ignore
          }
        }, 260);
      },
    };
  }

  public stopEspressoPull(): void {
    if (this.espressoNode) {
      this.espressoNode.stop();
      this.espressoNode = null;
    }
  }

  public startSteam(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain || this.steamNode || !this.whiteBuffer) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.whiteBuffer;
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2100;
    bp.Q.value = 1.4;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.26, t + 0.08);

    src.connect(bp).connect(g).connect(this.foleyGain);
    src.start(t);

    this.steamNode = {
      gain: g,
      filter: bp,
      stop: () => {
        const now = ctx.currentTime;
        g.gain.setTargetAtTime(0.0001, now, 0.06);
        window.setTimeout(() => {
          try {
            src.stop();
          } catch {
            // ignore
          }
        }, 220);
      },
    };
  }

  public updateSteamTemp(tempC: number): void {
    if (!this.ctx || !this.steamNode) return;
    // Lower pitch as milk heats & creates silky microfoam!
    const norm = Math.max(0, Math.min(1, (tempC - 12) / 68));
    const targetFreq = 2200 - norm * 1550;
    this.steamNode.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.06);
  }

  public stopSteam(): void {
    if (this.steamNode) {
      this.steamNode.stop();
      this.steamNode = null;
    }
  }

  public startPour(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain || this.pourNode || !this.pinkBuffer) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.pinkBuffer;
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 460;
    bp.Q.value = 3.2;

    // Gentle glug wobble
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 7.5;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 90;
    lfo.connect(lfoG).connect(bp.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.24, t + 0.05);

    src.connect(bp).connect(g);
    g.connect(this.foleyGain);
    if (this.reverbNode) g.connect(this.reverbNode);

    src.start(t);
    lfo.start(t);

    this.pourNode = {
      gain: g,
      filter: bp,
      stop: () => {
        const now = ctx.currentTime;
        g.gain.setTargetAtTime(0.0001, now, 0.05);
        window.setTimeout(() => {
          try {
            src.stop();
            lfo.stop();
          } catch {
            // ignore
          }
        }, 200);
      },
    };
  }

  public updatePourLevel(fillRatio: number): void {
    if (!this.ctx || !this.pourNode) return;
    const targetFreq = 380 + Math.max(0, Math.min(1, fillRatio)) * 460;
    this.pourNode.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
  }

  public stopPour(): void {
    if (this.pourNode) {
      this.pourNode.stop();
      this.pourNode = null;
    }
  }

  public playIceDrop(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Crystal glass clink harmonics
    const base = 1950 + Math.random() * 450;
    [base, base * 1.41, base * 2.12].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.09 / (i + 1), t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22 - i * 0.04);
      osc.connect(g).connect(this.foleyGain!);
      if (this.reverbNode) g.connect(this.reverbNode);
      osc.start(t);
      osc.stop(t + 0.24);
    });

    // Tiny liquid splash plop
    const plop = ctx.createOscillator();
    const pg = ctx.createGain();
    plop.type = 'sine';
    plop.frequency.setValueAtTime(280, t + 0.015);
    plop.frequency.exponentialRampToValueAtTime(620, t + 0.075);
    pg.gain.setValueAtTime(0.001, t + 0.015);
    pg.gain.linearRampToValueAtTime(0.09, t + 0.025);
    pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    plop.connect(pg).connect(this.foleyGain);
    plop.start(t + 0.015);
    plop.stop(t + 0.1);
  }

  public playSyrupPump(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.11);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    osc.connect(g).connect(this.foleyGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playWhiskSwish(speed = 1): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain || !this.whiteBuffer) return;
    const nowMs = performance.now();
    if (nowMs - this.lastWhiskTime < 110) return;
    this.lastWhiskTime = nowMs;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.whiteBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(950 + Math.min(700, speed * 220), t);
    bp.Q.value = 1.8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

    src.connect(bp).connect(g).connect(this.foleyGain);
    src.start(t);
    src.stop(t + 0.12);
  }

  public playSprinkle(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain || !this.whiteBuffer) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const start = t + i * 0.055;
      const src = ctx.createBufferSource();
      src.buffer = this.whiteBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 3100 + i * 320;
      hp.Q.value = 2.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(0.075, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
      src.connect(hp).connect(g).connect(this.foleyGain);
      src.start(start);
      src.stop(start + 0.06);
    }
  }

  public playPageFlip(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain || !this.pinkBuffer) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.pinkBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.14);
    bp.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    src.connect(bp).connect(g).connect(this.foleyGain);
    src.start(t);
    src.stop(t + 0.2);
  }

  public playCeramicPlace(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(190, t + 0.06);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.13, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc.connect(g).connect(this.foleyGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playTipClink(count = 3): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain) return;
    const ctx = this.ctx;
    const baseTime = ctx.currentTime;
    const notes = [1567.98, 1975.53, 2349.32, 2637.02];
    for (let i = 0; i < count; i++) {
      const t = baseTime + i * 0.095;
      const freq = notes[i % notes.length];
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.085, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
      osc.connect(g).connect(this.foleyGain);
      if (this.reverbNode) g.connect(this.reverbNode);
      osc.start(t);
      osc.stop(t + 0.4);
    }
  }

  public playOrderBell(): void {
    this.initAndResume();
    if (!this.ctx || !this.foleyGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [880, 1318.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.09);
      g.gain.linearRampToValueAtTime(0.09, t + idx * 0.09 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.09 + 0.45);
      osc.connect(g).connect(this.foleyGain!);
      if (this.reverbNode) g.connect(this.reverbNode);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.48);
    });
  }
}

export const asmrEngine = new AsmrAudioEngine();

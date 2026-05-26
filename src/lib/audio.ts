/**
 * Patient Zero - Intensive Cybernetic Sound Engine
 * Synthesizes minimal, high-fidelity medical acoustics using Web Audio API.
 * Keeps interactions tactile, premium, and alive without external assets.
 */

class ICUSoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = false;
  private heartbeatInterval: number | null = null;

  constructor() {
    // Lazy initialisation to comply with browser autoplay restrictions
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.warn("Failed to initialize AudioContext", e);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public enable(on: boolean) {
    this.soundEnabled = on;
    if (on) {
      this.initCtx();
    } else {
      this.stopHeartbeat();
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Synthesizes a high-end, dampened UI click/snap.
   */
  public click() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1000, ctx.currentTime);

      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // safe fallback
    }
  }

  /**
   * Synthesizes an extremely satisfying, sparkling stabilization chime.
   * Ascending frequency triad with multi-layered oscillators.
   */
  public stabilizationChime() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Ascending sparkling C-Major)

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        // Slow build and decay of volume
        gain.gain.setValueAtTime(0.0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } catch (e) {
      // safe fallback
    }
  }

  /**
   * Synthesizes a traumatic defib charging raise tone.
   */
  public charge() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(980, ctx.currentTime + 0.9);

      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

      osc.start();
      osc.stop(ctx.currentTime + 0.92);
    } catch (e) {
      // safe fallback
    }
  }

  /**
   * Synthesizes a flatlining alarm tone or error click.
   */
  public flatlineAlert() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (e) {
      // safe fallback
    }
  }

  /**
   * Low-frequency tactical medical heartbeat loop (systole / diastole thump-thump).
   * Generates a quiet, warm, non-annoying bass beat matching current patient conditions.
   */
  public startHeartbeat(bpm: number = 72) {
    if (!this.soundEnabled) return;
    this.stopHeartbeat();

    const interval = (60 / bpm) * 1000;

    const playThump = () => {
      const ctx = this.initCtx();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;

        // First Thump (lub) - low frequency
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(55, now);
        osc1.frequency.exponentialRampToValueAtTime(20, now + 0.12);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.start(now);
        osc1.stop(now + 0.13);

        // Second Thump (dub) - slightly higher frequency, 120ms later
        const delay = 0.13;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(58, now + delay);
        osc2.frequency.exponentialRampToValueAtTime(22, now + delay + 0.15);
        gain2.gain.setValueAtTime(0.12, now + delay);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
        osc2.start(now + delay);
        osc2.stop(now + delay + 0.16);

      } catch (err) {
        // safe fallback
      }
    };

    // run periodically
    playThump();
    this.heartbeatInterval = window.setInterval(playThump, interval);
  }

  public stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const sound = new ICUSoundEngine();

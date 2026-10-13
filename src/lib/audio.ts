/**
 * Patient Zero - Intensive Cybernetic Sound Engine
 * Synthesizes minimal, high-fidelity medical acoustics using Web Audio API.
 * Keeps interactions tactile, premium, and alive without external assets.
 */

class ICUSoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
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

      gain.gain.setValueAtTime(0.002, ctx.currentTime); // Lower volume
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

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
        gain.gain.linearRampToValueAtTime(0.015, now + idx * 0.08 + 0.03); // Lower volume
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
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2); // Lower volume
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

      osc.start();
      osc.stop(ctx.currentTime + 0.92);
    } catch (e) {
      // safe fallback
    }
  }

  /**
   * Synthesizes a gentle, warm cognitive insight chime for learning pivots.
   * Grounded in supportive feedback design: no alarming sawtooth buzzes.
   */
  public gentleInsight() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Warm pure sine tone with soft decay (320Hz gentle acoustic chime)
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.28);

      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

      osc.start();
      osc.stop(ctx.currentTime + 0.29);
    } catch (e) {
      // safe fallback
    }
  }

  /**
   * Backward-compatible alias for non-alarming feedback
   */
  public flatlineAlert() {
    this.gentleInsight();
  }

  /**
   * Warm acoustic restorative chime for protocol stage transitions and milestones.
   * Produces a peaceful, resonant dual-sine singing bowl overtone.
   */
  public playRestorativeChime(type: 'phase' | 'bell' | 'complete' | 'topup' = 'phase') {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (type === 'bell' || type === 'phase') {
        // Dual harmonic singing bowl (528 Hz Love/DNA frequency + 792 Hz gentle 5th overtone)
        const fundamental = type === 'phase' ? 528 : 432;
        const overtone = fundamental * 1.5;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(fundamental, now);
        osc2.frequency.setValueAtTime(overtone, now);

        gain1.gain.setValueAtTime(0.001, now);
        gain1.gain.linearRampToValueAtTime(0.022, now + 0.08);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.linearRampToValueAtTime(0.009, now + 0.06);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(ctx.destination);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.85);
        osc2.stop(now + 1.25);
      } else if (type === 'complete') {
        // Tri-tone restorative resolution chord (A major calm resolution: 440, 554.37, 659.25)
        const freqs = [440, 554.37, 659.25];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          const startTime = now + idx * 0.12;
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.02, startTime + 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 2.25);
        });
      }
    } catch {
      // safe fallback
    }
  }

  /**
   * Ultra-soft respiratory guidance tone for closed-eye breathing pacing
   */
  public playBreathingCue(phase: 'inhale' | 'topup' | 'exhale') {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (phase === 'inhale') {
        // Gentle ascending breath sine (220Hz -> 330Hz)
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.45);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.015, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.52);
      } else if (phase === 'topup') {
        // Quick subtle higher bell chirp (480Hz)
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(528, now + 0.15);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.018, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Gentle descending release tone (330Hz -> 196Hz)
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(196, now + 0.65);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.014, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.72);
      }
    } catch {
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
        gain1.gain.setValueAtTime(0.04, now); // subtly lower volume
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
        gain2.gain.setValueAtTime(0.04, now + delay); // subtly lower volume
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

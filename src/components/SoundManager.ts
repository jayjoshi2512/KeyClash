export type SwitchType = "creamy" | "clicky" | "retro" | "brown" | "silent";

class SoundManager {
  private ctx: AudioContext | null = null;
  private volume: number = 0.5; // 0 to 1
  private isMuted: boolean = false;
  private activeSwitch: SwitchType = "creamy";

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (!mute) {
      this.initCtx();
    }
  }

  setSwitchType(type: SwitchType) {
    this.activeSwitch = type;
    this.initCtx();
  }

  playKey(key: string, isKeyUp: boolean = false) {
    if (this.isMuted || typeof window === "undefined") return;
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    // Volume scaling
    const volScale = isKeyUp ? this.volume * 0.4 : this.volume;

    // Determine key characteristics
    const isSpace = key === " " || key === "Spacebar";
    const isBackspace = key === "Backspace";
    const isEnter = key === "Enter";

    // Random pitch variance (+/- 7%)
    const pitchOffset = 0.93 + Math.random() * 0.14;

    // Setup master gain node
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, time);
    masterGain.gain.linearRampToValueAtTime(volScale * 0.4, time + 0.001);
    masterGain.connect(this.ctx.destination);

    switch (this.activeSwitch) {
      case "creamy":
        this.synthesizeCreamy(time, masterGain, isSpace, isBackspace, isEnter, isKeyUp, pitchOffset);
        break;
      case "clicky":
        this.synthesizeClicky(time, masterGain, isSpace, isBackspace, isEnter, isKeyUp, pitchOffset);
        break;
      case "retro":
        this.synthesizeRetro(time, masterGain, isSpace, isBackspace, isEnter, isKeyUp, pitchOffset);
        break;
      case "brown":
        this.synthesizeBrown(time, masterGain, isSpace, isBackspace, isEnter, isKeyUp, pitchOffset);
        break;
      case "silent":
        this.synthesizeSilent(time, masterGain, isSpace, isBackspace, isEnter, isKeyUp, pitchOffset);
        break;
    }
  }

  // Creamy: POM linear switches with heavy lube, deep thock/pop sound
  private synthesizeCreamy(
    time: number,
    gainNode: GainNode,
    isSpace: boolean,
    isBackspace: boolean,
    isEnter: boolean,
    isKeyUp: boolean,
    pitchOffset: number
  ) {
    if (!this.ctx) return;

    // Base frequencies
    let baseFreq = 160 * pitchOffset;
    let clickFreq = 800 * pitchOffset;
    let decayTime = isKeyUp ? 0.015 : 0.025;
    let noiseCutoff = 220;

    if (isSpace) {
      baseFreq = 85 * pitchOffset;
      clickFreq = 400 * pitchOffset;
      decayTime = isKeyUp ? 0.025 : 0.045;
      noiseCutoff = 130;
    } else if (isBackspace) {
      baseFreq = 180 * pitchOffset;
      clickFreq = 900 * pitchOffset;
      decayTime = isKeyUp ? 0.012 : 0.022;
      noiseCutoff = 250;
    } else if (isEnter) {
      baseFreq = 130 * pitchOffset;
      clickFreq = 600 * pitchOffset;
      decayTime = isKeyUp ? 0.020 : 0.035;
      noiseCutoff = 180;
    }

    // 1. Sine wave component for the deep "pop"
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + decayTime);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.8, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(oscGain);
    oscGain.connect(gainNode);

    // 2. Band-pass filtered noise for the keyboard body thud
    const noise = this.createNoiseNode();
    if (noise) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(noiseCutoff, time);
      filter.Q.setValueAtTime(4.0, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(isKeyUp ? 0.4 : 0.9, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime * 0.8);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(gainNode);

      noise.start(time);
      noise.stop(time + decayTime + 0.01);
    }

    // 3. Subtle click element for keydown only
    if (!isKeyUp) {
      const clickOsc = this.ctx.createOscillator();
      clickOsc.type = "sine";
      clickOsc.frequency.setValueAtTime(clickFreq, time);
      clickOsc.frequency.exponentialRampToValueAtTime(clickFreq * 0.2, time + 0.004);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.3, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.004);

      clickOsc.connect(clickGain);
      clickGain.connect(gainNode);
      clickOsc.start(time);
      clickOsc.stop(time + 0.005);
    }

    osc.start(time);
    osc.stop(time + decayTime + 0.01);

    // Final clean cleanup of gain node
    gainNode.gain.setValueAtTime(gainNode.gain.value, time + decayTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + decayTime + 0.005);
  }

  // Clicky: Sharp crisp click jacket snap + lightweight clack
  private synthesizeClicky(
    time: number,
    gainNode: GainNode,
    isSpace: boolean,
    isBackspace: boolean,
    isEnter: boolean,
    isKeyUp: boolean,
    pitchOffset: number
  ) {
    if (!this.ctx) return;

    let baseFreq = 800 * pitchOffset;
    let clickFreq = 4800 * pitchOffset;
    let clackDecay = isKeyUp ? 0.012 : 0.020;
    let clickDecay = 0.004;

    if (isSpace) {
      baseFreq = 400 * pitchOffset;
      clickFreq = 2800 * pitchOffset;
      clackDecay = isKeyUp ? 0.020 : 0.035;
    } else if (isBackspace) {
      baseFreq = 850 * pitchOffset;
      clickFreq = 5000 * pitchOffset;
    }

    // 1. Click snap (High frequency noise burst) - Only on keydown (since click jacket clicks on down)
    if (!isKeyUp) {
      const clickNoise = this.createNoiseNode();
      if (clickNoise) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(clickFreq, time);

        const clickGain = this.ctx.createGain();
        clickGain.gain.setValueAtTime(1.5, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

        clickNoise.connect(filter);
        filter.connect(clickGain);
        clickGain.connect(gainNode);

        clickNoise.start(time);
        clickNoise.stop(time + clickDecay + 0.01);
      }
    }

    // 2. Housing clack sound (Mid frequency bandpass noise)
    const clackNoise = this.createNoiseNode();
    if (clackNoise) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(baseFreq, time);
      filter.Q.setValueAtTime(1.5, time);

      const clackGain = this.ctx.createGain();
      clackGain.gain.setValueAtTime(isKeyUp ? 0.4 : 0.6, time);
      clackGain.gain.exponentialRampToValueAtTime(0.001, time + clackDecay);

      clackNoise.connect(filter);
      filter.connect(clackGain);
      clackGain.connect(gainNode);

      clackNoise.start(time);
      clackNoise.stop(time + clackDecay + 0.01);
    }

    // 3. Quick pluck sine wave
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq * 0.8, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, time + clackDecay);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.2, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + clackDecay);

    osc.connect(oscGain);
    oscGain.connect(gainNode);
    osc.start(time);
    osc.stop(time + clackDecay + 0.01);

    gainNode.gain.setValueAtTime(gainNode.gain.value, time + clackDecay);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + clackDecay + 0.005);
  }

  // Retro: Crunchy buckle spring clack + distinct metallic ping ring
  private synthesizeRetro(
    time: number,
    gainNode: GainNode,
    isSpace: boolean,
    isBackspace: boolean,
    isEnter: boolean,
    isKeyUp: boolean,
    pitchOffset: number
  ) {
    if (!this.ctx) return;

    let clackFreq = 650 * pitchOffset;
    let pingFreq1 = 1800 * pitchOffset;
    let pingFreq2 = 2400 * pitchOffset;
    let decayTime = isKeyUp ? 0.020 : 0.040;

    if (isSpace) {
      clackFreq = 350 * pitchOffset;
      pingFreq1 = 1100 * pitchOffset;
      pingFreq2 = 1500 * pitchOffset;
      decayTime = isKeyUp ? 0.035 : 0.060;
    }

    // 1. Spring Ping (Metallic ringing sine oscillators with longer decay)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(pingFreq1, time);
    osc2.frequency.setValueAtTime(pingFreq2, time);

    const pingGain = this.ctx.createGain();
    pingGain.gain.setValueAtTime(isKeyUp ? 0.05 : 0.15, time);
    pingGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime * 1.5);

    osc1.connect(pingGain);
    osc2.connect(pingGain);
    pingGain.connect(gainNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + decayTime * 1.5 + 0.01);
    osc2.stop(time + decayTime * 1.5 + 0.01);

    // 2. Crunchy mechanical housing sound (Bandpass noise)
    const noise = this.createNoiseNode();
    if (noise) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(clackFreq, time);
      filter.Q.setValueAtTime(2.0, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(isKeyUp ? 0.5 : 1.0, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(gainNode);

      noise.start(time);
      noise.stop(time + decayTime + 0.01);
    }

    gainNode.gain.setValueAtTime(gainNode.gain.value, time + decayTime * 1.5);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + decayTime * 1.5 + 0.005);
  }

  // Brown: Soft tactile clack, rounded feel, no click
  private synthesizeBrown(
    time: number,
    gainNode: GainNode,
    isSpace: boolean,
    isBackspace: boolean,
    isEnter: boolean,
    isKeyUp: boolean,
    pitchOffset: number
  ) {
    if (!this.ctx) return;

    let baseFreq = 280 * pitchOffset;
    let noiseCutoff = 450 * pitchOffset;
    let decayTime = isKeyUp ? 0.015 : 0.022;

    if (isSpace) {
      baseFreq = 160 * pitchOffset;
      noiseCutoff = 280 * pitchOffset;
      decayTime = isKeyUp ? 0.025 : 0.038;
    }

    // 1. Soft body clack noise
    const noise = this.createNoiseNode();
    if (noise) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(noiseCutoff, time);
      filter.Q.setValueAtTime(1.8, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(isKeyUp ? 0.3 : 0.7, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(gainNode);

      noise.start(time);
      noise.stop(time + decayTime + 0.01);
    }

    // 2. Triangle wave for the mechanical contact
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq * 1.2, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + decayTime);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(oscGain);
    oscGain.connect(gainNode);

    osc.start(time);
    osc.stop(time + decayTime + 0.01);

    gainNode.gain.setValueAtTime(gainNode.gain.value, time + decayTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + decayTime + 0.005);
  }

  // Silent: Heavily dampened switch, very quiet low-frequency thud
  private synthesizeSilent(
    time: number,
    gainNode: GainNode,
    isSpace: boolean,
    isBackspace: boolean,
    isEnter: boolean,
    isKeyUp: boolean,
    pitchOffset: number
  ) {
    if (!this.ctx) return;

    let baseFreq = 120 * pitchOffset;
    let noiseCutoff = 150 * pitchOffset;
    let decayTime = isKeyUp ? 0.012 : 0.018;

    if (isSpace) {
      baseFreq = 75 * pitchOffset;
      noiseCutoff = 100 * pitchOffset;
      decayTime = isKeyUp ? 0.018 : 0.028;
    }

    // Highly dampened noise (lowpass filtered, fast decay, quiet)
    const noise = this.createNoiseNode();
    if (noise) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(noiseCutoff, time);

      const noiseGain = this.ctx.createGain();
      // Silent switches are very quiet, scale volume way down
      noiseGain.gain.setValueAtTime(isKeyUp ? 0.1 : 0.25, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(gainNode);

      noise.start(time);
      noise.stop(time + decayTime + 0.01);
    }

    // Bass sine wave for solid housing bottoming-out thud
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, time + decayTime);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(oscGain);
    oscGain.connect(gainNode);

    osc.start(time);
    osc.stop(time + decayTime + 0.01);

    gainNode.gain.setValueAtTime(gainNode.gain.value, time + decayTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + decayTime + 0.005);
  }

  // Helper to generate a white noise buffer
  private createNoiseNode(): AudioBufferSourceNode | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds of noise is plenty
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }
}

// Export single instance for global usage across components
export const soundManager = new SoundManager();

import { EngineProfile } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private oscSaw: OscillatorNode | null = null;
  private oscTri: OscillatorNode | null = null;
  private oscWhine: OscillatorNode | null = null;
  private noiseSrc: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;
  
  // Starter
  private starterOsc: OscillatorNode | null = null;
  private starterGain: GainNode | null = null;

  private gainMain: GainNode | null = null;
  private gainNoise: GainNode | null = null;
  private gainWhine: GainNode | null = null;
  private lfoGain: GainNode | null = null;
  private limiterGain: GainNode | null = null;

  private filterMain: BiquadFilterNode | null = null;
  private filterNoise: BiquadFilterNode | null = null;
  private distortion: WaveShaperNode | null = null;

  private isInitialized = false;

  constructor() {}

  public init() {
    if (this.isInitialized) return;
    
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.oscSaw = this.ctx.createOscillator();
      this.oscTri = this.ctx.createOscillator();
      this.oscWhine = this.ctx.createOscillator();
      this.lfo = this.ctx.createOscillator();
      this.starterOsc = this.ctx.createOscillator();

      this.oscSaw.type = "sawtooth";
      this.oscTri.type = "triangle";
      this.oscWhine.type = "sine";
      this.lfo.type = "sine";
      this.starterOsc.type = "square";

      this.gainMain = this.ctx.createGain();
      this.gainNoise = this.ctx.createGain();
      this.gainWhine = this.ctx.createGain();
      this.lfoGain = this.ctx.createGain();
      this.limiterGain = this.ctx.createGain();
      this.starterGain = this.ctx.createGain();

      this.filterMain = this.ctx.createBiquadFilter();
      this.filterNoise = this.ctx.createBiquadFilter();
      this.distortion = this.ctx.createWaveShaper();

      this.distortion.curve = this.makeDistortionCurve(80);
      this.distortion.oversample = '4x';

      const sum = this.ctx.createGain();
      sum.gain.value = 1.0;
      
      this.oscSaw.connect(sum);
      this.oscTri.connect(sum);
      
      this.filterMain.type = "lowpass";
      sum.connect(this.filterMain);
      this.filterMain.connect(this.distortion);
      this.distortion.connect(this.limiterGain);
      this.limiterGain.connect(this.gainMain);
      this.gainMain.connect(this.ctx.destination);

      this.filterNoise.type = "bandpass";
      const noiseBuffer = this.createNoiseBuffer(this.ctx, 2);
      this.noiseSrc = this.ctx.createBufferSource();
      this.noiseSrc.buffer = noiseBuffer;
      this.noiseSrc.loop = true;
      this.noiseSrc.connect(this.filterNoise);
      this.filterNoise.connect(this.gainNoise);
      this.gainNoise.connect(this.ctx.destination);

      this.oscWhine.connect(this.gainWhine);
      this.gainWhine.connect(this.ctx.destination);

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.gainMain.gain);
      
      // Starter Chain
      this.starterOsc.connect(this.starterGain);
      this.starterGain.connect(this.ctx.destination);

      // Defaults
      this.gainMain.gain.value = 0;
      this.gainNoise.gain.value = 0;
      this.gainWhine.gain.value = 0;
      this.starterGain.gain.value = 0;
      this.limiterGain.gain.value = 1;

      this.oscSaw.start();
      this.oscTri.start();
      this.oscWhine.start();
      this.lfo.start();
      this.starterOsc.start();
      this.noiseSrc.start();

      this.isInitialized = true;
    } catch (e) {
      console.error("Audio init failed", e);
    }
  }

  public resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public triggerShiftThud() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      
      osc.start(t);
      osc.stop(t + 0.2);
  }

  public triggerBackfire() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Noise burst
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseSrc!.buffer;
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    filter.type = "lowpass";
    filter.frequency.value = 800;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    noise.start(t);
    noise.stop(t + 0.1);
  }

  public triggerTurboFlutter() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = "triangle";
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2000, t);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.frequency.setValueAtTime(80, t); // Flutter speed
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.4);
      
      osc.start(t);
      osc.stop(t + 0.4);
  }

  public update(rpm: number, throttle: number, engine: EngineProfile, load: number, isLimiter: boolean, cranking: boolean, engineOn: boolean) {
    if (!this.ctx || !this.isInitialized) return;
    
    const t = this.ctx.currentTime;
    
    // Starter Sound
    if (cranking && !engineOn) {
        this.starterGain!.gain.setTargetAtTime(0.3, t, 0.1);
        this.starterOsc!.frequency.setValueAtTime(150 + (Math.sin(t * 20) * 50), t); // Cranking wobble
        this.gainMain!.gain.setTargetAtTime(0, t, 0.1);
    } else {
        this.starterGain!.gain.setTargetAtTime(0, t, 0.1);
    }

    if (!engineOn && !cranking) {
        this.gainMain!.gain.setTargetAtTime(0, t, 0.2);
        this.gainNoise!.gain.setTargetAtTime(0, t, 0.2);
        this.gainWhine!.gain.setTargetAtTime(0, t, 0.2);
        return;
    }

    if (engineOn) {
        const prof = engine.soundProfile;
        const rpmN = Math.max(0, Math.min(1, (rpm - engine.idleRpm) / (engine.redlineRpm - engine.idleRpm)));

        const cylFactor = Math.max(0.5, prof.cylinders / 8);
        const baseHz = (45 + rpmN * 220) * cylFactor;
        
        this.oscSaw!.frequency.setTargetAtTime(baseHz, t, 0.02);
        this.oscTri!.frequency.setTargetAtTime(baseHz * 0.5, t, 0.02);

        // Limiter
        if (isLimiter) {
            this.limiterGain!.gain.setValueAtTime(Math.random() > 0.5 ? 0.0 : 1.0, t);
        } else {
            this.limiterGain!.gain.setTargetAtTime(1.0, t, 0.05);
        }

        // Main Vol
        let vol = 0.1 + throttle * 0.3 + rpmN * 0.15;
        if (prof.type === 'v8') vol *= 1.2;
        vol = Math.min(vol, 0.6);
        
        const idleZone = Math.max(0, 1 - rpmN * 4);
        const lopAmt = prof.idleLop * idleZone * (0.6 + 0.4 * (1 - throttle));
        
        this.lfo!.frequency.setTargetAtTime(4 + rpmN * 6, t, 0.1);
        this.lfoGain!.gain.setTargetAtTime(lopAmt, t, 0.05);
        this.gainMain!.gain.setTargetAtTime(Math.max(0.01, vol), t, 0.05);

        // Filter
        let cutoff = 350 + throttle * 3000 + rpmN * 2500;
        if (prof.type === 'v8') cutoff *= 0.6; 
        
        this.filterMain!.frequency.setTargetAtTime(cutoff, t, 0.05);
        this.filterMain!.Q.value = 1.0;

        // Turbo/Noise
        const turboN = rpmN * 0.5 + throttle * 0.5;
        const noiseFreq = prof.type === 'diesel' ? 1000 + turboN * 3000 : 1500 + turboN * 2500;
        const noiseGain = (prof.whistle * 0.2) * turboN + 0.005;
        
        this.filterNoise!.frequency.setTargetAtTime(noiseFreq, t, 0.1);
        this.filterNoise!.Q.value = 2 + turboN * 4;
        this.gainNoise!.gain.setTargetAtTime(Math.min(noiseGain, 0.15), t, 0.05);

        // Supercharger/Turbo Whine
        const whineHz = 400 + turboN * 1800;
        const whineGain = prof.whistle * (0.02 + turboN * 0.15);
        this.oscWhine!.frequency.setTargetAtTime(whineHz, t, 0.05);
        this.gainWhine!.gain.setTargetAtTime(Math.min(whineGain, 0.15), t, 0.05);
    }
  }

  private makeDistortionCurve(amount: number) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = rate * seconds;
    const buffer = ctx.createBuffer(1, len, rate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + 0.01 * white;
      data[i] = b0 * 3.5; 
    }
    return buffer;
  }
}

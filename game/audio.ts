import type { Place } from "./story";

export const AUDIO_KEY = "felice-elias.audio.v1";
export type AudioPolicy = { started: boolean; paused: boolean; hidden: boolean; landscape: boolean; transitioning: boolean };
export function audioAllowed(state: AudioPolicy) { return state.started && !state.paused && !state.hidden && state.landscape && !state.transitioning; }
export function parseMuted(raw: string | null) {
  try { const value: unknown = JSON.parse(raw ?? "null"); return !!value && typeof value === "object" && "version" in value && value.version === 1 && "muted" in value && value.muted === true; }
  catch { return false; }
}

type Effect = "step" | "interact" | "shot" | "complete";
type StoragePort = Pick<Storage, "getItem" | "setItem">;

export class WorldAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: AudioBufferSourceNode | null = null;
  private muted = false;
  private enabled = false;
  private place: Place = "bedroom";
  private mood: "world" | "evening" | "love" = "world";
  private listeners = new Set<() => void>();
  private lastStep = -Infinity;
  private effects = new Set<AudioScheduledSourceNode>();
  private storage: StoragePort | null = null;
  private factory: () => AudioContext;
  constructor(factory = () => {
    const ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    return new ctor();
  }) { this.factory = factory; }

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getMuted = () => this.muted;
  load(storage: StoragePort) {
    this.storage = storage;
    try { this.muted = parseMuted(storage.getItem(AUDIO_KEY)); } catch { /* Browser storage is optional. */ }
    this.listeners.forEach(listener => listener());
  }
  async unlock() {
    try {
      if (!this.context) {
        this.context = this.factory(); this.master = this.context.createGain();
        this.master.gain.value = .18; this.master.connect(this.context.destination);
      }
      await this.context.resume();
      this.sync();
    } catch { /* Unsupported or blocked audio must never interrupt gameplay. */ }
  }
  toggleMuted() {
    this.muted = !this.muted;
    try { this.storage?.setItem(AUDIO_KEY, JSON.stringify({ version: 1, muted: this.muted })); } catch { /* Retain the preference in this session. */ }
    this.listeners.forEach(listener => listener());
    this.sync();
    if (!this.muted) void this.unlock();
  }
  setScene(place: Place, enabled: boolean) {
    if (this.place !== place) this.stopAmbience();
    this.place = place; this.enabled = enabled; this.sync();
  }
  setMood(mood: "world" | "evening" | "love") {
    if (this.mood === mood) return;
    this.mood = mood; this.stopAmbience(); this.sync();
  }
  private stopAmbience() { if (this.ambience) { try { this.ambience.stop(); } catch { /* Already stopped. */ } this.ambience.disconnect(); this.ambience = null; } }
  private sync() {
    if (!this.context || !this.master) return;
    const canPlay = this.enabled && !this.muted;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setValueAtTime(canPlay ? .18 : 0, this.context.currentTime);
    if (!canPlay) {
      this.stopAmbience();
      for (const source of this.effects) { try { source.stop(); } catch { /* Already stopped. */ } }
      this.effects.clear();
      return;
    }
    if (this.ambience) return;
    const outside = ["garden","bus","school","schoolway","radegast","zoerbig","goelzau"].includes(this.place);
    const music = !outside && this.mood !== "world";
    const buffer = this.context.createBuffer(1, this.context.sampleRate * (music ? 16 : 4), this.context.sampleRate);
    const samples = buffer.getChannelData(0);
    let smooth = 0;
    const melody = this.mood === "love" ? [261.63,329.63,392,329.63,293.66,349.23,392,523.25] : [220,261.63,329.63,261.63,196,246.94,293.66,246.94];
    for (let i=0;i<samples.length;i++) {
      const time = i / this.context.sampleRate;
      smooth = (smooth + (Math.random()*2-1)*.035)/1.035;
      samples[i] = smooth * (outside ? .12 : .025) * (.75 + .25 * Math.sin(time * Math.PI / 2));
      if (music) samples[i] += Math.sin(time * Math.PI * 2 * melody[Math.floor(time / 2) % 8]) * .07 * Math.sin(time % 2 * Math.PI / 2) ** 2;
    }
    const source = this.context.createBufferSource(); source.buffer = buffer; source.loop = true;
    const filter = this.context.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = outside ? 900 : 250;
    source.connect(filter); filter.connect(this.master); source.onended = () => filter.disconnect(); source.start(); this.ambience = source;
  }
  play(effect: Effect, now = performance.now()) {
    const ctx = this.context, master = this.master;
    if (!ctx || !master || !this.enabled || this.muted || ctx.state !== "running") return;
    if (effect === "step" && now - this.lastStep < 290) return;
    if (effect === "step") this.lastStep = now;
    try {
      const length = effect === "complete" ? .35 : effect === "shot" ? .14 : .09;
      const envelope = ctx.createGain(); envelope.connect(master);
      envelope.gain.setValueAtTime(effect === "shot" ? .35 : .12, ctx.currentTime);
      envelope.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + length);
      let source: AudioScheduledSourceNode;
      if (effect === "step" || effect === "shot") {
        const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate*length), ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1)*Math.exp(-i/data.length*8);
        const noise = ctx.createBufferSource(); noise.buffer = buffer;
        const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = effect === "shot" ? 1800 : ["garden","bus","school","radegast","zoerbig","schoolway","goelzau"].includes(this.place) ? 900 : 450;
        noise.connect(filter); filter.connect(envelope); source = noise;
        noise.onended = () => { this.effects.delete(noise); filter.disconnect(); envelope.disconnect(); };
      } else {
        const tone = ctx.createOscillator(); tone.type = "sine"; tone.frequency.setValueAtTime(effect === "complete" ? 660 : 440, ctx.currentTime); tone.frequency.exponentialRampToValueAtTime(effect === "complete" ? 880 : 330, ctx.currentTime+length); tone.connect(envelope); source = tone;
        tone.onended = () => { this.effects.delete(tone); envelope.disconnect(); };
      }
      this.effects.add(source); source.start(); source.stop(ctx.currentTime+length);
    } catch { /* Graceful fallback to silent gameplay. */ }
  }
  stop() { this.enabled = false; this.sync(); }
}

export const worldAudio = new WorldAudio();

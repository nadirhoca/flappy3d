// Generative Audio System
// We create music procedurally to avoid external asset dependencies and allow dynamic shifting

class AudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  
  // Music State
  currentInterval: number | null = null;
  isPlaying = false;
  isMuted = false;
  currentMode: 'AMBIENT' | 'MELODIC' | 'INTENSE' = 'AMBIENT';

  constructor() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.5;

      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.musicGain.gain.value = 0.4;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.sfxGain.gain.value = 0.6;
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx!.currentTime, 0.1);
    }
  }

  // --- SFX ---

  playJump() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.start();
    osc.stop(t + 0.1);
  }

  playScore() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, t);
    osc.frequency.setValueAtTime(1500, t + 0.05);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
    
    osc.start();
    osc.stop(t + 0.1);
  }

  playCrash() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.start();
    osc.stop(t + 0.3);
  }

  // --- Music Engine ---

  setMusicMode(mode: 'AMBIENT' | 'MELODIC' | 'INTENSE') {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    // Restart loop with new timing/logic immediately
    this.stopMusic();
    this.startMusic();
  }

  startMusic() {
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    this.resume();
    
    const scheduleNextNote = () => {
      if (!this.isPlaying) return;
      
      const tempo = this.currentMode === 'INTENSE' ? 150 : (this.currentMode === 'MELODIC' ? 300 : 800);
      
      if (this.currentMode === 'AMBIENT') {
        this.playAmbientDrone();
      } else if (this.currentMode === 'MELODIC') {
        this.playMelodicNote();
      } else if (this.currentMode === 'INTENSE') {
        this.playIntenseBeat();
      }

      this.currentInterval = window.setTimeout(scheduleNextNote, tempo);
    };

    scheduleNextNote();
  }

  stopMusic() {
    this.isPlaying = false;
    if (this.currentInterval) {
      clearTimeout(this.currentInterval);
      this.currentInterval = null;
    }
  }

  // Generators

  private playAmbientDrone() {
    // Moon: Long, swelling sine waves, pentatonic scale
    const notes = [196.00, 220.00, 261.63, 293.66, 329.63]; // G3, A3, C4, D4, E4
    const note = notes[Math.floor(Math.random() * notes.length)];
    const t = this.ctx!.currentTime;
    
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.connect(gain);
    gain.connect(this.musicGain!);
    
    osc.type = 'sine';
    osc.frequency.value = note;
    
    // Long Attack, Long Release
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 1);
    gain.gain.linearRampToValueAtTime(0, t + 4);
    
    osc.start(t);
    osc.stop(t + 4);
  }

  private playMelodicNote() {
    // Earth: Happy Major Arpeggios
    const notes = [261.63, 329.63, 392.00, 523.25]; // C Major
    const note = notes[Math.floor(Math.random() * notes.length)];
    const t = this.ctx!.currentTime;

    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.connect(gain);
    gain.connect(this.musicGain!);

    osc.type = 'triangle';
    osc.frequency.value = note;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  private playIntenseBeat() {
    // Jupiter: Fast, distorted bass
    const notes = [55.00, 58.27, 61.74]; // Low A, A#, B
    const note = notes[Math.floor(Math.random() * notes.length)];
    const t = this.ctx!.currentTime;

    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.connect(gain);
    gain.connect(this.musicGain!);

    osc.type = 'sawtooth';
    osc.frequency.value = note;

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.2);
  }
}

export const audioManager = new AudioEngine();
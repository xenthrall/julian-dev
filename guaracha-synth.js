/**
 * GUARACHA SYNTH ENGINE v4.2 // PÁRAMO-CORE
 * Generador procedural de ritmos de guaracha electrónica (132 BPM)
 * y síntesis de sonido de frontera para Julián Pérez.
 * Desarrollado con pura Web Audio API. 100% Offline, Cero dependencias.
 */

class GuarachaEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.bpm = 132;
    this.distortionAmount = 0.5;
    this.currentStep = 0;
    this.loopTimer = null;
    this.analyser = null;
    this.dataArray = null;

    // Callbacks for UI updates
    this.onStepCallback = null;
    this.onVisualizerData = null;
    this.onStatusChange = null;

    // Melody pattern for the iconic Guaracha synth lead (MIDI note pitches)
    // Tribal bouncy scale in A minor / Phrygian
    this.synthPattern = [
      { step: 0, note: 440 },  // A4
      { step: 2, note: 523 },  // C5
      { step: 4, note: 587 },  // D5
      { step: 6, note: 659 },  // E5
      { step: 7, note: 587 },  // D5
      { step: 8, note: 523 },  // C5
      { step: 10, note: 440 }, // A4
      { step: 12, note: 392 }, // G4
      { step: 14, note: 440 }, // A4
    ];

    // Tribal zapateo percussion steps
    this.tomPattern = [2, 6, 7, 10, 14, 15];
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      // Master Analyser Node
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.connect(this.audioCtx.destination);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // --- INDIVIDUAL INSTRUMENT SYNTHESIS ---

  // 1. Kick Guaracha (Punchy, 45Hz sub-drop, high click transient)
  playKick(time = 0) {
    this.initAudio();
    const t = time || this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    // Pitch envelope: fast drop from 160Hz to 45Hz
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    // Gain envelope: hard punch with punchy decay
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.analyser);

    osc.start(t);
    osc.stop(t + 0.35);

    // Click transient for guaracha attack
    const click = this.audioCtx.createOscillator();
    const clickGain = this.audioCtx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(600, t);
    click.frequency.exponentialRampToValueAtTime(80, t + 0.02);

    clickGain.gain.setValueAtTime(0.6, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    click.connect(clickGain);
    clickGain.connect(this.analyser);

    click.start(t);
    click.stop(t + 0.03);
  }

  // 2. Tribal Tom / Zapateo (Distinctive Colombian Guaracha syncopated percussive knock)
  playTribalTom(pitch = 220, time = 0) {
    this.initAudio();
    const t = time || this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.45, t + 0.15);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.analyser);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // 3. Cyber Synth Lead (Sharp FM synthesis tribal melody pluck)
  playSynthLead(frequency = 440, time = 0) {
    this.initAudio();
    const t = time || this.audioCtx.currentTime;

    // Carrier Oscillator
    const carrier = this.audioCtx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(frequency, t);

    // Modulator for cyber grit
    const modulator = this.audioCtx.createOscillator();
    modulator.type = 'square';
    modulator.frequency.setValueAtTime(frequency * 2, t);

    const modGain = this.audioCtx.createGain();
    modGain.gain.setValueAtTime(frequency * this.distortionAmount * 1.5, t);

    modulator.connect(carrier.frequency);

    // Filter
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.25);
    filter.Q.value = 4.0;

    // Amplitude Gain Envelope
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    carrier.connect(filter);
    filter.connect(gain);
    gain.connect(this.analyser);

    modulator.start(t);
    carrier.start(t);

    modulator.stop(t + 0.3);
    carrier.stop(t + 0.3);
  }

  // 4. Cyber Riser / Tension Buildup
  playRiser(time = 0) {
    this.initAudio();
    const t = time || this.audioCtx.currentTime;
    const duration = 2.0;

    // Noise Generator
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(8000, t + duration);
    filter.Q.value = 5.0;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.5, t + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration + 0.1);

    // Ascending tonal sweep
    const sweep = this.audioCtx.createOscillator();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(150, t);
    sweep.frequency.exponentialRampToValueAtTime(1200, t + duration);

    const sweepGain = this.audioCtx.createGain();
    sweepGain.gain.setValueAtTime(0.05, t);
    sweepGain.gain.linearRampToValueAtTime(0.3, t + duration);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + duration + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.analyser);

    sweep.connect(sweepGain);
    sweepGain.connect(this.analyser);

    noise.start(t);
    sweep.start(t);
    noise.stop(t + duration + 0.15);
    sweep.stop(t + duration + 0.15);
  }

  // 5. Zapateo Roll
  playZapateo(time = 0) {
    this.initAudio();
    const t = time || this.audioCtx.currentTime;
    // Play a burst of 3 rapid tribal hits
    this.playTribalTom(280, t);
    this.playTribalTom(320, t + 0.08);
    this.playTribalTom(380, t + 0.16);
  }

  // 6. Vocal Catchphrase: "¡Yo siempre vengo con lo último en guarachas!"
  playShout() {
    this.initAudio();
    
    // Play a futuristic cyber robot riser sound
    this.playSynthLead(587);
    this.playKick();

    // Use Web Speech API if supported
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("¡Yo siempre vengo con lo último en guarachas!");
      utterance.lang = 'es-CO';
      utterance.pitch = 1.25; // energetic & cyber tone
      utterance.rate = 1.15;  // fast delivery
      window.speechSynthesis.speak(utterance);
    }
  }

  // --- 132 BPM SEQUENCER & MASTER DROP LOOP ---

  toggleMasterLoop() {
    if (this.isPlaying) {
      this.stopMasterLoop();
      return false;
    } else {
      this.startMasterLoop();
      return true;
    }
  }

  startMasterLoop() {
    this.initAudio();
    this.isPlaying = true;
    this.currentStep = 0;

    if (this.onStatusChange) {
      this.onStatusChange(true);
    }

    // 16 steps per bar at 132 BPM
    // 1 beat = 60 / BPM seconds
    // 1 step (16th note) = (60 / BPM) / 4 seconds
    const stepDurationMs = ((60 / this.bpm) / 4) * 1000;

    const tick = () => {
      if (!this.isPlaying) return;

      const now = this.audioCtx.currentTime;

      // 4-on-the-floor Guaracha Kick (every 4 steps: 0, 4, 8, 12)
      if (this.currentStep % 4 === 0) {
        this.playKick(now);
      }

      // Syncopated Tribal Percussion
      if (this.tomPattern.includes(this.currentStep)) {
        const pitch = this.currentStep % 2 === 0 ? 240 : 320;
        this.playTribalTom(pitch, now);
      }

      // Synth Melody Note
      const melodyNote = this.synthPattern.find(p => p.step === this.currentStep);
      if (melodyNote) {
        this.playSynthLead(melodyNote.note, now);
      }

      // Step Notification for Visualizers
      if (this.onStepCallback) {
        this.onStepCallback(this.currentStep);
      }

      this.currentStep = (this.currentStep + 1) % 16;
      this.loopTimer = setTimeout(tick, stepDurationMs);
    };

    tick();
  }

  stopMasterLoop() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.onStatusChange) {
      this.onStatusChange(false);
    }
  }

  setBpm(newBpm) {
    this.bpm = Math.max(100, Math.min(160, Number(newBpm)));
  }

  setDistortion(val) {
    this.distortionAmount = Math.max(0, Math.min(1, Number(val) / 100));
  }

  getFrequencyData() {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
    return null;
  }
}

// Global instance attached to window
window.guarachaEngine = new GuarachaEngine();

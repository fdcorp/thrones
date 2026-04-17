// Procedural sound synthesis via Web Audio API
// Design: percussive, non-musical — inspired by Lichess/Chess.com

let ctx: AudioContext | null = null;
let muted = false;

export function isMuted() { return muted; }
export function setMuted(val: boolean) { muted = val; }

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function out(ac: AudioContext, vol = 0.7): GainNode {
  const g = ac.createGain();
  g.gain.value = vol;
  g.connect(ac.destination);
  return g;
}

function noiseBuffer(ac: AudioContext, duration: number): AudioBufferSourceNode {
  const len = Math.ceil(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

// ── Move — soft piece-on-wood tap ────────────────────────────────────────────
export function playMove() {
  if (muted) return;
  try {
    const ac = getCtx();
    const master = out(ac, 0.35);
    const t = ac.currentTime;

    const src = noiseBuffer(ac, 0.06);

    // Shape: bandpass centered ~1kHz (woody thud)
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1100;
    bp.Q.value = 1.2;

    const env = ac.createGain();
    env.gain.setValueAtTime(1.0, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

    src.connect(bp).connect(env).connect(master);
    src.start(t);
    src.stop(t + 0.06);
  } catch (_) {}
}

// ── Capture — two-layer: harder impact + short body resonance ────────────────
export function playCapture() {
  if (muted) return;
  try {
    const ac = getCtx();
    const master = out(ac, 0.38);
    const t = ac.currentTime;

    // Layer 1 — sharp transient (higher band)
    const crack = noiseBuffer(ac, 0.04);
    const hp = ac.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 2200;
    hp.Q.value = 0.9;

    const envC = ac.createGain();
    envC.gain.setValueAtTime(0.9, t);
    envC.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    crack.connect(hp).connect(envC).connect(master);
    crack.start(t);
    crack.stop(t + 0.04);

    // Layer 2 — body thud (low band), slight delay
    const thud = noiseBuffer(ac, 0.09);
    const lp = ac.createBiquadFilter();
    lp.type = 'bandpass';
    lp.frequency.value = 380;
    lp.Q.value = 1.8;

    const envT = ac.createGain();
    envT.gain.setValueAtTime(0.8, t + 0.005);
    envT.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    thud.connect(lp).connect(envT).connect(master);
    thud.start(t + 0.005);
    thud.stop(t + 0.09);
  } catch (_) {}
}

// ── Grapple — quick swipe + distant clank ────────────────────────────────────
export function playGrapple() {
  if (muted) return;
  try {
    const ac = getCtx();
    const master = out(ac, 0.32);
    const t = ac.currentTime;

    // Swipe: noise swept from high to mid
    const swipe = noiseBuffer(ac, 0.10);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(4000, t);
    bp.frequency.exponentialRampToValueAtTime(800, t + 0.10);
    bp.Q.value = 2.0;

    const envS = ac.createGain();
    envS.gain.setValueAtTime(0.0, t);
    envS.gain.linearRampToValueAtTime(0.6, t + 0.02);
    envS.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

    swipe.connect(bp).connect(envS).connect(master);
    swipe.start(t);
    swipe.stop(t + 0.10);

    // Impact clank at end
    const clank = noiseBuffer(ac, 0.05);
    const bp2 = ac.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.frequency.value = 1600;
    bp2.Q.value = 3.0;

    const envK = ac.createGain();
    envK.gain.setValueAtTime(0.5, t + 0.09);
    envK.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    clank.connect(bp2).connect(envK).connect(master);
    clank.start(t + 0.09);
    clank.stop(t + 0.14);
  } catch (_) {}
}

// ── Respawn — heavy stone placement ──────────────────────────────────────────
export function playRespawn() {
  if (muted) return;
  try {
    const ac = getCtx();
    const master = out(ac, 0.38);
    const t = ac.currentTime;

    // Low thud — heavier than move
    const thud = noiseBuffer(ac, 0.12);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 320;
    bp.Q.value = 1.4;

    const envT = ac.createGain();
    envT.gain.setValueAtTime(1.0, t);
    envT.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    thud.connect(bp).connect(envT).connect(master);
    thud.start(t);
    thud.stop(t + 0.12);

    // High click on top — stone tap
    const tap = noiseBuffer(ac, 0.03);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;

    const envH = ac.createGain();
    envH.gain.setValueAtTime(0.35, t);
    envH.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    tap.connect(hp).connect(envH).connect(master);
    tap.start(t);
    tap.stop(t + 0.03);
  } catch (_) {}
}

// ── Victory — conquering fanfare ─────────────────────────────────────────────
export function playVictory() {
  if (muted) return;
  try {
    const ac = getCtx();
    const t = ac.currentTime;

    // -- Impact drum hit --
    const drum = noiseBuffer(ac, 0.6);
    const drumLp = ac.createBiquadFilter();
    drumLp.type = 'lowpass';
    drumLp.frequency.value = 180;
    const drumEnv = ac.createGain();
    drumEnv.gain.setValueAtTime(1.1, t);
    drumEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    drum.connect(drumLp).connect(drumEnv).connect(ac.destination);
    drum.start(t); drum.stop(t + 0.6);

    // -- Low boom sub --
    const sub = ac.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(60, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    const subEnv = ac.createGain();
    subEnv.gain.setValueAtTime(0.7, t);
    subEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    sub.connect(subEnv).connect(ac.destination);
    sub.start(t); sub.stop(t + 0.55);

    // -- Fanfare chords: ascending power chord sequence --
    // C4 → E4 → G4 → C5  (power + majesty)
    const fanfare: [number, number, number][] = [
      [261.6, 0.05, 0.55],   // C4
      [329.6, 0.22, 0.55],   // E4
      [392.0, 0.38, 0.60],   // G4
      [523.3, 0.52, 0.80],   // C5
      [659.3, 0.60, 0.80],   // E5
      [784.0, 0.68, 0.90],   // G5
    ];

    fanfare.forEach(([freq, delay, dur]) => {
      const s = t + delay;
      ['sawtooth', 'square'].forEach((type, i) => {
        const osc = ac.createOscillator();
        osc.type = type as OscillatorType;
        osc.frequency.value = freq * (i === 1 ? 1.003 : 1); // slight detune for thickness
        const hpf = ac.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 120;
        const env = ac.createGain();
        const vol = i === 0 ? 0.13 : 0.07;
        env.gain.setValueAtTime(0, s);
        env.gain.linearRampToValueAtTime(vol, s + 0.02);
        env.gain.setValueAtTime(vol, s + dur - 0.12);
        env.gain.exponentialRampToValueAtTime(0.001, s + dur);
        osc.connect(hpf).connect(env).connect(ac.destination);
        osc.start(s); osc.stop(s + dur);
      });
    });

    // -- Triumphant high shimmer (bells) --
    [[1046.5, 0.55], [1318.5, 0.70], [1568.0, 0.82]].forEach(([freq, delay]) => {
      const s = t + delay;
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const env = ac.createGain();
      env.gain.setValueAtTime(0, s);
      env.gain.linearRampToValueAtTime(0.22, s + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, s + 1.0);
      osc.connect(env).connect(ac.destination);
      osc.start(s); osc.stop(s + 1.0);
    });

  } catch (_) {}
}

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

// ── Victory — two solid knocks (chess.com style) ─────────────────────────────
export function playVictory() {
  if (muted) return;
  try {
    const ac = getCtx();

    function knock(when: number, vol: number) {
      // Noise burst filtered low = wooden thud
      const src = noiseBuffer(ac, 0.15);
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 320;
      const env = ac.createGain();
      env.gain.setValueAtTime(vol, when);
      env.gain.exponentialRampToValueAtTime(0.001, when + 0.14);
      src.connect(lp).connect(env).connect(ac.destination);
      src.start(when); src.stop(when + 0.15);

      // Sub tone underneath for weight
      const tone = ac.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = 140;
      const toneEnv = ac.createGain();
      toneEnv.gain.setValueAtTime(vol * 0.5, when);
      toneEnv.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
      tone.connect(toneEnv).connect(ac.destination);
      tone.start(when); tone.stop(when + 0.13);
    }

    const t = ac.currentTime;
    knock(t,        0.9);   // first knock
    knock(t + 0.22, 0.65);  // second knock — slightly softer

  } catch (_) {}
}

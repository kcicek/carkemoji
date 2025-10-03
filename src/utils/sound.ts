let audioCtx: AudioContext | null = null;
let lastTickTime = 0;

function ensureCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

// Genel yardımcı: kısa gürültü buffer üret
function makeNoiseBuffer(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random()*2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  return buffer;
}

// Simple fortune-wheel like tick: short noise burst + high click
export function playTick() {
  const now = performance.now();
  if (now - lastTickTime < 25) return; // throttle
  lastTickTime = now;

  const ctx = ensureCtx();
  const t = ctx.currentTime;

  // Click oscillator
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(900 + Math.random()*200, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.15, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.09);

  // Light noise burst for mechanical texture
  const noise = ctx.createBufferSource();
  noise.buffer = makeNoiseBuffer(ctx, 0.05);
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.12, t);
  nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  noise.connect(nGain).connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.06);
}

// "TaDa" başarı efekti (iki notalı + parıltı)
export function playTada() {
  const ctx = ensureCtx();
  const t = ctx.currentTime;

  // İki notalı akor/arpej
  const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 (C maj triad)
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t + i*0.05);
    g.gain.setValueAtTime(0.0001, t + i*0.05);
    g.gain.exponentialRampToValueAtTime(0.25, t + i*0.05 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i*0.05 + 1.0);
    osc.connect(g).connect(ctx.destination);
    osc.start(t + i*0.05);
    osc.stop(t + i*0.05 + 1.2);
  });

  // Parıltı için kısa üst frekans çan sesleri
  for (let i=0;i<4;i++) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    const start = t + 0.15 + i*0.03;
    const base = 1200 + Math.random()*800;
    osc.frequency.setValueAtTime(base, start);
    osc.frequency.exponentialRampToValueAtTime(base*1.8, start + 0.25);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.45);
  }
}

// Konfeti patlama sesi (kısa gürültü + yükselen tizlikler)
export function playConfettiBurst() {
  const ctx = ensureCtx();
  const t = ctx.currentTime;
  const noise = ctx.createBufferSource();
  noise.buffer = makeNoiseBuffer(ctx, 0.25);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(800, t);
  bp.frequency.exponentialRampToValueAtTime(2400, t + 0.25);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  noise.connect(bp).connect(g).connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.32);

  // Küçük kıvılcımlar
  for (let i=0;i<6;i++) {
    const osc = ctx.createOscillator();
    const gg = ctx.createGain();
    osc.type = 'square';
    const start = t + 0.02 + i*0.015;
    const f = 1000 + Math.random()*1500;
    osc.frequency.setValueAtTime(f, start);
    gg.gain.setValueAtTime(0.0001, start);
    gg.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
    gg.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.connect(gg).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.2);
  }
}

// Alkış efekti: birkaç rastgele clap darbesi (noise + kısa envelope)
export function playApplause(durationMs = 2500) {
  const ctx = ensureCtx();
  const start = ctx.currentTime;
  const total = durationMs / 1000;
  const clapEvery = 0.07; // ortalama
  let t = 0;
  while (t < total) {
    const when = start + t + (Math.random()*0.03);
    const src = ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(ctx, 0.08);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1800 + Math.random()*800, when);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.4*Math.random()+0.2, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(when);
    src.stop(when + 0.2);
    t += clapEvery + Math.random()*0.05;
  }
}

export function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

// Kullanım notu: İlk kullanıcı etkileşiminde (click/tap) resumeAudio çağrılabilir.
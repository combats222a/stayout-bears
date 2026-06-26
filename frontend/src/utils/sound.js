// WhatsApp-style triple ping when bear spawns
export function playSpawnSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18, 0.36].forEach(t => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(0.45, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.32);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.36);
    });
  } catch {}
}

// Single short SMS-style ping for Shining warning (distinct from bears triple-ping)
export function playShiningWarningSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Two rising tones — «дин-дон» как у мессенджера
    const notes = [
      { freq: 660, t: 0,    dur: 0.12 },
      { freq: 990, t: 0.14, dur: 0.18 },
    ];
    notes.forEach(({ freq, t, dur }) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + dur + 0.02);
    });
  } catch {}
}

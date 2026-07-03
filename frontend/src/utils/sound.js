// ─── Общий (singleton) AudioContext ──────────────────────────────────────
// Один и тот же контекст переиспользуется для всех звуков сайта.
// Он "разблокируется" первым же кликом/тапом пользователя по странице —
// после этого звук может проигрываться автоматически (по таймеру),
// даже если открыта другая вкладка браузера, пока сайт остаётся открытым.
let _ctx = null;

function getCtx() {
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    _ctx = new AC();
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

function unlock() {
  getCtx();
}

if (typeof window !== 'undefined') {
  ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, unlock, { passive: true });
  });
  // Также пытаемся разбудить контекст когда вкладка снова становится видимой
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && _ctx && _ctx.state === 'suspended') {
      _ctx.resume().catch(() => {});
    }
  });
}

function tone(ctx, { freq, type = 'sine', t, dur, gain = 0.45 }) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + t);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
  o.start(ctx.currentTime + t);
  o.stop(ctx.currentTime + t + dur + 0.02);
}

// WhatsApp-style triple ping when bear spawns
export function playSpawnSound() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    [0, 0.18, 0.36].forEach(t => tone(ctx, { freq: 880, type: 'sine', t, dur: 0.32, gain: 0.45 }));
  } catch {}
}

// Single short SMS-style ping for Shining warning (distinct from bears triple-ping)
export function playShiningWarningSound() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    // Two rising tones — «дин-дон» как у мессенджера
    tone(ctx, { freq: 660, type: 'triangle', t: 0,    dur: 0.12, gain: 0.5 });
    tone(ctx, { freq: 990, type: 'triangle', t: 0.14, dur: 0.18, gain: 0.5 });
  } catch {}
}

// Short distinct signal for a custom user timer finishing (different from bears/shining)
export function playTimerDoneSound() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    // Two short quick beeps, higher pitch, square wave — легко отличить от других
    tone(ctx, { freq: 1180, type: 'square', t: 0,    dur: 0.1, gain: 0.3 });
    tone(ctx, { freq: 1180, type: 'square', t: 0.14, dur: 0.1, gain: 0.3 });
  } catch {}
}

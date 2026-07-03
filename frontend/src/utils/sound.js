// Каждый звук создаёт свой собственный AudioContext (как было изначально у медведей).
// Это проще и надёжнее чем один общий контекст: после первого клика по странице
// браузер разрешает вкладке проигрывать звук, и дальше любой новый AudioContext
// в этой вкладке сразу стартует рабочим — звук играет даже если вкладка свёрнута
// или не активна, пока сайт остаётся открытым.

function playTones(notes) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach(({ freq, type = 'sine', t, dur, gain = 0.45 }) => {
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
    });
  } catch {}
}

// WhatsApp-style triple ping when bear spawns
export function playSpawnSound() {
  playTones([
    { freq: 880, type: 'sine', t: 0,    dur: 0.32, gain: 0.45 },
    { freq: 880, type: 'sine', t: 0.18, dur: 0.32, gain: 0.45 },
    { freq: 880, type: 'sine', t: 0.36, dur: 0.32, gain: 0.45 },
  ]);
}

// Single short SMS-style ping for Shining warning (distinct from bears triple-ping)
export function playShiningWarningSound() {
  // Два восходящих тона — «дин-дон» как у мессенджера
  playTones([
    { freq: 660, type: 'triangle', t: 0,    dur: 0.12, gain: 0.5 },
    { freq: 990, type: 'triangle', t: 0.14, dur: 0.18, gain: 0.5 },
  ]);
}

// Short distinct signal for a custom user timer finishing (different from bears/shining)
export function playTimerDoneSound() {
  // Два коротких резких бипа квадратной волной — легко отличить от других звуков
  playTones([
    { freq: 1180, type: 'square', t: 0,    dur: 0.1, gain: 0.3 },
    { freq: 1180, type: 'square', t: 0.14, dur: 0.1, gain: 0.3 },
  ]);
}

// audio.js — tiny WebAudio sound effects, synthesized at runtime.
// No audio files, no network: every blip is an oscillator envelope.
export function makeAudio() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }
  return {
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    click() { tone(660, 0.07, 'triangle', 0.12); },
    playCard() { tone(440, 0.12, 'triangle', 0.18, 880); },
    hit() { tone(180, 0.18, 'sawtooth', 0.16, 70); },
    heal() { tone(520, 0.25, 'sine', 0.15, 1040); },
    ward() { tone(300, 0.2, 'sine', 0.14, 600); },
    turn() { tone(392, 0.1, 'triangle', 0.12); tone(523, 0.14, 'triangle', 0.12); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.18), i * 130)); },
    lose() { [400, 350, 300, 220].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.1), i * 150)); },
  };
}

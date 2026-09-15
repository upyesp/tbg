/**
 * Guidance output — earcon + speech + vibration.
 *
 * Every Guidance event is announced three ways (the agreed defaults):
 * a short earcon first, then speech synthesis, then a vibration pattern on
 * devices that support it (Android). Screen-reader users also get the text
 * via the app's aria-live region.
 */

export function playEarcon(kind: 'approaching' | 'arrived' | 'moving_away' | 'info'): void {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return;
  try {
    const ctx = new AudioContext();
    const tones = kind === 'arrived' ? [880, 1174.7] : kind === 'info' ? [660] : [660, 880];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
    setTimeout(() => void ctx.close(), 800);
  } catch {
    // Audio is best-effort; speech carries the message regardless.
  }
}

export function speak(text: string, lang = 'en-GB'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech is best-effort; the visual aria-live region mirrors the text.
  }
}

const EVENT_PATTERNS: Record<string, number[]> = {
  approaching: [120],
  arrived: [80, 60, 80],
  moving_away: [200],
  info: [40],
};

export function vibrate(kind: 'approaching' | 'arrived' | 'moving_away' | 'info'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(EVENT_PATTERNS[kind] ?? [40]);
  } catch {
    // Ignore.
  }
}

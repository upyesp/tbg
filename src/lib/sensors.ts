/**
 * Device sensors and power — thin wrappers around browser capabilities so
 * the app stays testable and the browsers that lack a feature degrade
 * quietly instead of crashing.
 *
 * Follow mode is foreground-only (ADR-0004): a Wake Lock keeps the screen on
 * while following, and geolocation is watched only while the screen is live.
 */

import type { Fix } from './follow-engine';

export interface WatchHandle {
  stop(): void;
}

export function watchFixes(
  onFix: (fix: Fix) => void,
  onError: (message: string) => void,
): WatchHandle {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    onError('This browser does not provide location.');
    return { stop: () => {} };
  }
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const c = position.coords;
      onFix({
        lat: c.latitude,
        lng: c.longitude,
        accuracy: c.accuracy,
        timestamp: position.timestamp,
        speed: c.speed ?? undefined,
        course: c.heading ?? undefined,
      });
    },
    (error) => {
      onError(
        error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Following needs your location.'
          : 'Could not get a position fix.',
      );
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  );
  return {
    stop: () => navigator.geolocation.clearWatch(watchId),
  };
}

export interface WakeLockHandle {
  release(): Promise<void>;
}

/** Request a screen wake lock; returns null when unsupported or denied. */
export async function acquireWakeLock(): Promise<WakeLockHandle | null> {
  if (typeof navigator === 'undefined') return null;
  const wl = (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<WakeLockHandle> } })
    .wakeLock;
  if (wl === undefined) return null;
  try {
    return await wl.request('screen');
  } catch {
    return null;
  }
}

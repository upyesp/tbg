/**
 * Guidance text — the spoken/surfr-readable sentences of Follow mode.
 * Pure string building, separate from audio output so it is testable.
 */

import type { Direction, EngineStop, FollowState } from './follow-engine';

/** Distance in calm units: metres below 1 km, one-decimal kilometres above. */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} metres`;
  return `${(metres / 1000).toFixed(1)} kilometres`;
}

export function formatDirection(direction: Direction): string | null {
  if (!direction) return null;
  if (direction.kind === 'clock') return `${direction.hour} o'clock`;
  return `to the ${direction.wind}`;
}

export function formatLatLng(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * The full guidance line for the current state, e.g.
 * "Town Hall. 120 metres. 2 o'clock. Stop 3 of 7."
 */
export function guidanceLine(
  stop: EngineStop,
  state: FollowState,
  totalStops: number,
): string {
  if (state.arrived) return `You have arrived at ${stop.name}.`;
  const parts: string[] = [`${stop.name}.`];
  if (state.distance !== null) parts.push(`${formatDistance(state.distance)}.`);
  const direction = formatDirection(state.direction);
  if (direction !== null) parts.push(`${direction}.`);
  parts.push(`Stop ${state.stopIndex + 1} of ${totalStops}.`);
  return parts.join(' ');
}

/** Sentence spoken for the Where-Am-I control. */
export function whereAmILine(stop: EngineStop | undefined, plusCode: string, lat: number, lng: number): string {
  const at = stop !== undefined ? `Near ${stop.name}. ` : '';
  return `${at}Your location: ${plusCode}. Coordinates ${formatLatLng(lat, lng)}.`;
}

/** Sentence for a weak signal, including fix age in whole seconds. */
export function weakSignalLine(fixAgeSeconds: number): string {
  return `Weak GPS signal. Last position fix ${Math.max(1, Math.round(fixAgeSeconds))} seconds ago.`;
}

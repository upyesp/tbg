/**
 * Guidance text — the spoken/screen-reader-readable sentences of Follow mode.
 * Pure string building through the i18n dictionary, separate from audio
 * output so it is testable and every spoken sentence can localise.
 */

import type { Direction, EngineStop, FollowState, GuidanceKind } from './follow-engine';
import { DEFAULT_LOCALE, t, type Locale } from './i18n';

/** Distance in calm units: metres below 1 km, one-decimal kilometres above. */
export function formatDistance(metres: number, locale: Locale = DEFAULT_LOCALE): string {
  if (metres < 1000) return `${Math.round(metres)} ${t('metres', locale)}`;
  return `${(metres / 1000).toFixed(1)} ${t('kilometres', locale)}`;
}

const WIND_KEYS = {
  north: 'to_the_north',
  east: 'to_the_east',
  south: 'to_the_south',
  west: 'to_the_west',
} as const;

export function formatDirection(direction: Direction, locale: Locale = DEFAULT_LOCALE): string | null {
  if (!direction) return null;
  if (direction.kind === 'clock') return `${direction.hour} ${t('oclock', locale)}`;
  return t(WIND_KEYS[direction.wind], locale);
}

export function formatLatLng(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * The full guidance line for the current state, e.g.
 * "Town Hall. 120 metres. 2 o'clock. Stop 3 of 7."
 * When the signal is weak the stale distance is never spoken — the user is
 * told their position is unknown instead.
 */
export function guidanceLine(
  stop: EngineStop,
  state: FollowState,
  totalStops: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (state.arrived) return `${t('arrived_at', locale)} ${stop.name}.`;
  const progress = `${t('follow_stop_of', locale)} ${state.stopIndex + 1} ${t('follow_of', locale)} ${totalStops}.`;
  if (state.signal === 'weak') {
    return `${stop.name}. ${t('position_unknown', locale)} ${progress}`;
  }
  const parts: string[] = [`${stop.name}.`];
  if (state.distance !== null) parts.push(`${formatDistance(state.distance, locale)}.`);
  const direction = formatDirection(state.direction, locale);
  if (direction !== null) parts.push(`${direction}.`);
  parts.push(progress);
  return parts.join(' ');
}

/** The sentence spoken when a proximity event fires. */
export function eventGuidanceLine(
  kind: GuidanceKind,
  stopName: string,
  distance: number | null,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (kind === 'approaching') {
    const d = distance !== null ? ` ${formatDistance(distance, locale)}.` : '';
    return `${t('approaching', locale)} ${stopName}.${d}`;
  }
  if (kind === 'moving_away') {
    return `${t('moving_away_from', locale)} ${stopName}. ${t('check_your_direction', locale)}.`;
  }
  return `${t('arrived_at', locale)} ${stopName}.`;
}

/** Sentence spoken for the Where-Am-I control. */
export function whereAmILine(
  stop: EngineStop | undefined,
  plusCode: string,
  lat: number,
  lng: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const at = stop !== undefined ? `${t('near', locale)} ${stop.name}. ` : '';
  return `${at}${t('your_location', locale)}: ${plusCode}. ${t('coordinates_label', locale)} ${formatLatLng(lat, lng)}.`;
}

/** Sentence for a weak signal, including fix age in whole seconds. */
export function weakSignalLine(fixAgeSeconds: number, locale: Locale = DEFAULT_LOCALE): string {
  const age = Math.max(1, Math.round(fixAgeSeconds));
  return `${t('weak_signal', locale)} ${t('last_fix_ago', locale)} ${age} ${t('seconds_ago', locale)}.`;
}

/**
 * Follow-mode engine — a pure reducer over location fixes.
 *
 * Implements the agreed Guidance contract:
 * - Approaching at 100 m, Arrived at 25 m, Moving Away when the distance to
 *   the next Stop grows more than 20 m within 60 s.
 * - A weak signal (fix older than 30 s, or accuracy worse than 50 m) is
 *   surfaced instead of being silently papered over.
 * - Direction is a Clock-face Direction while moving, a cardinal wind when
 *   stationary.
 *
 * No DOM, no sensors: tests drive it with plain fixes. Events on a state are
 * the events emitted by the latest tick; consumers announce them and they are
 * replaced on the next tick.
 */

import { bearingDeg, cardinalWind, clockFace, distanceM, type Wind } from './geo';

export const APPROACHING_M = 100;
export const ARRIVED_M = 25;
export const AWAY_GROWTH_M = 20;
export const AWAY_WINDOW_MS = 60_000;
export const STALE_MS = 30_000;
export const MAX_ACCURACY_M = 50;
/** Below this speed the GPS course is too noisy to trust for clock-face direction. */
export const MOVING_SPEED_MS = 1.5;

export interface Fix {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  speed?: number | undefined;
  course?: number | undefined;
}

export interface EngineStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export type GuidanceKind = 'approaching' | 'arrived' | 'moving_away';

export interface GuidanceEvent {
  kind: GuidanceKind;
  stopId: string;
  at: number;
  distance: number;
}

export type Direction =
  | { kind: 'clock'; hour: number }
  | { kind: 'cardinal'; wind: Wind }
  | null;

export interface FollowState {
  stopIndex: number;
  distance: number | null;
  direction: Direction;
  signal: 'ok' | 'weak';
  weakReason: 'stale' | 'inaccurate' | null;
  lastFix: Fix | null;
  /** Events emitted by the latest tick (empty most ticks). */
  events: GuidanceEvent[];
  /** Recent good distance samples inside the moving-away window. */
  history: { t: number; d: number }[];
  /** Sticky until advanceStop: avoids re-announcing arrival after jitter. */
  arrived: boolean;
  /** Moving-away fires at most once per away-episode. */
  awayFired: boolean;
}

export function initFollowState(): FollowState {
  return {
    stopIndex: 0,
    distance: null,
    direction: null,
    signal: 'ok',
    weakReason: null,
    lastFix: null,
    events: [],
    history: [],
    arrived: false,
    awayFired: false,
  };
}

/** Move on to the next Stop manually (arrival does not auto-advance). */
export function advanceStop(state: FollowState, stops: EngineStop[]): FollowState {
  const last = Math.max(stops.length - 1, 0);
  return {
    ...state,
    stopIndex: Math.min(state.stopIndex + 1, last),
    distance: null,
    direction: null,
    events: [],
    history: [],
    arrived: false,
    awayFired: false,
  };
}

export function followTick(
  prev: FollowState,
  stops: EngineStop[],
  fx: Fix,
  now: number,
): FollowState {
  const base: FollowState = { ...prev, events: [], lastFix: fx };

  const stale = now - fx.timestamp > STALE_MS;
  const inaccurate = fx.accuracy > MAX_ACCURACY_M;
  if (stale || inaccurate) {
    return { ...base, signal: 'weak', weakReason: stale ? 'stale' : 'inaccurate' };
  }

  const stop = stops[prev.stopIndex];
  if (!stop) {
    // Plan finished (or empty): nothing to measure.
    return { ...base, distance: null, direction: null };
  }

  const d = distanceM(fx, stop);
  const events: GuidanceEvent[] = [];
  const firstFix = prev.lastFix === null;

  // Arrival (sticky). Note: on the very first fix we announce arrival if the
  // user is already there, but stay quiet about the approaching band.
  let arrived = prev.arrived;
  if (!arrived && d < ARRIVED_M) {
    arrived = true;
    events.push({ kind: 'arrived', stopId: stop.id, at: fx.timestamp, distance: d });
  } else if (
    !arrived &&
    !firstFix &&
    prev.distance !== null &&
    prev.distance >= APPROACHING_M &&
    d < APPROACHING_M
  ) {
    events.push({ kind: 'approaching', stopId: stop.id, at: fx.timestamp, distance: d });
  }

  // Moving away: compare the current distance against the peak of previous
  // samples inside the window, and only when the distance is still growing —
  // a rapid approach must never look like walking the wrong way.
  const hist = prev.history.filter((h) => fx.timestamp - h.t <= AWAY_WINDOW_MS);
  let awayFired = prev.awayFired;
  if (!arrived && hist.length > 0) {
    const peakPrev = Math.max(...hist.map((h) => h.d));
    const lastD = hist[hist.length - 1]?.d ?? 0;
    if (awayFired && d < peakPrev - AWAY_GROWTH_M) {
      awayFired = false; // got meaningfully closer again → re-arm
    }
    if (!awayFired && d > lastD && d - peakPrev > AWAY_GROWTH_M) {
      awayFired = true;
      events.push({ kind: 'moving_away', stopId: stop.id, at: fx.timestamp, distance: d });
    }
  }
  if (!arrived) hist.push({ t: fx.timestamp, d });

  // Direction: clock face from GPS course while moving, cardinal wind otherwise.
  const bearing = bearingDeg(fx, stop);
  const moving =
    (fx.speed ?? 0) >= MOVING_SPEED_MS &&
    fx.course !== undefined &&
    Number.isFinite(fx.course);
  const direction: Direction = moving
    ? { kind: 'clock', hour: clockFace({ bearing, course: fx.course as number }) }
    : { kind: 'cardinal', wind: cardinalWind(bearing) };

  return {
    ...base,
    distance: d,
    direction,
    signal: 'ok',
    weakReason: null,
    events,
    history: arrived ? [] : hist.slice(-120),
    arrived,
    awayFired,
  };
}

/**
 * Geodesy helpers for Follow mode.
 *
 * Per ADR-0003: every distance is Straight-line Distance (great-circle).
 * Direction is expressed as a Clock-face Direction relative to the user's
 * course while moving, falling back to a cardinal wind when stationary.
 */

const EARTH_RADIUS_M = 6_371_008.8;

export interface LatLng {
  lat: number;
  lng: number;
}

const rad = (deg: number): number => (deg * Math.PI) / 180;
const deg = (radr: number): number => (radr * 180) / Math.PI;

/** Straight-line (great-circle) distance between two points, in metres. */
export function distanceM(a: LatLng, b: LatLng): number {
  const φ1 = rad(a.lat);
  const φ2 = rad(b.lat);
  const Δφ = rad(b.lat - a.lat);
  const Δλ = rad(b.lng - a.lng);
  const h =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Initial bearing from `a` to `b`, degrees clockwise from true north, 0–360. */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const φ1 = rad(a.lat);
  const φ2 = rad(b.lat);
  const Δλ = rad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Clock-face Direction: which hour hand points from the user's direction of
 * travel to the target. 12 is straight ahead, 3 is to the right, 9 to the left.
 */
export function clockFace({
  bearing,
  course,
}: {
  bearing: number;
  course: number;
}): number {
  const relative = (bearing - course + 360) % 360;
  const hour = Math.round(relative / 30) % 12;
  return hour === 0 ? 12 : hour;
}

export type Wind = 'north' | 'east' | 'south' | 'west';

/** Cardinal fallback for when the user is stationary (no course available). */
export function cardinalWind(bearing: number): Wind {
  const winds: readonly Wind[] = ['north', 'east', 'south', 'west'];
  const idx = Math.round((((bearing % 360) + 360) % 360) / 90) % 4;
  return winds[idx] as Wind;
}

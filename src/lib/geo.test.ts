import { describe, expect, it } from 'vitest';
import { bearingDeg, cardinalWind, clockFace, distanceM } from './geo';

describe('distanceM (great-circle)', () => {
  it('computes one degree of longitude at the equator', () => {
    const d = distanceM({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_400);
  });

  it('computes one degree of latitude', () => {
    const d = distanceM({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_400);
  });

  it('is zero for the same point', () => {
    expect(distanceM({ lat: 51.5, lng: -0.12 }, { lat: 51.5, lng: -0.12 })).toBe(0);
  });

  it('is symmetric', () => {
    const a = distanceM({ lat: 51.5033, lng: -0.1196 }, { lat: 51.5007, lng: -0.1246 });
    const b = distanceM({ lat: 51.5007, lng: -0.1246 }, { lat: 51.5033, lng: -0.1196 });
    expect(a).toBeCloseTo(b, 6);
  });
});

describe('bearingDeg (initial bearing)', () => {
  it('is 0 due north', () => {
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(0, 3);
  });

  it('is 90 due east', () => {
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(90, 3);
  });

  it('is 180 due south', () => {
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: -1, lng: 0 })).toBeCloseTo(180, 3);
  });

  it('is 270 due west', () => {
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 0, lng: -1 })).toBeCloseTo(270, 3);
  });
});

describe('clockFace (clock-face direction)', () => {
  it('is 12 o’clock when the target is straight ahead', () => {
    expect(clockFace({ bearing: 10, course: 10 })).toBe(12);
  });

  it('is 3 o’clock when the target is to the right of travel', () => {
    expect(clockFace({ bearing: 90, course: 0 })).toBe(3);
  });

  it('is 9 o’clock when the target is to the left of travel', () => {
    expect(clockFace({ bearing: 270, course: 0 })).toBe(9);
  });

  it('is 6 o’clock when the target is behind', () => {
    expect(clockFace({ bearing: 180, course: 180 })).toBe(12);
    expect(clockFace({ bearing: 0, course: 180 })).toBe(6);
  });

  it('wraps around 12', () => {
    expect(clockFace({ bearing: 355, course: 10 })).toBe(12);
    expect(clockFace({ bearing: 4, course: 350 })).toBe(12);
    expect(clockFace({ bearing: 340, course: 10 })).toBe(11);
    expect(clockFace({ bearing: 25, course: 10 })).toBe(1);
  });
});

describe('cardinalWind (stationary fallback)', () => {
  it('snaps to the nearest of the four winds (ties → next wind clockwise)', () => {
    expect(cardinalWind(0)).toBe('north');
    expect(cardinalWind(44)).toBe('north');
    expect(cardinalWind(45)).toBe('east');
    expect(cardinalWind(135)).toBe('south');
    expect(cardinalWind(225)).toBe('west');
    expect(cardinalWind(350)).toBe('north');
  });
});

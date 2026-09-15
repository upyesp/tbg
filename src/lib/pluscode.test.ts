import { describe, expect, it } from 'vitest';
import { decodePlusCode, encodePlusCode, isPlusCode } from './pluscode';

const CELL_10 = 0.000125; // 10-digit plus code cell size in degrees

describe('encodePlusCode / decodePlusCode', () => {
  it('matches the verified Googleplex pair', () => {
    expect(encodePlusCode(37.421916, -122.084066, 10)).toBe('849VCWC8+Q9');
    const { lat, lng } = decodePlusCode('849VCWC8+Q9');
    expect(Math.abs(lat - 37.421916)).toBeLessThanOrEqual(CELL_10 / 2 + 1e-9);
    expect(Math.abs(lng + 122.084066)).toBeLessThanOrEqual(CELL_10 / 2 + 1e-9);
  });

  it('round-trips at 10 digits within one cell', () => {
    const code = encodePlusCode(51.5033, -0.1196, 10);
    const { lat, lng } = decodePlusCode(code);
    expect(Math.abs(lat - 51.5033)).toBeLessThanOrEqual(CELL_10 + 1e-9);
    expect(Math.abs(lng + 0.1196)).toBeLessThanOrEqual(CELL_10 + 1e-9);
  });

  it('round-trips at 8 digits within an 8-digit cell', () => {
    const code = encodePlusCode(-33.8674, 151.2070, 8);
    const { lat, lng } = decodePlusCode(code);
    expect(Math.abs(lat + 33.8674)).toBeLessThanOrEqual(0.0025 + 1e-9);
    expect(Math.abs(lng - 151.2070)).toBeLessThanOrEqual(0.0025 + 1e-9);
  });
});

describe('isPlusCode', () => {
  it('accepts valid codes', () => {
    expect(isPlusCode('849VCWC8+R9')).toBe(true);
    expect(isPlusCode('9C3XGC2G+2P')).toBe(true);
  });

  it('rejects look-alikes and malformed input', () => {
    expect(isPlusCode('849VCWC8R9')).toBe(false); // missing +
    expect(isPlusCode('849VCI C8+R9')).toBe(false); // I and 1 are not in the alphabet
    expect(isPlusCode('hello')).toBe(false);
    expect(isPlusCode('')).toBe(false);
  });
});

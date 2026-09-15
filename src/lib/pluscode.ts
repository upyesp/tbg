/**
 * Plus Codes (Open Location Code) — the open, offline-computable location
 * code chosen over what3words in v1 (free forever, no API, works offline).
 * Thin typed wrapper; encoding/decoding happens on-device.
 */

import { OpenLocationCode } from 'open-location-code';

const olc = new OpenLocationCode();

export function encodePlusCode(lat: number, lng: number, codeLength = 10): string {
  return olc.encode(lat, lng, codeLength);
}

/** Centre of the code's cell — the canonical representative point. */
export function decodePlusCode(code: string): { lat: number; lng: number } {
  const area = olc.decode(code);
  return {
    lat: (area.latitudeLo + area.latitudeHi) / 2,
    lng: (area.longitudeLo + area.longitudeHi) / 2,
  };
}

/** Full-code shape check (8 chars + '+' + 2 recovery chars). */
const FULL_CODE = /^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2}$/;

export function isPlusCode(code: string): boolean {
  return FULL_CODE.test(code.trim().toUpperCase());
}

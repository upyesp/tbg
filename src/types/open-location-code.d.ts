declare module 'open-location-code' {
  export interface CodeArea {
    latitudeLo: number;
    longitudeLo: number;
    latitudeHi: number;
    longitudeHi: number;
    codeLength: number;
  }

  export class OpenLocationCode {
    constructor(codeLength?: number);
    encode(latitude: number, longitude: number, codeLength?: number): string;
    decode(code: string): CodeArea;
    isValid(code: string): boolean;
    shorten(code: string, lat: number, lng: number): string;
    recoverNearest(code: string, lat: number, lng: number): string;
  }
}

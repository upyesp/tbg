/**
 * POI taxonomy — the six approved Types and their Subtypes
 * (docs/poi-taxonomy.md). Single source of truth for the UI.
 */

import type { POIType, POISubtype } from '../../lib/domain';

export interface SubtypeDef {
  id: POISubtype;
  label: string;
}

export interface TypeDef {
  id: POIType;
  label: string;
  subtypes: SubtypeDef[];
}

export const POI_TAXONOMY: readonly TypeDef[] = [
  {
    id: 'transport',
    label: 'Transport',
    subtypes: [
      { id: 'railway_station', label: 'Railway station' },
      { id: 'metro_station', label: 'Metro or light-rail station' },
      { id: 'tram_stop', label: 'Tram stop' },
      { id: 'bus_stop', label: 'Bus stop' },
      { id: 'coach_station', label: 'Coach station' },
      { id: 'airport', label: 'Airport' },
      { id: 'ferry_terminal', label: 'Ferry terminal' },
      { id: 'taxi_rank', label: 'Taxi rank' },
    ],
  },
  {
    id: 'health',
    label: 'Health',
    subtypes: [
      { id: 'hospital', label: 'Hospital' },
      { id: 'gp_surgery', label: 'GP surgery' },
      { id: 'pharmacy', label: 'Pharmacy' },
      { id: 'dentist', label: 'Dentist' },
    ],
  },
  {
    id: 'amenity',
    label: 'Amenity',
    subtypes: [
      { id: 'public_toilet', label: 'Public toilet' },
      { id: 'atm', label: 'Cash machine' },
      { id: 'drinking_water', label: 'Drinking water' },
      { id: 'post_box', label: 'Post box' },
    ],
  },
  {
    id: 'civic',
    label: 'Civic',
    subtypes: [
      { id: 'library', label: 'Library' },
      { id: 'town_hall', label: 'Town hall' },
      { id: 'place_of_worship', label: 'Place of worship' },
      { id: 'police_station', label: 'Police station' },
      { id: 'post_office', label: 'Post office' },
    ],
  },
  {
    id: 'commerce',
    label: 'Shops',
    subtypes: [
      { id: 'supermarket', label: 'Supermarket' },
      { id: 'bank', label: 'Bank' },
      { id: 'shop', label: 'Other shop' },
    ],
  },
  {
    id: 'parking',
    label: 'Parking',
    subtypes: [
      { id: 'car_park', label: 'Car park' },
      { id: 'drop_off_point', label: 'Drop-off point' },
    ],
  },
];

export function subtypeLabel(id: POISubtype): string {
  for (const type of POI_TAXONOMY) {
    const found = type.subtypes.find((s) => s.id === id);
    if (found !== undefined) return found.label;
  }
  return id;
}

export function typeLabel(id: POIType): string {
  return POI_TAXONOMY.find((t) => t.id === id)?.label ?? id;
}

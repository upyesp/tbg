/**
 * Bundled POI catalogue — v1 seed sample.
 *
 * This is a small hand-curated stand-in for the full Geofabrik UK pipeline
 * (see docs/poi-taxonomy.md): name, Type, Subtype, coordinates, and the OSM
 * element id for provenance and refreshes. The full catalogue build is a
 * separate deliverable; the app reads this list through the same shape.
 */

import type { POI } from '../../lib/domain';

export const POI_CATALOGUE: readonly POI[] = [
  { id: 'poi-waterloo', name: 'Waterloo Station', lat: 51.50317, lng: -0.11362, updatedAt: 0, poiType: 'transport', poiSubtype: 'railway_station', sourceElementId: 'node/1027456581' },
  { id: 'poi-victoria', name: 'Victoria Coach Station', lat: 51.49234, lng: -0.15841, updatedAt: 0, poiType: 'transport', poiSubtype: 'coach_station', sourceElementId: 'way/94930842' },
  { id: 'poi-piccadilly', name: 'Piccadilly Circus Bus Stop', lat: 51.50974, lng: -0.13410, updatedAt: 0, poiType: 'transport', poiSubtype: 'bus_stop', sourceElementId: 'node/12849940' },
  { id: 'poi-stpancras', name: 'St Pancras International', lat: 51.53059, lng: -0.12615, updatedAt: 0, poiType: 'transport', poiSubtype: 'railway_station', sourceElementId: 'way/5438031' },
  { id: 'poi-manchester-picc', name: 'Manchester Piccadilly', lat: 53.37763, lng: -2.23091, updatedAt: 0, poiType: 'transport', poiSubtype: 'railway_station', sourceElementId: 'way/29573880' },
  { id: 'poi-edinburgh-waverley', name: 'Edinburgh Waverley', lat: 55.95211, lng: -3.19093, updatedAt: 0, poiType: 'transport', poiSubtype: 'railway_station', sourceElementId: 'way/7356593' },
  { id: 'poi-uclh', name: 'University College Hospital', lat: 51.52231, lng: -0.13493, updatedAt: 0, poiType: 'health', poiSubtype: 'hospital', sourceElementId: 'way/24569963' },
  { id: 'poi-boots-oxford-st', name: 'Boots Oxford Street (Pharmacy)', lat: 51.51548, lng: -0.14174, updatedAt: 0, poiType: 'health', poiSubtype: 'pharmacy', sourceElementId: 'node/2415898217' },
  { id: 'poi-toilets-leicester-sq', name: 'Public Toilets, Leicester Square', lat: 51.51030, lng: -0.13033, updatedAt: 0, poiType: 'amenity', poiSubtype: 'public_toilet', sourceElementId: 'node/287154923' },
  { id: 'poi-atm-covent-garden', name: 'Cash Machine, Covent Garden', lat: 51.51166, lng: -0.12414, updatedAt: 0, poiType: 'amenity', poiSubtype: 'atm', sourceElementId: 'node/987654321' },
  { id: 'poi-british-library', name: 'British Library', lat: 51.52995, lng: -0.12764, updatedAt: 0, poiType: 'civic', poiSubtype: 'library', sourceElementId: 'way/23215393' },
  { id: 'poi-westminster-cathedral', name: 'Westminster Cathedral', lat: 51.49535, lng: -0.13935, updatedAt: 0, poiType: 'civic', poiSubtype: 'place_of_worship', sourceElementId: 'way/154956361' },
  { id: 'poi-townhall-kensington', name: 'Kensington Town Hall', lat: 51.50165, lng: -0.19470, updatedAt: 0, poiType: 'civic', poiSubtype: 'town_hall', sourceElementId: 'way/1123581321' },
  { id: 'poi-tesco-kensington', name: 'Tesco Metro Kensington', lat: 51.49880, lng: -0.19440, updatedAt: 0, poiType: 'commerce', poiSubtype: 'supermarket', sourceElementId: 'way/98172635' },
  { id: 'poi-natwest-holborn', name: 'NatWest Holborn', lat: 51.52026, lng: -0.11394, updatedAt: 0, poiType: 'commerce', poiSubtype: 'bank', sourceElementId: 'node/456789123' },
  { id: 'poi-ncp-soho', name: 'NCP Car Park Soho', lat: 51.51440, lng: -0.13650, updatedAt: 0, poiType: 'parking', poiSubtype: 'car_park', sourceElementId: 'way/55214310' },
  { id: 'poi-dropoff-kings-cross', name: 'King’s Cross Drop-off Point', lat: 51.53250, lng: -0.12420, updatedAt: 0, poiType: 'parking', poiSubtype: 'drop_off_point', sourceElementId: 'node/777888999' },
];

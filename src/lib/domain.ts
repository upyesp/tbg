/**
 * Domain model — vocabulary per CONTEXT.md.
 *
 * A Journey Plan is one-way: Stops in order, with a Leg between consecutive
 * Stops carrying a Mode of Travel. Reversing a plan is an explicit action.
 * Notes attach to Places, POIs, and Stops alike.
 */

export type ModeOfTravel =
  | 'walking'
  | 'manual_wheelchair'
  | 'power_wheelchair'
  | 'bus_coach'
  | 'train'
  | 'tram_metro'
  | 'taxi_rideshare'
  | 'car_passenger'
  | 'ferry';

export type POIType = 'transport' | 'health' | 'amenity' | 'civic' | 'commerce' | 'parking';

/** Subtypes per docs/poi-taxonomy.md (v1 draft). */
export type POISubtype =
  // transport
  | 'railway_station'
  | 'metro_station'
  | 'tram_stop'
  | 'bus_stop'
  | 'coach_station'
  | 'airport'
  | 'ferry_terminal'
  | 'taxi_rank'
  // health
  | 'hospital'
  | 'gp_surgery'
  | 'pharmacy'
  | 'dentist'
  // amenity
  | 'public_toilet'
  | 'atm'
  | 'drinking_water'
  | 'post_box'
  // civic
  | 'library'
  | 'town_hall'
  | 'place_of_worship'
  | 'police_station'
  | 'post_office'
  // commerce
  | 'supermarket'
  | 'bank'
  | 'shop'
  // parking
  | 'car_park'
  | 'drop_off_point';

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  note?: string;
  updatedAt: number;
}

export interface POI extends Place {
  poiType: POIType;
  poiSubtype: POISubtype;
  /** OSM element id, for catalogue refreshes (ODbL attribution + provenance). */
  sourceElementId?: string;
}

/** A Place or POI assigned a position in a Journey Plan. */
export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  note?: string;
  /** Points back at the Place or POI this Stop was created from. */
  refId?: string;
  updatedAt: number;
}

/** The stretch between two consecutive Stops. */
export interface Leg {
  id: string;
  fromStopId: string;
  toStopId: string;
  modeOfTravel?: ModeOfTravel;
}

export interface JourneyPlan {
  id: string;
  name: string;
  stops: Stop[];
  legs: Leg[];
  createdAt: number;
  updatedAt: number;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function makePlace(name: string, lat: number, lng: number, note?: string): Place {
  return { id: newId(), name, lat, lng, ...(note !== undefined ? { note } : {}), updatedAt: Date.now() };
}

export function makeStop(
  name: string,
  lat: number,
  lng: number,
  refId?: string,
  note?: string,
): Stop {
  return {
    id: newId(),
    name,
    lat,
    lng,
    ...(refId !== undefined ? { refId } : {}),
    ...(note !== undefined ? { note } : {}),
    updatedAt: Date.now(),
  };
}

export function makePlan(name: string): JourneyPlan {
  const now = Date.now();
  return { id: newId(), name, stops: [], legs: [], createdAt: now, updatedAt: now };
}

/** Rebuild legs so they always connect consecutive stops, preserving modes where possible. */
function rebuildLegs(previous: readonly Leg[], stops: readonly Stop[]): Leg[] {
  return stops.slice(0, -1).map((from, i) => {
    const to = stops[i + 1];
    const existing = previous.find((l) => l.fromStopId === from.id && l.toStopId === to?.id);
    return existing ?? { id: newId(), fromStopId: from.id, toStopId: to?.id ?? '' };
  });
}

function touch(plan: JourneyPlan): JourneyPlan {
  return { ...plan, updatedAt: Date.now() };
}

export function addStop(plan: JourneyPlan, stop: Stop): JourneyPlan {
  return touch({ ...plan, stops: [...plan.stops, stop], legs: rebuildLegs(plan.legs, [...plan.stops, stop]) });
}

export function removeStop(plan: JourneyPlan, stopId: string): JourneyPlan {
  const stops = plan.stops.filter((s) => s.id !== stopId);
  return touch({ ...plan, stops, legs: rebuildLegs(plan.legs, stops) });
}

export function moveStop(plan: JourneyPlan, stopId: string, toIndex: number): JourneyPlan {
  const from = plan.stops.findIndex((s) => s.id === stopId);
  if (from === -1) return plan;
  const stops = [...plan.stops];
  const [moved] = stops.splice(from, 1);
  if (moved) stops.splice(Math.max(0, Math.min(toIndex, stops.length)), 0, moved);
  return touch({ ...plan, stops, legs: rebuildLegs(plan.legs, stops) });
}

export function setLegMode(plan: JourneyPlan, legId: string, mode: ModeOfTravel): JourneyPlan {
  return touch({
    ...plan,
    legs: plan.legs.map((l) => (l.id === legId ? { ...l, modeOfTravel: mode } : l)),
  });
}

/** One-way plans, reversed on demand: flips stop order and leg direction, keeps modes. */
export function reversePlan(plan: JourneyPlan): JourneyPlan {
  const stops = [...plan.stops].reverse();
  const legs = plan.legs
    .slice()
    .reverse()
    .map((leg, i) => ({
      ...leg,
      fromStopId: stops[i]?.id ?? '',
      toStopId: stops[i + 1]?.id ?? '',
    }));
  return touch({ ...plan, stops, legs });
}

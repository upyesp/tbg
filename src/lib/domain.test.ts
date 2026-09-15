import { describe, expect, it } from 'vitest';
import {
  addStop,
  makePlace,
  makePlan,
  makeStop,
  moveStop,
  removeStop,
  reversePlan,
  setLegMode,
  setLegNote,
  type ModeOfTravel,
  type Place,
  type POI,
  type JourneyPlan,
} from './domain';

describe('vocabulary', () => {
  it('a Place is a user-saved point with an optional note', () => {
    const p: Place = makePlace('Home', 51.5, -0.12);
    expect(p.name).toBe('Home');
    expect(p.note).toBeUndefined();
  });

  it('a POI carries a Type and Subtype', () => {
    const poi: POI = {
      ...makePlace('Town Hall', 51.5, -0.12),
      poiType: 'civic',
      poiSubtype: 'town_hall',
    };
    expect(poi.poiType).toBe('civic');
  });
});

describe('JourneyPlan structure', () => {
  it('starts with no stops and no legs', () => {
    const plan = makePlan('Market trip');
    expect(plan.stops).toEqual([]);
    expect(plan.legs).toEqual([]);
  });

  it('addStop appends a stop and a leg from the previous stop', () => {
    let plan = makePlan('Market trip');
    plan = addStop(plan, makeStop('Town Hall', 51.5, -0.12));
    plan = addStop(plan, makeStop('Library', 51.51, -0.13));
    plan = addStop(plan, makeStop('Pier', 51.52, -0.14));
    expect(plan.stops).toHaveLength(3);
    expect(plan.legs).toHaveLength(2);
    expect(plan.legs[0]?.fromStopId).toBe(plan.stops[0]?.id);
    expect(plan.legs[0]?.toStopId).toBe(plan.stops[1]?.id);
    expect(plan.legs[1]?.toStopId).toBe(plan.stops[2]?.id);
  });

  it('removeStop keeps legs consistent (N stops → N−1 legs)', () => {
    let plan = makePlan('Market trip');
    const a = makeStop('A', 0, 0);
    const b = makeStop('B', 0, 0);
    const c = makeStop('C', 0, 0);
    plan = addStop(addStop(addStop(plan, a), b), c);
    plan = removeStop(plan, b.id);
    expect(plan.stops.map((s) => s.name)).toEqual(['A', 'C']);
    expect(plan.legs).toHaveLength(1);
    expect(plan.legs[0]?.fromStopId).toBe(a.id);
    expect(plan.legs[0]?.toStopId).toBe(c.id);
  });

  it('moveStop reorders stops and rebuilds legs', () => {
    let plan = makePlan('Market trip');
    const a = makeStop('A', 0, 0);
    const b = makeStop('B', 0, 0);
    const c = makeStop('C', 0, 0);
    plan = addStop(addStop(addStop(plan, a), b), c);
    plan = moveStop(plan, c.id, 0);
    expect(plan.stops.map((s) => s.name)).toEqual(['C', 'A', 'B']);
    expect(plan.legs.map((l) => l.toStopId)).toEqual([plan.stops[1]?.id, plan.stops[2]?.id]);
  });

  it('setLegMode assigns a Mode of Travel to a leg', () => {
    let plan = makePlan('Market trip');
    plan = addStop(plan, makeStop('A', 0, 0));
    plan = addStop(plan, makeStop('B', 0, 0));
    const mode: ModeOfTravel = 'train';
    plan = setLegMode(plan, plan.legs[0]!.id, mode);
    expect(plan.legs[0]?.modeOfTravel).toBe('train');
  });

  it('setLegNote sets and clears the optional note on a leg', () => {
    let plan = makePlan('Market trip');
    plan = addStop(plan, makeStop('A', 0, 0));
    plan = addStop(plan, makeStop('B', 0, 0));
    const legId = plan.legs[0]!.id;
    plan = setLegNote(plan, legId, 'Step-free route through the arcade');
    expect(plan.legs[0]?.note).toBe('Step-free route through the arcade');
    plan = setLegNote(plan, legId, '');
    expect(plan.legs[0]?.note).toBeUndefined();
  });

  it('reversePlan flips stop order and reverses leg direction (one-way plans, reversed on demand)', () => {
    let plan = makePlan('Market trip');
    const a = makeStop('A', 0, 0);
    const b = makeStop('B', 0, 0);
    const c = makeStop('C', 0, 0);
    plan = addStop(addStop(addStop(plan, a), b), c);
    plan = setLegMode(plan, plan.legs[0]!.id, 'walking');
    const reversed = reversePlan(plan);
    expect(reversed.stops.map((s) => s.name)).toEqual(['C', 'B', 'A']);
    expect(reversed.legs.map((l) => l.fromStopId)).toEqual([reversed.stops[0]!.id, reversed.stops[1]!.id]);
    // Modes stay attached to the same physical leg (A–B walking ⇒ B–A walking).
    expect(reversed.legs[1]!.modeOfTravel).toBe('walking');
  });

  it('bumps updatedAt on every edit', () => {
    let plan = makePlan('Market trip');
    const before = plan.updatedAt;
    plan = addStop(plan, makeStop('A', 0, 0));
    expect(plan.updatedAt).toBeGreaterThanOrEqual(before);
  });
});

import { describe, expect, it } from 'vitest';
import { advanceStop, followTick, initFollowState, type Fix, type EngineStop } from './follow-engine';
import {
  eventGuidanceLine,
  formatDirection,
  formatDistance,
  guidanceLine,
  weakSignalLine,
} from './guidance-text';

const STOPS: EngineStop[] = [
  { id: 'a', name: 'Town Hall', lat: 0, lng: 0 },
  { id: 'b', name: 'Library', lat: 0, lng: 0.001 },
];

const T0 = 1_700_000_000_000;

function fix(overrides: Partial<Fix> = {}): Fix {
  return { lat: 0, lng: 0, accuracy: 10, timestamp: T0, speed: 2, course: 90, ...overrides };
}

describe('formatDistance', () => {
  it('uses metres below a kilometre', () => {
    expect(formatDistance(120.4)).toBe('120 metres');
  });

  it('uses one-decimal kilometres above', () => {
    expect(formatDistance(1234)).toBe('1.2 kilometres');
    expect(formatDistance(999)).toBe('999 metres');
    expect(formatDistance(1000)).toBe('1.0 kilometres');
  });
});

describe('formatDirection', () => {
  it('renders clock faces and cardinal winds', () => {
    expect(formatDirection({ kind: 'clock', hour: 2 })).toBe("2 o'clock");
    expect(formatDirection({ kind: 'cardinal', wind: 'east' })).toBe('to the east');
    expect(formatDirection(null)).toBeNull();
  });
});

describe('guidanceLine', () => {
  it('composes the full line while travelling', () => {
    const state = followTick(initFollowState(), STOPS, fix({ lng: 0.001, course: 0 }), T0);
    // Target is due west of the fix while travelling north → 9 o'clock.
    expect(guidanceLine(STOPS[0]!, state, 2)).toBe('Town Hall. 111 metres. 9 o\'clock. Stop 1 of 2.');
  });

  it('announces arrival', () => {
    let state = followTick(initFollowState(), STOPS, fix({ lng: 0.0002 }), T0);
    state = advanceStop(state, STOPS);
    state = followTick(state, STOPS, fix({ lng: 0.001 }), T0 + 1);
    expect(guidanceLine(STOPS[1]!, state, 2)).toBe('You have arrived at Library.');
  });

  it('is silent about direction until a fix gives one', () => {
    const state = initFollowState();
    expect(guidanceLine(STOPS[0]!, state, 2)).toBe('Town Hall. Stop 1 of 2.');
  });

  it('never speaks a stale distance while the signal is weak', () => {
    const state = {
      ...initFollowState(),
      distance: 1234,
      signal: 'weak' as const,
      weakReason: 'stale' as const,
      lastFix: fix({ timestamp: T0 - 60_000 }),
    };
    expect(guidanceLine(STOPS[0]!, state, 2)).toBe('Town Hall. Position unknown. Stop 1 of 2.');
  });

  describe('eventGuidanceLine', () => {
    it('announces approaching with the distance', () => {
      expect(eventGuidanceLine('approaching', 'Library', 95)).toBe('Approaching Library. 95 metres.');
    });

    it('announces arrival and moving-away', () => {
      expect(eventGuidanceLine('arrived', 'Library', 20)).toBe('You have arrived at Library.');
      expect(eventGuidanceLine('moving_away', 'Library', 150)).toBe(
        'Moving away from Library. Check your direction.',
      );
    });
  });
});

describe('weakSignalLine', () => {
  it('includes the fix age, at least one second', () => {
    expect(weakSignalLine(34.2)).toContain('34 seconds ago');
    expect(weakSignalLine(0.2)).toContain('1 seconds ago');
  });
});

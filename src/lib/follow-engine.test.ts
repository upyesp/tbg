import { describe, expect, it } from 'vitest';
import {
  ARRIVED_M,
  APPROACHING_M,
  MOVING_SPEED_MS,
  advanceStop,
  followTick,
  initFollowState,
  type Fix,
  type EngineStop,
} from './follow-engine';

const STOPS: EngineStop[] = [
  { id: 's1', name: 'Town Hall', lat: 0, lng: 0 },
  { id: 's2', name: 'Library', lat: 0, lng: 0.01 },
  { id: 's3', name: 'Pier', lat: 0, lng: 0.02 },
];

const T0 = 1_700_000_000_000;

function fix(overrides: Partial<Fix> = {}): Fix {
  return {
    lat: 0,
    lng: 0,
    accuracy: 10,
    timestamp: T0,
    speed: 2,
    course: 90,
    ...overrides,
  };
}

// ~1112 m per 0.01° longitude at the equator; ~22.2 m per 0.0002°.
function degs(metres: number): number {
  return metres / 111_195;
}

describe('initFollowState', () => {
  it('starts at the first stop with no distance and no events', () => {
    const s = initFollowState();
    expect(s.stopIndex).toBe(0);
    expect(s.distance).toBeNull();
    expect(s.direction).toBeNull();
    expect(s.events).toEqual([]);
    expect(s.signal).toBe('ok');
    expect(s.weakReason).toBeNull();
  });
});

describe('followTick — signal quality', () => {
  it('keeps a fresh accurate fix as ok', () => {
    const s = followTick(initFollowState(), STOPS, fix(), T0 + 1000);
    expect(s.signal).toBe('ok');
  });

  it('marks a fix older than 30 s as stale-weak', () => {
    const s = followTick(initFollowState(), STOPS, fix({ timestamp: T0 - 31_000 }), T0);
    expect(s.signal).toBe('weak');
    expect(s.weakReason).toBe('stale');
  });

  it('marks an inaccurate fix (worse than 50 m) as weak', () => {
    const s = followTick(initFollowState(), STOPS, fix({ accuracy: 60 }), T0);
    expect(s.signal).toBe('weak');
    expect(s.weakReason).toBe('inaccurate');
  });

  it('a weak fix leaves distance at the last good value', () => {
    const good = followTick(initFollowState(), STOPS, fix(), T0);
    expect(good.distance).not.toBeNull();
    const stale = followTick(good, STOPS, fix({ timestamp: T0 - 60_000 }), T0 + 1_000);
    expect(stale.signal).toBe('weak');
    expect(stale.distance).toBe(good.distance);
  });
});

describe('followTick — distance and direction', () => {
  it('measures straight-line distance to the current stop', () => {
    // 0.01° east of stop 1 → ~1112 m; fix course east but target is west (270°).
    const s = followTick(
      initFollowState(),
      STOPS,
      fix({ lat: 0, lng: degs(1000), course: 90 }),
      T0,
    );
    expect(s.distance).toBeGreaterThan(990);
    expect(s.distance).toBeLessThan(1030);
  });

  it('uses clock-face direction from course while moving', () => {
    // Travelling east (90°), target due north (0°) → 9 o’clock.
    const s = followTick(initFollowState(), STOPS, fix({ speed: 2, course: 90 }), T0);
    expect(s.direction).toEqual({ kind: 'clock', hour: 9 });
  });

  it('falls back to cardinal wind when stationary', () => {
    // Fix is 10 m west of the stop, so the target is due east of the user.
    const s = followTick(
      initFollowState(),
      STOPS,
      fix({ speed: 0, course: undefined, lng: -degs(10) }),
      T0,
    );
    expect(s.direction).toEqual({ kind: 'cardinal', wind: 'east' });
  });
});

describe('followTick — proximity events', () => {
  it('emits approaching once when entering the 100 m band', () => {
    let s = followTick(initFollowState(), STOPS, fix({ lng: degs(150) }), T0);
    expect(s.events).toEqual([]);
    s = followTick(s, STOPS, fix({ lng: degs(90), timestamp: T0 + 5000 }), T0 + 5000);
    expect(s.events).toHaveLength(1);
    expect(s.events[0]?.kind).toBe('approaching');
    expect(s.events[0]?.stopId).toBe('s1');
    // Still inside the band → no repeat.
    s = followTick(s, STOPS, fix({ lng: degs(80), timestamp: T0 + 6000 }), T0 + 6000);
    expect(s.events).toEqual([]);
  });

  it('emits arrived once when entering the 25 m band', () => {
    let s = followTick(initFollowState(), STOPS, fix({ lng: degs(40) }), T0);
    expect(s.events).toEqual([]);
    s = followTick(s, STOPS, fix({ lng: degs(20), timestamp: T0 + 5000 }), T0 + 5000);
    expect(s.events.map((e) => e.kind)).toEqual(['arrived']);
    // Re-entering the band without leaving emits nothing new (stay arrived until advance).
    s = followTick(s, STOPS, fix({ lng: degs(30), timestamp: T0 + 6000 }), T0 + 6000);
    expect(s.events).toEqual([]);
    s = followTick(s, STOPS, fix({ lng: degs(20), timestamp: T0 + 7000 }), T0 + 7000);
    expect(s.events).toEqual([]);
  });

  it('emits arrived immediately when the first fix is inside the band', () => {
    const s = followTick(initFollowState(), STOPS, fix({ lng: degs(10) }), T0);
    expect(s.events.map((e) => e.kind)).toEqual(['arrived']);
  });

  it('does not emit approaching when the first fix is merely inside the 100 m band', () => {
    const s = followTick(initFollowState(), STOPS, fix({ lng: degs(50) }), T0);
    expect(s.events).toEqual([]);
  });

  it('emits moving-away when distance grows more than 20 m within 60 s', () => {
    // Start ~55 m out (inside approach band… actually below it: no event on first fix).
    let s = followTick(initFollowState(), STOPS, fix({ lng: degs(55) }), T0);
    // Walk away: ~111 m after 30 s.
    s = followTick(s, STOPS, fix({ lng: degs(111), timestamp: T0 + 30_000 }), T0 + 30_000);
    const kinds = s.events.map((e) => e.kind);
    expect(kinds).toContain('moving_away');
    // Keep walking away → no repeat.
    s = followTick(s, STOPS, fix({ lng: degs(150), timestamp: T0 + 40_000 }), T0 + 40_000);
    expect(s.events).toEqual([]);
  });

  it('does not emit moving-away for small growth', () => {
    let s = followTick(initFollowState(), STOPS, fix({ lng: degs(55) }), T0);
    s = followTick(s, STOPS, fix({ lng: degs(65), timestamp: T0 + 30_000 }), T0 + 30_000);
    expect(s.events).toEqual([]);
  });

  it('re-arms moving-away after getting closer again', () => {
    let s = followTick(initFollowState(), STOPS, fix({ lng: degs(55) }), T0);
    s = followTick(s, STOPS, fix({ lng: degs(111), timestamp: T0 + 30_000 }), T0 + 30_000);
    expect(s.events.map((e) => e.kind)).toEqual(['moving_away']);
    // Come back close: returning inside the 100 m band is a fresh approaching.
    s = followTick(s, STOPS, fix({ lng: degs(60), timestamp: T0 + 60_000 }), T0 + 60_000);
    expect(s.events.map((e) => e.kind)).toEqual(['approaching']);
    // Walk away again → once net growth over the window exceeds 20 m, it fires.
    s = followTick(s, STOPS, fix({ lng: degs(135), timestamp: T0 + 90_000 }), T0 + 90_000);
    expect(s.events.map((e) => e.kind)).toEqual(['moving_away']);
  });

  it('never emits moving-away inside the arrived band', () => {
    let s = followTick(initFollowState(), STOPS, fix({ lng: degs(20) }), T0);
    expect(s.events.map((e) => e.kind)).toEqual(['arrived']);
    s = followTick(s, STOPS, fix({ lng: degs(20), timestamp: T0 + 30_000 }), T0 + 30_000);
    expect(s.events).toEqual([]);
  });
});

describe('advanceStop', () => {
  it('moves to the next stop and clears events and distance', () => {
    let s = followTick(initFollowState(), STOPS, fix({ lng: degs(10) }), T0);
    expect(s.events).toHaveLength(1);
    s = advanceStop(s, STOPS);
    expect(s.stopIndex).toBe(1);
    expect(s.events).toEqual([]);
    expect(s.distance).toBeNull();
    // Next measurement targets stop 2.
    s = followTick(s, STOPS, fix({ lng: degs(20) - degs(1112) * 0 + 0 }), T0 + 1000);
    // fix at ~22 m east of origin is ~11100 m from stop 2 at 0.01°… just check it re-measures:
    expect(s.distance).not.toBeNull();
  });

  it('does not advance past the last stop', () => {
    let s = initFollowState();
    s = advanceStop(s, STOPS);
    s = advanceStop(s, STOPS);
    expect(s.stopIndex).toBe(2);
    s = advanceStop(s, STOPS);
    expect(s.stopIndex).toBe(2);
  });
});

describe('constants match the agreed defaults', () => {
  it('uses the alert defaults from the design', () => {
    expect(APPROACHING_M).toBe(100);
    expect(ARRIVED_M).toBe(25);
    expect(MOVING_SPEED_MS).toBeGreaterThan(0);
  });
});

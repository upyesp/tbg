import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { advanceStop, followTick, initFollowState, type GuidanceEvent, type FollowState } from '../../lib/follow-engine';
import type { Fix } from '../../lib/follow-engine';
import { encodePlusCode } from '../../lib/pluscode';
import { formatDirection, formatDistance, guidanceLine, weakSignalLine, whereAmILine } from '../../lib/guidance-text';
import { acquireWakeLock, watchFixes, type WakeLockHandle } from '../../lib/sensors';
import { playEarcon, speak, vibrate } from '../../lib/output';
import { planStore } from '../../lib/sync/store';
import { DEFAULT_LOCALE, speechLang, t } from '../../lib/i18n';
import { useSyncExternalStore } from 'react';

function eventLine(kind: GuidanceEvent['kind'], stopName: string, distance: number | null): string {
  if (kind === 'approaching') {
    return `Approaching ${stopName}.${distance !== null ? ` ${formatDistance(distance)}.` : ''}`;
  }
  if (kind === 'moving_away') {
    return `Moving away from ${stopName}. Check your direction.`;
  }
  return `You have arrived at ${stopName}.`;
}

/** Arrow angle (degrees clockwise from 12 o'clock) for the radar visual. */
function radarAngle(state: FollowState): number {
  if (state.direction === null) return 0;
  if (state.direction.kind === 'clock') return (state.direction.hour % 12) * 30;
  const winds = { north: 0, east: 90, south: 180, west: 270 } as const;
  return winds[state.direction.wind];
}

export function Follow() {
  const { planId } = useParams();
  const plans = useSyncExternalStore(planStore.subscribe, planStore.getSnapshot);
  const plan = plans.find((p) => p.id === planId);

  const [state, setState] = useState<FollowState>(initFollowState);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const stateRef = useRef(state);
  const wasWeakRef = useRef(false);
  const total = plan?.stops.length ?? 0;
  const currentStop = plan?.stops[state.stopIndex];
  const finished = currentStop === undefined || (state.arrived && state.stopIndex === total - 1);

  // Guidance output: announce every new event three ways.
  const announceEvents = (events: GuidanceEvent[], stopName: string, distance: number | null) => {
    for (const event of events) {
      const line = eventLine(event.kind, stopName, distance);
      playEarcon(event.kind);
      vibrate(event.kind);
      speak(line, speechLang(DEFAULT_LOCALE));
      setAnnouncement(line);
    }
  };

  // Watch location while mounted (foreground-only per ADR-0004).
  useEffect(() => {
    if (plan === undefined) return;
    const handle = watchFixes(
      (fix: Fix) => {
        const next = followTick(stateRef.current, plan.stops, fix, Date.now());
        stateRef.current = next;
        setState(next);
        const stop = plan.stops[next.stopIndex];
        if (stop !== undefined && next.events.length > 0) {
          announceEvents(next.events, stop.name, next.distance);
        }
      },
      (message) => setError(message),
    );
    return handle.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  // Announce weak-signal transitions once.
  useEffect(() => {
    if (state.signal === 'weak' && !wasWeakRef.current) {
      const age = state.lastFix !== null ? (Date.now() - state.lastFix.timestamp) / 1000 : 0;
      const line = `${t(DEFAULT_LOCALE, 'weak_signal')} ${weakSignalLine(age)}`;
      speak(line, speechLang(DEFAULT_LOCALE));
      vibrate('info');
      setAnnouncement(line);
    }
    wasWeakRef.current = state.signal === 'weak';
  }, [state.signal, state.lastFix]);

  // Keep the screen awake while following (ADR-0004).
  useEffect(() => {
    let lock: WakeLockHandle | null = null;
    let cancelled = false;
    const acquire = () => {
      void acquireWakeLock().then((l) => {
        if (cancelled) {
          void l?.release();
          return;
        }
        lock = l;
      });
    };
    acquire();
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, []);

  if (plan === undefined) return <Navigate to="/" replace />;

  const repeat = () => {
    if (currentStop === undefined) return;
    const line = guidanceLine(currentStop, state, total);
    playEarcon('info');
    speak(line, speechLang(DEFAULT_LOCALE));
    setAnnouncement(line);
  };

  const whereAmI = () => {
    const fix = state.lastFix;
    if (fix === null) {
      setAnnouncement('No position fix yet.');
      return;
    }
    const code = encodePlusCode(fix.lat, fix.lng);
    const line = whereAmILine(currentStop, code, fix.lat, fix.lng);
    playEarcon('info');
    speak(line, speechLang(DEFAULT_LOCALE));
    setAnnouncement(line);
  };

  const nextStop = () => {
    const next = advanceStop(stateRef.current, plan.stops);
    stateRef.current = next;
    setState(next);
  };

  const directionText = formatDirection(state.direction);
  const fixAgeSeconds =
    state.lastFix !== null ? Math.max(0, Math.round((Date.now() - state.lastFix.timestamp) / 1000)) : null;

  return (
    <main id="main" className="follow">
      <p className="follow-header">
        <Link to="/">{t(DEFAULT_LOCALE, 'back_to_planner')}</Link>
        <span aria-hidden="true"> · </span>
        {plan.name}
      </p>

      {/* Everything spoken is mirrored here for screen readers. */}
      <div aria-live="polite" className="visually-hidden">
        {announcement}
      </div>

      {error !== null && (
        <p role="alert" className="banner">
          {error}
        </p>
      )}

      {state.signal === 'weak' && (
        <p role="status" className="banner warn">
          {t(DEFAULT_LOCALE, 'weak_signal')}
          {fixAgeSeconds !== null && ` ${t(DEFAULT_LOCALE, 'last_fix_seconds_ago')}`}
        </p>
      )}

      {currentStop !== undefined ? (
        <>
          <p className="progress">
            {t(DEFAULT_LOCALE, 'follow_stop_of')} {state.stopIndex + 1} {t(DEFAULT_LOCALE, 'follow_of')}{' '}
            {total}
          </p>

          <h1 className="instruction">{currentStop.name}</h1>

          <p className="detail">
            {state.distance !== null && (
              <>
                {formatDistance(state.distance)}
                {directionText !== null && <> · {directionText}</>}
              </>
            )}
            {state.distance === null && <span className="meta">Waiting for a position fix…</span>}
          </p>

          <svg
            className="radar"
            viewBox="0 0 120 120"
            width="160"
            height="160"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="60" cy="60" r="54" className="radar-ring" />
            <g
              className="radar-arrow"
              style={{ transform: `rotate(${radarAngle(state)}deg)`, transformOrigin: '60px 60px' }}
            >
              <line x1="60" y1="96" x2="60" y2="30" className="radar-needle" />
              <polygon points="60,18 50,38 70,38" className="radar-tip" />
            </g>
          </svg>

          <div className="follow-actions">
            <button type="button" onClick={repeat}>
              {t(DEFAULT_LOCALE, 'repeat_guidance')}
            </button>
            <button type="button" onClick={nextStop}>
              {t(DEFAULT_LOCALE, 'next_stop')}
            </button>
            <button type="button" onClick={whereAmI}>
              {t(DEFAULT_LOCALE, 'where_am_i')}
            </button>
            <Link className="button" to="/">
              {t(DEFAULT_LOCALE, 'end_follow')}
            </Link>
          </div>
        </>
      ) : (
        <p className="instruction">{t(DEFAULT_LOCALE, 'journey_complete')}</p>
      )}

      {finished && currentStop !== undefined && state.arrived && (
        <p role="status" className="banner ok">
          {t(DEFAULT_LOCALE, 'journey_complete')}
        </p>
      )}
    </main>
  );
}

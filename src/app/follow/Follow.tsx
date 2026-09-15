import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useSyncExternalStore } from 'react';
import {
  STALE_MS,
  advanceStop,
  followTick,
  initFollowState,
  type Fix,
  type FollowState,
  type GuidanceEvent,
} from '../../lib/follow-engine';
import { encodePlusCode } from '../../lib/pluscode';
import {
  eventGuidanceLine,
  formatDistance,
  formatDirection,
  guidanceLine,
  weakSignalLine,
  whereAmILine,
} from '../../lib/guidance-text';
import { acquireWakeLock, watchFixes, type WakeLockHandle } from '../../lib/sensors';
import { playEarcon, speak, vibrate } from '../../lib/output';
import { planStore } from '../../lib/sync/store';
import { DEFAULT_LOCALE, dir, speechLang, t } from '../../lib/i18n';

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

  // Every Guidance output goes through one door: earcon + speech + vibration,
  // mirrored into the aria-live region for screen readers.
  const announce = (line: string, kind: GuidanceEvent['kind'] | 'info' = 'info') => {
    playEarcon(kind);
    vibrate(kind);
    speak(line, speechLang(DEFAULT_LOCALE));
    setAnnouncement(line);
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
        for (const event of next.events) {
          if (stop !== undefined) {
            announce(eventGuidanceLine(event.kind, stop.name, next.distance), event.kind);
          }
        }
      },
      (message) => setError(message),
    );
    return handle.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  // Total GPS dropout: no new fixes arrive, so the engine never re-evaluates.
  // Notice staleness from the outside and say so — never stay silently 'ok'.
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = stateRef.current;
      if (s.lastFix === null || s.signal === 'weak') return;
      const ageMs = Date.now() - s.lastFix.timestamp;
      if (ageMs > STALE_MS) {
        const weakState = { ...s, signal: 'weak' as const, weakReason: 'stale' as const };
        stateRef.current = weakState;
        setState(weakState);
        announce(weakSignalLine(ageMs / 1000), 'info');
      }
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Announce weak-signal transitions that the engine itself detected.
  useEffect(() => {
    if (state.signal === 'weak' && !wasWeakRef.current && state.lastFix !== null) {
      announce(weakSignalLine((Date.now() - state.lastFix.timestamp) / 1000));
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
    announce(guidanceLine(currentStop, state, total));
  };

  const whereAmI = () => {
    const fix = state.lastFix;
    if (fix === null) {
      setAnnouncement(t('no_fix_yet'));
      return;
    }
    announce(whereAmILine(currentStop, encodePlusCode(fix.lat, fix.lng), fix.lat, fix.lng));
  };

  const nextStop = () => {
    const next = advanceStop(stateRef.current, plan.stops);
    stateRef.current = next;
    setState(next);
  };

  const directionText = formatDirection(state.direction);
  const fixAgeSeconds =
    state.lastFix !== null ? Math.max(0, Math.round((Date.now() - state.lastFix.timestamp) / 1000)) : null;
  const positionKnown = state.signal === 'ok' && state.distance !== null;

  return (
    <main id="main" className="follow">
      <p className="follow-header">
        <Link to="/">{t('back_to_planner')}</Link>
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
          {t('weak_signal')}
          {fixAgeSeconds !== null && ` ${t('last_fix_ago')} ${fixAgeSeconds} ${t('seconds_ago')}.`}
        </p>
      )}

      {currentStop !== undefined ? (
        <>
          <p className="progress">
            {t('follow_stop_of')} {state.stopIndex + 1} {t('follow_of')} {total}
          </p>

          <h1 className="instruction">{currentStop.name}</h1>

          <p className="detail">
            {positionKnown && directionText !== null && (
              <>
                {formatDistance(state.distance as number)} · {directionText}
              </>
            )}
            {!positionKnown && <span className="meta">{t('waiting_for_fix')}</span>}
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
              {t('repeat_guidance')}
            </button>
            <button type="button" onClick={nextStop}>
              {t('next_stop')}
            </button>
            <button type="button" onClick={whereAmI}>
              {t('where_am_i')}
            </button>
            <Link className="button" to="/">
              {t('end_follow')}
            </Link>
          </div>
        </>
      ) : (
        <p className="instruction">{t('journey_complete')}</p>
      )}

      {currentStop !== undefined && state.arrived && state.stopIndex === total - 1 && (
        <p role="status" className="banner ok">
          {t('journey_complete')}
        </p>
      )}
    </main>
  );
}

import { useState, useSyncExternalStore } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import { makeStop, type ModeOfTravel, type POIType } from '../../lib/domain';
import { MODE_LABELS, planToMarkdown } from '../../lib/export';
import { planStore } from '../../lib/sync/store';
import { POI_CATALOGUE } from '../../data/poi/seed';
import { POI_TAXONOMY, typeLabel } from '../../data/poi/taxonomy';
import { t } from '../../lib/i18n';

const MODES = Object.entries(MODE_LABELS) as [ModeOfTravel, string][];

export function PlanEditor() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const plans = useSyncExternalStore(planStore.subscribe, planStore.getSnapshot);
  const plan = plans.find((p) => p.id === planId);

  const [source, setSource] = useState<'manual' | 'catalogue'>('manual');
  const [poiType, setPoiType] = useState<POIType>('transport');
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [note, setNote] = useState('');


  if (plan === undefined) return <Navigate to="/" replace />;

  const addManualStop = (e: FormEvent) => {
    e.preventDefault();
    const latNum = Number.parseFloat(lat);
    const lngNum = Number.parseFloat(lng);
    if (name.trim() === '' || Number.isNaN(latNum) || Number.isNaN(lngNum)) return;
    planStore.appendStop(
      plan.id,
      makeStop(name.trim(), latNum, lngNum, undefined, note.trim() === '' ? undefined : note.trim()),
    );
    setName('');
    setLat('');
    setLng('');
    setNote('');
  };

  const exportMarkdown = () => {
    const blob = new Blob([planToMarkdown(plan)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const catalogue = POI_CATALOGUE.filter((poi) => poi.poiType === poiType);

  return (
    <main id="main">
      <p>
        <Link to="/">{t('back_to_planner')}</Link>
      </p>
      <h1>{plan.name}</h1>

      <div className="actions">
        {plan.stops.length > 0 && (
          <Link className="button" to={`/follow/${plan.id}`}>
            {t('follow_plan')}
          </Link>
        )}
        <button type="button" onClick={() => planStore.reverse(plan.id)} disabled={plan.stops.length < 2}>
          {t('reverse_plan')}
        </button>
        <button type="button" onClick={exportMarkdown} disabled={plan.stops.length === 0}>
          {t('export_plan')}
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            planStore.remove(plan.id);
            navigate('/');
          }}
        >
          {t('delete_plan')}
        </button>
      </div>

      {plan.stops.length === 0 ? (
        <p>{t('no_plans')}</p>
      ) : (
        <ol className="stop-list" aria-label={t('planner_intro')}>
          {plan.stops.map((stop, i) => (
            <li key={stop.id}>
              <div className="stop-row">
                <div>
                  <strong>{stop.name}</strong>
                  <span className="meta">
                    {' '}
                    {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                  </span>
                  {stop.note !== undefined && <p className="meta">Note: {stop.note}</p>}
                </div>
                <div className="stop-actions">
                  <button
                    type="button"
                    disabled={i === 0}
                    aria-label={`${t('move_up')}: ${stop.name}`}
                    onClick={() => planStore.reorderStop(plan.id, stop.id, i - 1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === plan.stops.length - 1}
                    aria-label={`${t('move_down')}: ${stop.name}`}
                    onClick={() => planStore.reorderStop(plan.id, stop.id, i + 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="danger"
                    aria-label={`${t('remove_stop')}: ${stop.name}`}
                    onClick={() => planStore.deleteStop(plan.id, stop.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {i < plan.legs.length && (
                <div className="leg-mode">
                  <label htmlFor={`leg-${i}`}>{t('mode_of_travel')}</label>
                  <select
                    id={`leg-${i}`}
                    value={plan.legs[i]?.modeOfTravel ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      const legId = plan.legs[i]?.id;
                      if (legId !== undefined && v !== '') {
                        planStore.changeLegMode(plan.id, legId, v as ModeOfTravel);
                      }
                    }}
                  >
                    <option value="">—</option>
                    {MODES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <label htmlFor={`leg-note-${i}`} className="visually-hidden">
                    {t('leg_note')}
                  </label>
                  <input
                    id={`leg-note-${i}`}
                    placeholder={t('leg_note')}
                    value={plan.legs[i]?.note ?? ''}
                    onChange={(e) => {
                      const legId = plan.legs[i]?.id;
                      if (legId !== undefined) planStore.changeLegNote(plan.id, legId, e.target.value);
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <section aria-labelledby="add-stop-heading">
        <h2 id="add-stop-heading">{t('add_stop')}</h2>
        <fieldset>
          <legend className="visually-hidden">{t('add_stop')}</legend>
          <label>
            <input
              type="radio"
              name="stop-source"
              checked={source === 'manual'}
              onChange={() => setSource('manual')}
            />{' '}
            {t('manual_entry')}
          </label>{' '}
          <label>
            <input
              type="radio"
              name="stop-source"
              checked={source === 'catalogue'}
              onChange={() => setSource('catalogue')}
            />{' '}
            {t('from_catalogue')}
          </label>
        </fieldset>

        {source === 'manual' ? (
          <form aria-label={t('add_stop')} onSubmit={addManualStop}>
            <label htmlFor="stop-name">{t('stop_name')}</label>
            <input id="stop-name" value={name} onChange={(e) => setName(e.target.value)} required />
            <label htmlFor="stop-lat">{t('latitude')}</label>
            <input
              id="stop-lat"
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
            />
            <label htmlFor="stop-lng">{t('longitude')}</label>
            <input
              id="stop-lng"
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
            />
            <label htmlFor="stop-note">{t('note')}</label>
            <input id="stop-note" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="submit">{t('add_stop')}</button>
          </form>
        ) : (
          <div>
            <label htmlFor="poi-type">{typeLabel(poiType)}</label>
            <select
              id="poi-type"
              value={poiType}
              onChange={(e) => setPoiType(e.target.value as POIType)}
            >
              {POI_TAXONOMY.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            <ul className="poi-list">
              {catalogue.map((poi) => (
                <li key={poi.id}>
                  <span>
                    {poi.name} <span className="meta">({poi.lat.toFixed(4)}, {poi.lng.toFixed(4)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      planStore.appendStop(plan.id, makeStop(poi.name, poi.lat, poi.lng, poi.id))
                    }
                  >
                    {t('add_stop')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}

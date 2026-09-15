import { useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { planStore } from '../../lib/sync/store';
import { DEFAULT_LOCALE, t } from '../../lib/i18n';

export function Planner() {
  const plans = useSyncExternalStore(planStore.subscribe, planStore.getSnapshot);
  const [name, setName] = useState('');
  const tr = (k: Parameters<typeof t>[1]) => t(DEFAULT_LOCALE, k);

  return (
    <main id="main">
      <h1>{tr('planner_title')}</h1>

      <form
        aria-label={tr('create_plan')}
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (trimmed !== '') {
            planStore.create(trimmed);
            setName('');
          }
        }}
      >
        <label htmlFor="new-plan-name">{tr('plan_name_placeholder')}</label>
        <input
          id="new-plan-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <button type="submit">{tr('create_plan')}</button>
      </form>

      {plans.length === 0 ? (
        <p>{tr('no_plans')}</p>
      ) : (
        <ul className="plan-list" aria-label={tr('planner_intro')}>
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link className="plan-link" to={`/plan/${plan.id}`}>
                {plan.name}
              </Link>
              <span className="meta">
                {plan.stops.length} {tr('stops_count')}
              </span>
              {plan.stops.length > 0 && (
                <Link className="button follow-link" to={`/follow/${plan.id}`}>
                  {tr('follow_plan')}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

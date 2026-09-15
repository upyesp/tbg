import { useState, useSyncExternalStore } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { planStore } from '../../lib/sync/store';
import { t } from '../../lib/i18n';

export function Planner() {
  const plans = useSyncExternalStore(planStore.subscribe, planStore.getSnapshot);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <main id="main">
      <h1>{t('planner_title')}</h1>

      {error !== null && (
        <p role="alert" className="banner warn">
          {error}
        </p>
      )}

      <form
        aria-label={t('create_plan')}
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (trimmed === '') return; // input is required, browser prompts first
          try {
            const plan = planStore.create(trimmed);
            setName('');
            // Clear feedback: the new plan opens straight in its editor.
            navigate(`/plan/${plan.id}`);
          } catch (err) {
            // Never die silently — announce whatever went wrong.
            setError(
              err instanceof Error
                ? `Could not create the plan: ${err.message}`
                : 'Could not create the plan.',
            );
          }
        }}
      >
        <label htmlFor="new-plan-name">{t('plan_name_placeholder')}</label>
        <input
          id="new-plan-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          required
        />
        <button type="submit">{t('create_plan')}</button>
      </form>

      {plans.length === 0 ? (
        <p>{t('no_plans')}</p>
      ) : (
        <ul className="plan-list" aria-label={t('planner_intro')}>
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link className="plan-link" to={`/plan/${plan.id}`}>
                {plan.name}
              </Link>
              <span className="meta">
                {plan.stops.length} {t('stops_count')}
              </span>
              {plan.stops.length > 0 && (
                <Link className="button follow-link" to={`/follow/${plan.id}`}>
                  {t('follow_plan')}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

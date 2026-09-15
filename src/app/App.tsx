import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Planner } from './planner/Planner';
import { PlanEditor } from './planner/PlanEditor';
import { Follow } from './follow/Follow';
import { DEFAULT_LOCALE, dir } from '../lib/i18n';

export function App() {
  // Keep <html> lang/dir in step with the app locale (Arabic is RTL).
  useEffect(() => {
    document.documentElement.lang = DEFAULT_LOCALE;
    document.documentElement.dir = dir(DEFAULT_LOCALE);
  }, []);

  return (
    <HashRouter>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Routes>
        <Route path="/" element={<Planner />} />
        <Route path="/plan/:planId" element={<PlanEditor />} />
        <Route path="/follow/:planId" element={<Follow />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

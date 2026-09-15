import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Planner } from './planner/Planner';
import { PlanEditor } from './planner/PlanEditor';
import { Follow } from './follow/Follow';

export function App() {
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

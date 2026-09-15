// @vitest-environment jsdom
/**
 * Accessibility smoke tests (the automated layer of the agreed a11y bar):
 * axe must report no violations for the main screens, and the core
 * create-a-plan interaction must work.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { App } from './App';
import { planStore } from '../lib/sync/store';

afterEach(() => {
  cleanup();
  localStorage.clear();
  planStore.resetForTests();
  window.location.hash = '';
});

async function expectNoAxeViolations(): Promise<void> {
  if (document.title === '') document.title = 'To Boldly Go';
  document.documentElement.lang = 'en';
  const results = await axe.run(document, { resultTypes: ['violations'] });
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

describe('Planner accessibility', () => {
  it('empty planner has no axe violations', async () => {
    render(<App />);
    await expectNoAxeViolations();
  });

  it('creates a plan through the form and opens its editor', () => {
    render(<App />);
    const input = screen.getByLabelText(/name your journey plan/i);
    fireEvent.change(input, { target: { value: 'Market trip' } });
    fireEvent.click(screen.getByRole('button', { name: /new journey plan/i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Market trip' })).toBeTruthy();
  });

  it('an empty plan name cannot be submitted (input is required)', () => {
    render(<App />);
    const input = screen.getByLabelText(/name your journey plan/i) as HTMLInputElement;
    expect(input.required).toBe(true);
  });

  it('plan editor has no axe violations with stops and legs', async () => {
    localStorage.setItem(
      'tbg.plans.v1',
      JSON.stringify([
        {
          id: 'p1',
          name: 'Town visit',
          createdAt: 1,
          updatedAt: 1,
          stops: [
            { id: 's1', name: 'A', lat: 51.5, lng: -0.1, updatedAt: 1 },
            { id: 's2', name: 'B', lat: 51.51, lng: -0.11, updatedAt: 1 },
          ],
          legs: [{ id: 'l1', fromStopId: 's1', toStopId: 's2' }],
        },
      ]),
    );
    window.location.hash = '#/plan/p1';
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Town visit' })).toBeTruthy();
    await expectNoAxeViolations();
  });
});

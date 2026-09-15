// @vitest-environment jsdom
/**
 * Regression test for the field report "entered a name, pressed the button,
 * nothing happened": on http:// (no secure context) crypto.randomUUID does
 * not exist, and id generation must not throw — the plan must still be
 * created and its editor opened.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { planStore } from '../lib/sync/store';
import { makePlan } from '../lib/domain';

afterEach(() => {
  cleanup();
  localStorage.clear();
  planStore.resetForTests();
  window.location.hash = '';
  // Restore the real crypto in case a test stubbed it.
  const real = globalThis.crypto;
  Object.defineProperty(globalThis, 'crypto', {
    value: real,
    configurable: true,
    writable: true,
  });
});

function withoutRandomUUID(): void {
  // Simulate a browser on http://: crypto exists but has no randomUUID.
  const fake = {
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
      return array;
    },
  };
  Object.defineProperty(globalThis, 'crypto', {
    value: fake,
    configurable: true,
    writable: true,
  });
}

describe('create-a-plan on insecure contexts', () => {
  it('creates a plan and opens the editor without crypto.randomUUID', () => {
    withoutRandomUUID();
    render(<App />);
    const input = screen.getByLabelText(/name your journey plan/i);
    fireEvent.change(input, { target: { value: 'Market trip' } });
    fireEvent.click(screen.getByRole('button', { name: /new journey plan/i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Market trip' })).toBeTruthy();
    // And the id is still collision-safe, not undefined.
    expect(planStore.getSnapshot().length).toBe(1);
  });

  it('domain ids remain unique without crypto.randomUUID', () => {
    withoutRandomUUID();
    const ids = new Set(Array.from({ length: 200 }, () => makePlan('x').id));
    expect(ids.size).toBe(200);
  });
});

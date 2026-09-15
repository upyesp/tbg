/**
 * Journey Plan store — the device's offline copy of the account's plans.
 *
 * Persists to localStorage today. The cloud half (Cognito passkey sign-in +
 * direct DynamoDB access per ADR-0001) plugs into the same SyncAdapter
 * surface; deletions are tombstones so last-write-wins merges stay correct
 * across devices.
 *
 * Storage is read lazily (first snapshot) so embedding contexts — including
 * tests — can seed state before first use. The snapshot handed to React is
 * cached until the underlying data changes, as useSyncExternalStore requires.
 */

import {
  addStop,
  makePlan,
  moveStop,
  removeStop,
  reversePlan,
  setLegMode,
  type JourneyPlan,
  type ModeOfTravel,
  type Stop,
} from '../domain';
import { mergeCollections } from './lww';

const STORAGE_KEY = 'tbg.plans.v1';

function canPersist(): boolean {
  return typeof localStorage !== 'undefined';
}

function load(): JourneyPlan[] {
  if (!canPersist()) return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JourneyPlan[]) : [];
  } catch {
    return [];
  }
}

function save(plans: readonly JourneyPlan[]): void {
  if (canPersist()) localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export class PlanStore {
  private plans: JourneyPlan[] | null = null;
  private visible: JourneyPlan[] = [];
  private listeners = new Set<() => void>();

  private ensure(): JourneyPlan[] {
    if (this.plans === null) {
      this.plans = load();
      this.recomputeVisible();
    }
    return this.plans;
  }

  private recomputeVisible(): void {
    this.visible = (this.plans ?? []).filter((p) => !p.deleted);
  }

  private update(plans: JourneyPlan[]): void {
    this.plans = plans;
    this.recomputeVisible();
    save(plans);
    for (const listener of this.listeners) listener();
  }

  /** Cached, tombstone-free snapshot for React. */
  getSnapshot = (): JourneyPlan[] => {
    this.ensure();
    return this.visible;
  };

  getPlans(): JourneyPlan[] {
    return this.getSnapshot();
  }

  getPlan(id: string): JourneyPlan | undefined {
    return this.getSnapshot().find((p) => p.id === id);
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Drop cached state so the next snapshot reloads storage (test seam). */
  resetForTests(): void {
    this.plans = null;
    this.visible = [];
  }

  /** Merge a remote snapshot (LWW) into the device copy. */
  mergeRemote(remote: readonly JourneyPlan[]): void {
    this.update(mergeCollections(this.ensure(), remote, { dropTombstones: false }));
  }

  create(name: string): JourneyPlan {
    const plan = makePlan(name);
    this.update([...this.ensure(), plan]);
    return plan;
  }

  remove(planId: string): void {
    const now = Date.now();
    this.update(
      this.ensure().map((p) => (p.id === planId ? { ...p, deleted: true, updatedAt: now } : p)),
    );
  }

  rename(planId: string, name: string): void {
    this.update(
      this.ensure().map((p) => (p.id === planId ? { ...p, name, updatedAt: Date.now() } : p)),
    );
  }

  appendStop(planId: string, stop: Stop): void {
    this.update(this.ensure().map((p) => (p.id === planId ? addStop(p, stop) : p)));
  }

  deleteStop(planId: string, stopId: string): void {
    this.update(this.ensure().map((p) => (p.id === planId ? removeStop(p, stopId) : p)));
  }

  reorderStop(planId: string, stopId: string, toIndex: number): void {
    this.update(this.ensure().map((p) => (p.id === planId ? moveStop(p, stopId, toIndex) : p)));
  }

  changeLegMode(planId: string, legId: string, mode: ModeOfTravel): void {
    this.update(this.ensure().map((p) => (p.id === planId ? setLegMode(p, legId, mode) : p)));
  }

  reverse(planId: string): void {
    this.update(this.ensure().map((p) => (p.id === planId ? reversePlan(p) : p)));
  }
}

export const planStore = new PlanStore();

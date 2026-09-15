import { describe, expect, it } from 'vitest';
import { mergeCollections, mergeEntity, type Versioned } from './lww';

interface Doc extends Versioned {
  title: string;
}

const doc = (id: string, title: string, updatedAt: number, deleted = false): Doc => ({
  id,
  title,
  updatedAt,
  ...(deleted ? { deleted: true } : {}),
});

describe('mergeEntity (last-write-wins per entity)', () => {
  it('keeps the newer local edit', () => {
    const local = doc('a', 'from local', 200);
    const remote = doc('a', 'from remote', 100);
    expect(mergeEntity(local, remote)).toEqual(local);
  });

  it('takes the newer remote edit', () => {
    const local = doc('a', 'from local', 100);
    const remote = doc('a', 'from remote', 300);
    expect(mergeEntity(local, remote)).toEqual(remote);
  });

  it('prefers a newer tombstone over an older live edit', () => {
    const local = doc('a', 'live', 100);
    const remote = doc('a', 'gone', 200, true);
    const merged = mergeEntity(local, remote);
    expect(merged?.deleted).toBe(true);
  });

  it('a newer live edit wins over an older tombstone (LWW has no special cases)', () => {
    const local = doc('a', 'edited after delete', 300);
    const remote = doc('a', 'gone', 200, true);
    expect(mergeEntity(local, remote)).toEqual(local);
  });

  it('is deterministic on equal timestamps (remote wins)', () => {
    const local = doc('a', 'from local', 100);
    const remote = doc('a', 'from remote', 100);
    expect(mergeEntity(local, remote)).toEqual(remote);
  });

  it('resuscitates nothing: a live edit never beats a newer tombstone', () => {
    const local = doc('a', 'live', 100);
    const remote = doc('a', 'gone', 400, true);
    expect(mergeEntity(local, remote)?.deleted).toBe(true);
  });
});

describe('mergeCollections', () => {
  it('unions ids from both sides', () => {
    const local = [doc('a', 'A', 10), doc('b', 'B', 10)];
    const remote = [doc('c', 'C', 10)];
    const merged = mergeCollections(local, remote);
    expect(merged.map((d) => d.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('resolves conflicts by last write', () => {
    const local = [doc('a', 'local edit', 500)];
    const remote = [doc('a', 'remote edit', 400)];
    expect(mergeCollections(local, remote)[0]?.title).toBe('local edit');
  });

  it('keeps tombstones by default so deletes propagate', () => {
    const local = [doc('a', 'A', 10)];
    const remote = [doc('a', 'A', 20, true)];
    const merged = mergeCollections(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.deleted).toBe(true);
  });

  it('can drop tombstones for display', () => {
    const local = [doc('a', 'A', 10)];
    const remote = [doc('a', 'A', 20, true), doc('b', 'B', 5)];
    const merged = mergeCollections(local, remote, { dropTombstones: true });
    expect(merged.map((d) => d.id)).toEqual(['b']);
  });
});

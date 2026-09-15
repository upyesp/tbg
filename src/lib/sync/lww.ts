/**
 * Last-write-wins merge, per entity (the agreed conflict rule).
 *
 * An entity carries `updatedAt` (ms epoch). Deletion is a tombstone flag so
 * deletes propagate between devices. Ties are resolved deterministically in
 * favour of the remote copy. There are no special cases: a newer edit always
 * beats an older tombstone, and vice versa.
 */

export interface Versioned {
  id: string;
  updatedAt: number;
  deleted?: boolean | undefined;
}

export function mergeEntity<T extends Versioned>(
  local: T | undefined,
  remote: T | undefined,
): T | undefined {
  if (local === undefined) return remote;
  if (remote === undefined) return local;
  return remote.updatedAt >= local.updatedAt ? remote : local;
}

export function mergeCollections<T extends Versioned>(
  local: readonly T[],
  remote: readonly T[],
  options?: { dropTombstones?: boolean },
): T[] {
  const byId = new Map<string, T>();
  for (const entity of local) byId.set(entity.id, entity);
  for (const entity of remote) {
    const merged = mergeEntity(byId.get(entity.id), entity);
    if (merged !== undefined) byId.set(merged.id, merged);
  }
  const all = [...byId.values()];
  return options?.dropTombstones ? all.filter((e) => !e.deleted) : all;
}

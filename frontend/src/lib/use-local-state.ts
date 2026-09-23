import { useCallback, useSyncExternalStore, type SetStateAction } from "react";

type Store = {
  raw: string | null;
  parsed?: { raw: string | null; value: unknown; validJson: boolean };
  memoryOnly: boolean;
  listeners: Set<() => void>;
};
const stores = new Map<string, Store>();
function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function getStore(key: string) {
  let store = stores.get(key);
  if (!store) {
    store = { raw: read(key), memoryOnly: false, listeners: new Set() };
    stores.set(key, store);
  }
  return store;
}
function parse<T>(
  store: Store,
  raw: string | null,
  fallback: T,
  validate: (value: unknown) => value is T,
): T {
  // Cache only decoding. Validation and fallbacks belong to each subscriber.
  if (!store.parsed || store.parsed.raw !== raw) {
    try {
      store.parsed = { raw, value: JSON.parse(raw ?? "null"), validJson: true };
    } catch {
      store.parsed = { raw, value: undefined, validJson: false };
    }
  }
  try {
    const { value, validJson } = store.parsed;
    return validJson && validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

// JSON-compatible demo preferences. Storage failures fall back to shared memory for this tab.
// Same-tab subscribers and storage events stay in sync; concurrent tabs use last-write-wins.
export function useLocalState<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
) {
  const store = getStore(key);
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!store.listeners.size && !store.memoryOnly) store.raw = read(key);
      store.listeners.add(notify);
      const sync = (event: StorageEvent) => {
        if (event.storageArea && event.storageArea !== localStorage) return;
        if (event.key !== key && event.key !== null) return;
        store.raw = event.key === null ? null : event.newValue;
        store.memoryOnly = false;
        store.listeners.forEach((listener) => listener());
      };
      window.addEventListener("storage", sync);
      return () => {
        store.listeners.delete(notify);
        window.removeEventListener("storage", sync);
      };
    },
    [key, store],
  );
  const raw = useSyncExternalStore(
    subscribe,
    () => store.raw,
    () => null,
  );
  const save = useCallback(
    (action: SetStateAction<T>) => {
      const previous = parse(store, store.raw, fallback, validate);
      const next =
        typeof action === "function"
          ? (action as (value: T) => T)(previous)
          : action;
      const serialized = JSON.stringify(next);
      if (serialized === undefined)
        throw new TypeError("useLocalState requires a JSON-compatible value");
      try {
        localStorage.setItem(key, serialized);
        store.memoryOnly = false;
      } catch {
        store.memoryOnly = true;
      }
      store.raw = serialized;
      store.listeners.forEach((listener) => listener());
    },
    [key, store, fallback, validate],
  );
  return [parse(store, raw, fallback, validate), save] as const;
}

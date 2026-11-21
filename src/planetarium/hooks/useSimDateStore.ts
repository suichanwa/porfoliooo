import { useSyncExternalStore } from "react";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit"
});

const formatEpochMs = (epochMs: number): string =>
  dateFormatter
    .formatToParts(new Date(epochMs))
    .map((part) => part.value)
    .join("");

export interface SimDateStore {
  getSnapshot: () => string;
  set: (epochMs: number) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createSimDateStore(initialEpochMs?: number): SimDateStore {
  let formatted =
    initialEpochMs !== undefined ? formatEpochMs(initialEpochMs) : "--";
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => formatted,
    set: (epochMs: number) => {
      const next = formatEpochMs(epochMs);
      if (next === formatted) return;
      formatted = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}

export function useSimDateLabel(store: SimDateStore): string {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
}

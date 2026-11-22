import { useSyncExternalStore } from "react";

const adDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit",
  timeZone: "UTC"
});

const bcDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit",
  era: "short",
  timeZone: "UTC"
});

const formatEpochMs = (epochMs: number): string => {
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return "--";
  const formatter = date.getUTCFullYear() <= 0 ? bcDateFormatter : adDateFormatter;
  return formatter
    .formatToParts(date)
    .map((part) => part.value)
    .join("");
};

export interface SimDateStore {
  getSnapshot: () => string;
  getEpochMs: () => number;
  set: (epochMs: number) => void;
  requestJump: (epochMs: number) => void;
  onJump: (listener: (epochMs: number) => void) => () => void;
  subscribe: (listener: () => void) => () => void;
}

export function createSimDateStore(initialEpochMs?: number): SimDateStore {
  let currentEpochMs = initialEpochMs ?? Date.now();
  let formatted =
    initialEpochMs !== undefined ? formatEpochMs(initialEpochMs) : "--";
  const listeners = new Set<() => void>();
  const jumpListeners = new Set<(epochMs: number) => void>();

  const updateValue = (epochMs: number) => {
    currentEpochMs = epochMs;
    const next = formatEpochMs(epochMs);
    if (next === formatted) return;
    formatted = next;
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => formatted,
    getEpochMs: () => currentEpochMs,
    set: updateValue,
    requestJump: (epochMs: number) => {
      updateValue(epochMs);
      jumpListeners.forEach((listener) => listener(epochMs));
    },
    onJump: (listener: (epochMs: number) => void) => {
      jumpListeners.add(listener);
      return () => {
        jumpListeners.delete(listener);
      };
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

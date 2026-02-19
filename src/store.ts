import type { SileoOptions, SileoPosition } from "./types";
import {
  DEFAULT_DURATION,
  EXIT_DURATION,
  AUTO_EXPAND_DELAY,
  AUTO_COLLAPSE_DELAY,
} from "./constants";

/* ---------------------------------- Types --------------------------------- */

export interface InternalSileoOptions extends SileoOptions {
  id?: string;
}

export interface SileoItem extends InternalSileoOptions {
  id: string;
  instanceId: string;
  exiting?: boolean;
  autoExpandDelayMs?: number;
  autoCollapseDelayMs?: number;
  position: SileoPosition;
}

export type SileoOffsetValue = number | string;
export type SileoOffsetConfig = Partial<
  Record<"top" | "right" | "bottom" | "left", SileoOffsetValue>
>;

export interface ToasterLike {
  sync(toasts: SileoItem[]): void;
}

/* ------------------------------ Global State ------------------------------ */

export const store = {
  toasts: [] as SileoItem[],
  toaster: null as ToasterLike | null,
  position: "top-right" as SileoPosition,
  options: undefined as Partial<SileoOptions> | undefined,

  emit() {
    this.toaster?.sync(this.toasts);
  },

  update(fn: (prev: SileoItem[]) => SileoItem[]) {
    this.toasts = fn(this.toasts);
    this.emit();
  },
};

let idCounter = 0;
const generateId = () =>
  `${++idCounter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const timeoutKey = (t: SileoItem) => `${t.id}:${t.instanceId}`;

/* ------------------------------- Toast API -------------------------------- */

export const dismissToast = (id: string) => {
  const item = store.toasts.find((t) => t.id === id);
  if (!item || item.exiting) return;

  store.update((prev) =>
    prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
  );

  setTimeout(() => {
    if (store.toasts.some((t) => t.id === id)) {
      store.update((prev) => prev.filter((t) => t.id !== id));
    }
  }, EXIT_DURATION);
};

export const resolveAutopilot = (
  opts: InternalSileoOptions,
  duration: number | null,
): { expandDelayMs?: number; collapseDelayMs?: number } => {
  if (opts.autopilot === false || !duration || duration <= 0) return {};
  const cfg = typeof opts.autopilot === "object" ? opts.autopilot : undefined;
  const clamp = (v: number) => Math.min(duration, Math.max(0, v));
  return {
    expandDelayMs: clamp(cfg?.expand ?? AUTO_EXPAND_DELAY),
    collapseDelayMs: clamp(cfg?.collapse ?? AUTO_COLLAPSE_DELAY),
  };
};

const mergeOptions = (options: InternalSileoOptions) => ({
  ...store.options,
  ...options,
  styles: { ...store.options?.styles, ...options.styles },
});

const buildSileoItem = (
  merged: InternalSileoOptions,
  id: string,
  fallbackPosition?: SileoPosition,
): SileoItem => {
  const duration = merged.duration ?? DEFAULT_DURATION;
  const auto = resolveAutopilot(merged, duration);
  return {
    ...merged,
    id,
    instanceId: generateId(),
    position: merged.position ?? fallbackPosition ?? store.position,
    autoExpandDelayMs: auto.expandDelayMs,
    autoCollapseDelayMs: auto.collapseDelayMs,
  };
};

export const createToast = (options: InternalSileoOptions) => {
  const live = store.toasts.filter((t) => !t.exiting);
  const merged = mergeOptions(options);

  const id = merged.id ?? "sileo-default";
  const prev = live.find((t) => t.id === id);
  const item = buildSileoItem(merged, id, prev?.position);

  if (prev) {
    // 1. Close existing notification
    store.update((p) => p.filter((t) => t.id !== id));
    // 2. Clear all remaining
    store.update(() => []);
    // 3. Create new notification at the new position
    store.update(() => [item]);
  } else if (prev) {
    store.update((p) => p.map((t) => (t.id === id ? item : t)));
  } else {
    store.update((p) => [...p.filter((t) => t.id !== id), item]);
  }
  return { id, duration: merged.duration ?? DEFAULT_DURATION };
};

export const updateToast = (id: string, options: InternalSileoOptions) => {
  const existing = store.toasts.find((t) => t.id === id);
  if (!existing) return;

  const item = buildSileoItem(mergeOptions(options), id, existing.position);
  store.update((prev) => prev.map((t) => (t.id === id ? item : t)));
};

import type { SileoOptions, SileoPosition } from "./types";
import { createToast, dismissToast, store, updateToast } from "./store";
import { Toaster } from "./toaster";

export interface SileoPromiseOptions<T = unknown> {
  loading: Pick<SileoOptions, "title" | "icon">;
  success: SileoOptions | ((data: T) => SileoOptions);
  error: SileoOptions | ((err: unknown) => SileoOptions);
  action?: SileoOptions | ((data: T) => SileoOptions);
  position?: SileoPosition;
}

export interface SileoInitOptions {
  position?: SileoPosition;
  offset?: number | string | Partial<Record<"top" | "right" | "bottom" | "left", number | string>>;
  options?: Partial<SileoOptions>;
}

const ensureInit = () => {
  if (!store.toaster) sileo.init();
};

export const sileo = {
  init: (opts: SileoInitOptions = {}) => {
    if (store.toaster) return;
    store.position = opts.position ?? "top-right";
    store.options = opts.options;
    const toaster = new Toaster(store.position, opts.offset);
    store.toaster = toaster;
  },

  show: (opts: SileoOptions) => { ensureInit(); return createToast({ ...opts, state: opts.state ?? "success" }).id; },
  success: (opts: SileoOptions) => { ensureInit(); return createToast({ ...opts, state: "success" }).id; },
  error: (opts: SileoOptions) => { ensureInit(); return createToast({ ...opts, state: "error" }).id; },
  warning: (opts: SileoOptions) => { ensureInit(); return createToast({ ...opts, state: "warning" }).id; },
  info: (opts: SileoOptions) => { ensureInit(); return createToast({ ...opts, state: "info" }).id; },
  action: (opts: SileoOptions) => { ensureInit(); return createToast({ ...opts, state: "action" }).id; },

  promise: <T,>(
    promise: Promise<T> | (() => Promise<T>),
    opts: SileoPromiseOptions<T>,
  ): Promise<T> => {
    ensureInit();
    const { id } = createToast({
      ...opts.loading,
      state: "loading",
      duration: null,
      position: opts.position,
    });

    const p = typeof promise === "function" ? promise() : promise;

    p.then((data) => {
      if (opts.action) {
        const actionOpts =
          typeof opts.action === "function" ? opts.action(data) : opts.action;
        updateToast(id, { ...actionOpts, state: "action", id });
      } else {
        const successOpts =
          typeof opts.success === "function" ? opts.success(data) : opts.success;
        updateToast(id, { ...successOpts, state: "success", id });
      }
    }).catch((err) => {
      const errorOpts =
        typeof opts.error === "function" ? opts.error(err) : opts.error;
      updateToast(id, { ...errorOpts, state: "error", id });
    });

    return p;
  },

  dismiss: dismissToast,

  clear: (position?: SileoPosition) =>
    store.update((prev) =>
      position ? prev.filter((t) => t.position !== position) : [],
    ),
};

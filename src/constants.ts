import type { SileoPosition } from "./types";

/* --------------------------------- Layout --------------------------------- */

export const HEIGHT = 40;
export const WIDTH = 350;
export const DEFAULT_ROUNDNESS = 18;
export const BLUR_RATIO = 0.5;
export const PILL_PADDING = 10;
export const MIN_EXPAND_RATIO = 2.25;

/* --------------------------------- Timing --------------------------------- */

export const DURATION_MS = 600;
export const DEFAULT_DURATION = 6000;
export const EXIT_DURATION = DEFAULT_DURATION * 0.1;
export const AUTO_EXPAND_DELAY = DEFAULT_DURATION * 0.025;
export const AUTO_COLLAPSE_DELAY = DEFAULT_DURATION - 2000;
export const SWAP_COLLAPSE_MS = 200;
export const HEADER_EXIT_MS = DURATION_MS * 0.7;

/* ---------------------------------- Swipe ---------------------------------- */

export const SWIPE_DISMISS = 30;
export const SWIPE_MAX = 20;

/* --------------------------------- Helpers --------------------------------- */

export const pillAlign = (pos: SileoPosition): "left" | "center" | "right" =>
  pos.includes("right") ? "right" : pos.includes("center") ? "center" : "left";

export const expandDir = (pos: SileoPosition) =>
  pos.startsWith("top") ? ("bottom" as const) : ("top" as const);

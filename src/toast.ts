import type { SileoButton, SileoState, SileoStyles } from "./types";
import { STATE_ICONS } from "./icons";
import { getFilterId } from "./gooey";
import {
  HEIGHT,
  WIDTH,
  DEFAULT_ROUNDNESS,
  BLUR_RATIO,
  PILL_PADDING,
  MIN_EXPAND_RATIO,
  SWAP_COLLAPSE_MS,
  HEADER_EXIT_MS,
  SWIPE_DISMISS,
  SWIPE_MAX,
} from "./constants";

const SVG_NS = "http://www.w3.org/2000/svg";

/* ---------------------------------- Types --------------------------------- */

interface View {
  title: string;
  description?: string | HTMLElement;
  state: SileoState;
  icon?: string | HTMLElement | null;
  styles?: SileoStyles;
  button?: SileoButton;
  fill: string;
  darkFill: string;
}

export interface SileoToastConfig {
  id: string;
  fill?: string;
  darkFill?: string;
  state?: SileoState;
  title?: string;
  description?: string | HTMLElement;
  position?: "left" | "center" | "right";
  expand?: "top" | "bottom";
  icon?: string | HTMLElement | null;
  styles?: SileoStyles;
  button?: SileoButton;
  roundness?: number;
  exiting?: boolean;
  autoExpandDelayMs?: number;
  autoCollapseDelayMs?: number;
  canExpand?: boolean;
  refreshKey?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onDismiss?: () => void;
}

/* ------------------------------- Helpers ---------------------------------- */

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

/**
 * XSS-safe content setter.
 * - `string` → `textContent` (auto-escaped)
 * - `HTMLElement` → cloned and appended
 */
function setContent(
  container: HTMLElement,
  content: string | HTMLElement | undefined | null,
): void {
  container.textContent = "";
  if (content == null) return;
  if (typeof content === "string") {
    container.textContent = content;
  } else {
    container.append(content.cloneNode(true));
  }
}

/**
 * Sets icon content in a badge element.
 * - `null/undefined` → uses default state icon (trusted internal HTML via innerHTML)
 * - `string` → textContent (auto-escaped)
 * - `HTMLElement` → cloned and appended
 */
function setIcon(
  container: HTMLElement,
  icon: string | HTMLElement | null | undefined,
  state: SileoState,
): void {
  container.textContent = "";
  if (icon === null || icon === undefined) {
    // Trusted internal SVG — safe to use innerHTML
    container.innerHTML = STATE_ICONS[state] ?? "";
  } else if (typeof icon === "string") {
    container.textContent = icon;
  } else {
    container.append(icon.cloneNode(true));
  }
}

/* --------------------------------- Class ---------------------------------- */

export class SileoToast {
  /* --- Config --- */
  private id: string;
  private position: "left" | "center" | "right";
  private expand: "top" | "bottom";
  private roundness: number;
  private filterId: string;
  private blur: number;

  /* --- State --- */
  private view: View;
  private applied: string | undefined;
  private isExpanded = false;
  private ready = false;
  private pillWidth = 0;
  private contentHeight = 0;
  private exiting = false;
  private canExpand = true;
  private autoExpandDelayMs?: number;
  private autoCollapseDelayMs?: number;
  private frozenExpanded: number;

  /* --- Header layer --- */
  private headerKey: string;

  /* --- Pending refresh --- */
  private pending: { key?: string; payload: View } | null = null;
  private lastRefreshKey: string | undefined;
  private swapTimer: number | null = null;

  /* --- Timers --- */
  private headerExitTimer: number | null = null;
  private autoExpandTimer: number | null = null;
  private autoCollapseTimer: number | null = null;

  /* --- Swipe --- */
  private pointerStart: number | null = null;

  /* --- Callbacks --- */
  private onMouseEnter?: () => void;
  private onMouseLeave?: () => void;
  private onDismiss?: () => void;

  /* --- DOM nodes --- */
  readonly el: HTMLButtonElement;
  private canvasDiv: HTMLDivElement;
  private svg: SVGSVGElement;
  private pillRect: SVGRectElement;
  private bodyRect: SVGRectElement;
  private headerDiv: HTMLDivElement;
  private headerStack: HTMLDivElement;
  private headerInner: HTMLDivElement;
  private badgeDiv: HTMLDivElement;
  private titleSpan: HTMLSpanElement;
  private prevHeaderInner: HTMLDivElement | null = null;
  private contentDiv: HTMLDivElement | null = null;
  private descriptionDiv: HTMLDivElement | null = null;
  private buttonAnchor: HTMLAnchorElement | null = null;
  private innerRef: HTMLDivElement;

  /* --- Observers & cleanup --- */
  private headerRO: ResizeObserver | null = null;
  private contentRO: ResizeObserver | null = null;
  private headerRafId = 0;
  private contentRafId = 0;
  private headerPad: number | null = null;
  private abortController = new AbortController();

  constructor(config: SileoToastConfig) {
    this.id = config.id;
    this.position = config.position ?? "left";
    this.expand = config.expand ?? "bottom";
    this.roundness = Math.max(0, config.roundness ?? DEFAULT_ROUNDNESS);
    this.blur = this.roundness * BLUR_RATIO;
    this.filterId = getFilterId(this.blur);
    this.exiting = config.exiting ?? false;
    this.canExpand = config.canExpand ?? true;
    this.autoExpandDelayMs = config.autoExpandDelayMs;
    this.autoCollapseDelayMs = config.autoCollapseDelayMs;
    this.lastRefreshKey = config.refreshKey;
    this.applied = config.refreshKey;
    this.onMouseEnter = config.onMouseEnter;
    this.onMouseLeave = config.onMouseLeave;
    this.onDismiss = config.onDismiss;

    const state = config.state ?? "success";
    this.view = {
      title: config.title ?? state,
      description: config.description,
      state,
      icon: config.icon,
      styles: config.styles,
      button: config.button,
      fill: config.fill ?? "#FFFFFF",
      darkFill: config.darkFill ?? "#1C1C1E",
    };

    this.headerKey = `${this.view.state}-${this.view.title}`;
    this.frozenExpanded = HEIGHT * MIN_EXPAND_RATIO;

    /* --- Build DOM --- */
    this.el = this.createRoot();

    this.canvasDiv = document.createElement("div");
    this.canvasDiv.dataset.sileoCanvas = "";
    this.canvasDiv.dataset.edge = this.expand;

    const { svg, pill, body } = this.createSVG();
    this.svg = svg;
    this.pillRect = pill;
    this.bodyRect = body;
    this.canvasDiv.append(this.svg);

    const { header, stack, inner, badge, title } = this.createHeader();
    this.headerDiv = header;
    this.headerStack = stack;
    this.headerInner = inner;
    this.innerRef = inner;
    this.badgeDiv = badge;
    this.titleSpan = title;

    this.el.append(this.canvasDiv, this.headerDiv);

    if (this.hasDesc) {
      this.createContentSection();
    }

    this.applyCSS();
    this.setupResizeObservers();
    this.setupSwipe();
    this.setupEvents();

    requestAnimationFrame(() => {
      this.ready = true;
      this.el.dataset.ready = "true";
      this.scheduleAutoExpandCollapse();
    });
  }

  /* --- Getters --- */

  private get hasDesc(): boolean {
    return Boolean(this.view.description) || Boolean(this.view.button);
  }

  private get isLoading(): boolean {
    return this.view.state === "loading";
  }

  private get open(): boolean {
    return this.hasDesc && this.isExpanded && !this.isLoading;
  }

  private get allowExpand(): boolean {
    return this.isLoading ? false : this.canExpand;
  }

  /* --- DOM creation --- */

  private createRoot(): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.sileoToast = "";
    btn.dataset.ready = "false";
    btn.dataset.expanded = "false";
    btn.dataset.exiting = String(this.exiting);
    btn.dataset.edge = this.expand;
    btn.dataset.position = this.position;
    btn.dataset.state = this.view.state;
    return btn;
  }

  private createSVG() {
    const minExpanded = HEIGHT * MIN_EXPAND_RATIO;
    const svgHeight = this.hasDesc ? Math.max(minExpanded, HEIGHT) : HEIGHT;

    const svg = createSvgElement("svg", {
      width: WIDTH,
      height: svgHeight,
      viewBox: `0 0 ${WIDTH} ${svgHeight}`,
    });
    svg.dataset.sileoSvg = "";

    const titleEl = createSvgElement("title");
    titleEl.textContent = "Sileo Notification";

    // Reference global filter pool instead of per-toast defs
    const g = createSvgElement("g", { filter: `url(#${this.filterId})` });

    const pill = createSvgElement("rect", {
      x: 0,
      rx: this.roundness,
      ry: this.roundness,
    });
    pill.dataset.sileoPill = "";

    const body = createSvgElement("rect", {
      y: HEIGHT,
      width: WIDTH,
      height: 0,
      rx: this.roundness,
      ry: this.roundness,
    });
    body.dataset.sileoBody = "";

    g.append(pill, body);
    svg.append(titleEl, g);

    return { svg, pill, body };
  }

  private createHeader() {
    const header = document.createElement("div");
    header.dataset.sileoHeader = "";
    header.dataset.edge = this.expand;

    const stack = document.createElement("div");
    stack.dataset.sileoHeaderStack = "";

    const inner = document.createElement("div");
    inner.dataset.sileoHeaderInner = "";
    inner.dataset.layer = "current";

    const badge = document.createElement("div");
    badge.dataset.sileoBadge = "";
    badge.dataset.state = this.view.state;
    if (this.view.styles?.badge) badge.className = this.view.styles.badge;
    setIcon(badge, this.view.icon, this.view.state);

    const title = document.createElement("span");
    title.dataset.sileoTitle = "";
    title.dataset.state = this.view.state;
    if (this.view.styles?.title) title.className = this.view.styles.title;
    title.textContent = this.view.title;

    inner.append(badge, title);
    stack.append(inner);
    header.append(stack);

    return { header, stack, inner, badge, title };
  }

  private createContentSection() {
    this.contentDiv = document.createElement("div");
    this.contentDiv.dataset.sileoContent = "";
    this.contentDiv.dataset.edge = this.expand;
    this.contentDiv.dataset.visible = String(this.open);

    this.descriptionDiv = document.createElement("div");
    this.descriptionDiv.dataset.sileoDescription = "";
    if (this.view.styles?.description) {
      this.descriptionDiv.className = this.view.styles.description;
    }
    setContent(this.descriptionDiv, this.view.description);

    if (this.view.button) {
      this.buttonAnchor = this.createButtonAnchor(this.view.button);
      this.descriptionDiv.append(this.buttonAnchor);
    }

    this.contentDiv.append(this.descriptionDiv);
    this.el.append(this.contentDiv);
  }

  private createButtonAnchor(btn: SileoButton): HTMLAnchorElement {
    const a = document.createElement("a");
    a.href = "#";
    a.dataset.sileoButton = "";
    a.dataset.state = this.view.state;
    if (this.view.styles?.button) a.className = this.view.styles.button;
    a.textContent = btn.title;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.onClick();
    }, { signal: this.abortController.signal });
    return a;
  }

  /* --- CSS variable computation --- */

  applyCSS() {
    const minExpanded = HEIGHT * MIN_EXPAND_RATIO;
    const rawExpanded = this.hasDesc
      ? Math.max(minExpanded, HEIGHT + this.contentHeight)
      : minExpanded;

    if (this.open) this.frozenExpanded = rawExpanded;

    const expanded = this.open ? rawExpanded : this.frozenExpanded;
    const svgHeight = this.hasDesc ? Math.max(expanded, minExpanded) : HEIGHT;
    const expandedContent = Math.max(0, expanded - HEIGHT);
    const resolvedPillWidth = Math.max(this.pillWidth || HEIGHT, HEIGHT);
    const pillHeight = HEIGHT + this.blur * 3;

    const pillX =
      this.position === "right"
        ? WIDTH - resolvedPillWidth
        : this.position === "center"
          ? (WIDTH - resolvedPillWidth) / 2
          : 0;

    const s = this.el.style;
    s.setProperty("--_h", `${this.open ? expanded : HEIGHT}px`);
    s.setProperty("--_pw", `${resolvedPillWidth}px`);
    s.setProperty("--_px", `${pillX}px`);
    s.setProperty("--_sy", `${this.open ? 1 : HEIGHT / pillHeight}`);
    s.setProperty("--_ph", `${pillHeight}px`);
    s.setProperty("--_by", `${this.open ? 1 : 0}`);
    s.setProperty(
      "--_ht",
      `translateY(${this.open ? (this.expand === "bottom" ? 3 : -3) : 0}px) scale(${this.open ? 0.9 : 1})`,
    );
    s.setProperty("--_co", `${this.open ? 1 : 0}`);

    s.setProperty("--sileo-fill", this.view.fill);
    s.setProperty("--sileo-dark-fill", this.view.darkFill);

    this.svg.setAttribute("height", String(svgHeight));
    this.svg.setAttribute("viewBox", `0 0 ${WIDTH} ${svgHeight}`);
    this.pillRect.setAttribute("x", String(pillX));
    this.bodyRect.setAttribute("height", String(expandedContent));

    this.el.dataset.expanded = String(this.open);
    this.el.dataset.exiting = String(this.exiting);
    this.el.dataset.state = this.view.state;

    if (this.contentDiv) {
      this.contentDiv.dataset.visible = String(this.open);
    }
  }

  /* --- ResizeObservers --- */

  private setupResizeObservers() {
    const measureHeader = () => {
      if (!this.innerRef || !this.headerDiv) return;
      if (this.headerPad === null) {
        const cs = getComputedStyle(this.headerDiv);
        this.headerPad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      }
      const w = this.innerRef.scrollWidth + this.headerPad + PILL_PADDING;
      if (w > PILL_PADDING && w !== this.pillWidth) {
        this.pillWidth = w;
        this.applyCSS();
      }
    };

    measureHeader();
    this.headerRO = new ResizeObserver(() => {
      cancelAnimationFrame(this.headerRafId);
      this.headerRafId = requestAnimationFrame(measureHeader);
    });
    this.headerRO.observe(this.innerRef);

    if (this.descriptionDiv) {
      const measureContent = () => {
        if (!this.descriptionDiv) return;
        const h = this.descriptionDiv.scrollHeight;
        if (h !== this.contentHeight) {
          this.contentHeight = h;
          this.applyCSS();
        }
      };
      measureContent();
      this.contentRO = new ResizeObserver(() => {
        cancelAnimationFrame(this.contentRafId);
        this.contentRafId = requestAnimationFrame(measureContent);
      });
      this.contentRO.observe(this.descriptionDiv);
    }
  }

  /* --- Swipe-to-dismiss (all listeners use AbortController) --- */

  private setupSwipe() {
    const signal = this.abortController.signal;

    this.el.addEventListener("pointermove", (e: PointerEvent) => {
      if (this.pointerStart === null) return;
      const dy = e.clientY - this.pointerStart;
      const sign = dy > 0 ? 1 : -1;
      const clamped = Math.min(Math.abs(dy), SWIPE_MAX) * sign;
      this.el.style.transform = `translateY(${clamped}px)`;
    }, { passive: true, signal });

    this.el.addEventListener("pointerup", (e: PointerEvent) => {
      if (this.pointerStart === null) return;
      const dy = e.clientY - this.pointerStart;
      this.pointerStart = null;
      this.el.style.transform = "";
      if (Math.abs(dy) > SWIPE_DISMISS) {
        this.onDismiss?.();
      }
    }, { passive: true, signal });

    this.el.addEventListener("pointerdown", (e: PointerEvent) => {
      if (this.exiting || !this.onDismiss) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-sileo-button]")) return;
      this.pointerStart = e.clientY;
      this.el.setPointerCapture(e.pointerId);
    }, { signal });
  }

  /* --- Events (all use AbortController) --- */

  private setupEvents() {
    const signal = this.abortController.signal;

    this.el.addEventListener("mouseenter", () => {
      this.onMouseEnter?.();
      if (this.hasDesc) this.setExpanded(true);
    }, { signal });

    this.el.addEventListener("mouseleave", () => {
      this.onMouseLeave?.();
      this.setExpanded(false);
    }, { signal });

    this.el.addEventListener("transitionend", (e) => {
      if (e.propertyName !== "height" && e.propertyName !== "transform") return;
      if (this.open) return;
      const pending = this.pending;
      if (!pending) return;
      if (this.swapTimer) {
        clearTimeout(this.swapTimer);
        this.swapTimer = null;
      }
      this.applyView(pending.payload);
      this.applied = pending.key;
      this.pending = null;
    }, { signal });
  }

  /* --- Expand/Collapse --- */

  private setExpanded(value: boolean) {
    if (this.isExpanded === value) return;
    this.isExpanded = value;
    this.applyCSS();
  }

  /* --- Auto expand/collapse --- */

  private scheduleAutoExpandCollapse() {
    if (!this.hasDesc) return;

    if (this.autoExpandTimer) clearTimeout(this.autoExpandTimer);
    if (this.autoCollapseTimer) clearTimeout(this.autoCollapseTimer);

    if (this.exiting || !this.allowExpand) {
      this.setExpanded(false);
      return;
    }

    if (this.autoExpandDelayMs == null && this.autoCollapseDelayMs == null) return;

    const expandDelay = this.autoExpandDelayMs ?? 0;
    const collapseDelay = this.autoCollapseDelayMs ?? 0;

    if (expandDelay > 0) {
      this.autoExpandTimer = window.setTimeout(
        () => this.setExpanded(true),
        expandDelay,
      );
    } else {
      this.setExpanded(true);
    }

    if (collapseDelay > 0) {
      this.autoCollapseTimer = window.setTimeout(
        () => this.setExpanded(false),
        collapseDelay,
      );
    }
  }

  /* --- Header layer transitions --- */

  private updateHeaderLayer() {
    const newKey = `${this.view.state}-${this.view.title}`;
    if (this.headerKey === newKey) {
      this.badgeDiv.dataset.state = this.view.state;
      this.badgeDiv.className = this.view.styles?.badge ?? "";
      setIcon(this.badgeDiv, this.view.icon, this.view.state);

      this.titleSpan.dataset.state = this.view.state;
      this.titleSpan.className = this.view.styles?.title ?? "";
      this.titleSpan.textContent = this.view.title;
      return;
    }

    // Animate transition: move current to prev
    if (this.prevHeaderInner) this.prevHeaderInner.remove();

    const oldInner = this.headerInner;
    oldInner.dataset.layer = "prev";
    oldInner.dataset.exiting = "true";
    oldInner.style.position = "absolute";
    oldInner.style.left = "0";
    oldInner.style.top = "0";
    oldInner.style.pointerEvents = "none";
    this.prevHeaderInner = oldInner;

    // Create new current
    const inner = document.createElement("div");
    inner.dataset.sileoHeaderInner = "";
    inner.dataset.layer = "current";

    const badge = document.createElement("div");
    badge.dataset.sileoBadge = "";
    badge.dataset.state = this.view.state;
    badge.className = this.view.styles?.badge ?? "";
    setIcon(badge, this.view.icon, this.view.state);

    const title = document.createElement("span");
    title.dataset.sileoTitle = "";
    title.dataset.state = this.view.state;
    title.className = this.view.styles?.title ?? "";
    title.textContent = this.view.title;

    inner.append(badge, title);
    this.headerStack.append(inner);

    this.headerInner = inner;
    this.innerRef = inner;
    this.badgeDiv = badge;
    this.titleSpan = title;
    this.headerKey = newKey;

    // Re-attach header ResizeObserver
    this.headerPad = null;
    if (this.headerRO) this.headerRO.disconnect();
    const measureHeader = () => {
      if (this.headerPad === null) {
        const cs = getComputedStyle(this.headerDiv);
        this.headerPad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      }
      const w = this.innerRef.scrollWidth + this.headerPad + PILL_PADDING;
      if (w > PILL_PADDING && w !== this.pillWidth) {
        this.pillWidth = w;
        this.applyCSS();
      }
    };
    measureHeader();
    this.headerRO = new ResizeObserver(() => {
      cancelAnimationFrame(this.headerRafId);
      this.headerRafId = requestAnimationFrame(measureHeader);
    });
    this.headerRO.observe(this.innerRef);

    // Remove prev after exit animation
    if (this.headerExitTimer) clearTimeout(this.headerExitTimer);
    this.headerExitTimer = window.setTimeout(() => {
      this.headerExitTimer = null;
      this.prevHeaderInner?.remove();
      this.prevHeaderInner = null;
    }, HEADER_EXIT_MS);
  }

  /* --- Apply a new View --- */

  private applyView(v: View) {
    this.view = v;
    this.updateHeaderLayer();

    if (this.hasDesc && !this.contentDiv) {
      this.createContentSection();
    } else if (!this.hasDesc && this.contentDiv) {
      this.contentDiv.remove();
      this.contentRO?.disconnect();
      this.contentDiv = null;
      this.descriptionDiv = null;
      this.buttonAnchor = null;
      this.contentHeight = 0;
    } else if (this.descriptionDiv) {
      this.descriptionDiv.className = this.view.styles?.description ?? "";
      setContent(this.descriptionDiv, this.view.description);
      if (this.view.button) {
        if (this.buttonAnchor) this.buttonAnchor.remove();
        this.buttonAnchor = this.createButtonAnchor(this.view.button);
        this.descriptionDiv.append(this.buttonAnchor);
      } else if (this.buttonAnchor) {
        this.buttonAnchor.remove();
        this.buttonAnchor = null;
      }
    }

    this.applyCSS();
  }

  /* --- Refresh logic --- */

  update(config: SileoToastConfig) {
    this.onMouseEnter = config.onMouseEnter;
    this.onMouseLeave = config.onMouseLeave;
    this.onDismiss = config.onDismiss;
    this.canExpand = config.canExpand ?? true;
    this.exiting = config.exiting ?? false;
    this.position = config.position ?? "left";
    this.expand = config.expand ?? "bottom";
    this.el.dataset.position = this.position;
    this.el.dataset.edge = this.expand;
    this.canvasDiv.dataset.edge = this.expand;
    this.headerDiv.dataset.edge = this.expand;
    if (this.contentDiv) this.contentDiv.dataset.edge = this.expand;

    const state = config.state ?? "success";
    const next: View = {
      title: config.title ?? state,
      description: config.description,
      state,
      icon: config.icon,
      styles: config.styles,
      button: config.button,
      fill: config.fill ?? "#FFFFFF",
      darkFill: config.darkFill ?? "#1C1C1E",
    };

    const refreshKey = config.refreshKey;

    if (refreshKey === undefined) {
      this.applyView(next);
      this.applied = undefined;
      this.pending = null;
      this.lastRefreshKey = refreshKey;
      this.scheduleAutoExpandCollapse();
      return;
    }

    if (this.lastRefreshKey === refreshKey) {
      this.applyCSS();
      return;
    }
    this.lastRefreshKey = refreshKey;

    if (this.swapTimer) {
      clearTimeout(this.swapTimer);
      this.swapTimer = null;
    }

    if (this.open) {
      this.pending = { key: refreshKey, payload: next };
      this.setExpanded(false);
      this.swapTimer = window.setTimeout(() => {
        this.swapTimer = null;
        const pending = this.pending;
        if (!pending) return;
        this.applyView(pending.payload);
        this.applied = pending.key;
        this.pending = null;
        this.scheduleAutoExpandCollapse();
      }, SWAP_COLLAPSE_MS);
    } else {
      this.pending = null;
      this.applyView(next);
      this.applied = refreshKey;
      this.scheduleAutoExpandCollapse();
    }

    this.autoExpandDelayMs = config.autoExpandDelayMs;
    this.autoCollapseDelayMs = config.autoCollapseDelayMs;
  }

  /* --- Cleanup --- */

  destroy() {
    // Abort all event listeners at once
    this.abortController.abort();

    // Disconnect observers
    if (this.headerRO) this.headerRO.disconnect();
    if (this.contentRO) this.contentRO.disconnect();

    // Cancel animation frames
    cancelAnimationFrame(this.headerRafId);
    cancelAnimationFrame(this.contentRafId);

    // Clear all timers
    if (this.headerExitTimer) clearTimeout(this.headerExitTimer);
    if (this.autoExpandTimer) clearTimeout(this.autoExpandTimer);
    if (this.autoCollapseTimer) clearTimeout(this.autoCollapseTimer);
    if (this.swapTimer) clearTimeout(this.swapTimer);

    // Remove from DOM
    this.el.remove();
  }
}

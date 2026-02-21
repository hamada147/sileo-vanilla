"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  sileo: () => sileo
});
module.exports = __toCommonJS(index_exports);

// src/constants.ts
var HEIGHT = 40;
var WIDTH = 350;
var DEFAULT_ROUNDNESS = 18;
var BLUR_RATIO = 0.5;
var PILL_PADDING = 10;
var MIN_EXPAND_RATIO = 2.25;
var DURATION_MS = 600;
var DEFAULT_DURATION = 6e3;
var EXIT_DURATION = DEFAULT_DURATION * 0.1;
var AUTO_EXPAND_DELAY = DEFAULT_DURATION * 0.025;
var AUTO_COLLAPSE_DELAY = DEFAULT_DURATION - 2e3;
var SWAP_COLLAPSE_MS = 200;
var HEADER_EXIT_MS = DURATION_MS * 0.7;
var SWIPE_DISMISS = 30;
var SWIPE_MAX = 20;
var pillAlign = (pos) => pos.includes("right") ? "right" : pos.includes("center") ? "center" : "left";
var expandDir = (pos) => pos.startsWith("top") ? "bottom" : "top";

// src/store.ts
var store = {
  toasts: [],
  toaster: null,
  position: "top-right",
  options: void 0,
  emit() {
    var _a;
    (_a = this.toaster) == null ? void 0 : _a.sync(this.toasts);
  },
  update(fn) {
    this.toasts = fn(this.toasts);
    this.emit();
  }
};
var idCounter = 0;
var generateId = () => `${++idCounter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
var timeoutKey = (t) => `${t.id}:${t.instanceId}`;
var dismissToast = (id) => {
  const item = store.toasts.find((t) => t.id === id);
  if (!item || item.exiting) return;
  store.update(
    (prev) => prev.map((t) => t.id === id ? __spreadProps(__spreadValues({}, t), { exiting: true }) : t)
  );
  setTimeout(() => {
    if (store.toasts.some((t) => t.id === id)) {
      store.update((prev) => prev.filter((t) => t.id !== id));
    }
  }, EXIT_DURATION);
};
var resolveAutopilot = (opts, duration) => {
  var _a, _b;
  if (opts.autopilot === false || !duration || duration <= 0) return {};
  const cfg = typeof opts.autopilot === "object" ? opts.autopilot : void 0;
  const clamp = (v) => Math.min(duration, Math.max(0, v));
  return {
    expandDelayMs: clamp((_a = cfg == null ? void 0 : cfg.expand) != null ? _a : AUTO_EXPAND_DELAY),
    collapseDelayMs: clamp((_b = cfg == null ? void 0 : cfg.collapse) != null ? _b : AUTO_COLLAPSE_DELAY)
  };
};
var mergeOptions = (options) => {
  var _a;
  return __spreadProps(__spreadValues(__spreadValues({}, store.options), options), {
    styles: __spreadValues(__spreadValues({}, (_a = store.options) == null ? void 0 : _a.styles), options.styles)
  });
};
var buildSileoItem = (merged, id, fallbackPosition) => {
  var _a, _b, _c;
  const duration = (_a = merged.duration) != null ? _a : DEFAULT_DURATION;
  const auto = resolveAutopilot(merged, duration);
  return __spreadProps(__spreadValues({}, merged), {
    id,
    instanceId: generateId(),
    position: (_c = (_b = merged.position) != null ? _b : fallbackPosition) != null ? _c : store.position,
    autoExpandDelayMs: auto.expandDelayMs,
    autoCollapseDelayMs: auto.collapseDelayMs
  });
};
var createToast = (options) => {
  var _a, _b;
  const live = store.toasts.filter((t) => !t.exiting);
  const merged = mergeOptions(options);
  const id = (_a = merged.id) != null ? _a : "sileo-default";
  const prev = live.find((t) => t.id === id);
  const item = buildSileoItem(merged, id, prev == null ? void 0 : prev.position);
  if (prev) {
    store.update((p) => p.filter((t) => t.id !== id));
    store.update(() => []);
    store.update(() => [item]);
  } else if (prev) {
    store.update((p) => p.map((t) => t.id === id ? item : t));
  } else {
    store.update((p) => [...p.filter((t) => t.id !== id), item]);
  }
  return { id, duration: (_b = merged.duration) != null ? _b : DEFAULT_DURATION };
};
var updateToast = (id, options) => {
  const existing = store.toasts.find((t) => t.id === id);
  if (!existing) return;
  const item = buildSileoItem(mergeOptions(options), id, existing.position);
  store.update((prev) => prev.map((t) => t.id === id ? item : t));
};

// src/types.ts
var SILEO_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right"
];

// src/icons.ts
var icon = (title, inner, extra = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${extra}><title>${title}</title>${inner}</svg>`;
var STATE_ICONS = {
  success: icon("Check", '<path d="M20 6 9 17l-5-5"/>'),
  loading: icon(
    "Loader Circle",
    '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    ' data-sileo-icon="spin" aria-hidden="true"'
  ),
  error: icon("X", '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  warning: icon(
    "Circle Alert",
    '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>'
  ),
  info: icon(
    "Life Buoy",
    '<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/>'
  ),
  action: icon(
    "Arrow Right",
    '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'
  )
};

// src/gooey.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var hostSvg = null;
var cache = /* @__PURE__ */ new Map();
function ensureHost() {
  if (hostSvg) return hostSvg;
  hostSvg = document.createElementNS(SVG_NS, "svg");
  hostSvg.setAttribute("aria-hidden", "true");
  hostSvg.setAttribute("data-sileo-filters", "");
  hostSvg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  const defs = document.createElementNS(SVG_NS, "defs");
  hostSvg.append(defs);
  document.body.append(hostSvg);
  return hostSvg;
}
function createFilter(blur) {
  const id = `sileo-gooey-${blur}`;
  const svg = ensureHost();
  const defs = svg.querySelector("defs");
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", id);
  filter.setAttribute("x", "-20%");
  filter.setAttribute("y", "-20%");
  filter.setAttribute("width", "140%");
  filter.setAttribute("height", "140%");
  filter.setAttribute("color-interpolation-filters", "sRGB");
  const feBlur = document.createElementNS(SVG_NS, "feGaussianBlur");
  feBlur.setAttribute("in", "SourceGraphic");
  feBlur.setAttribute("stdDeviation", String(blur));
  feBlur.setAttribute("result", "blur");
  const feMatrix = document.createElementNS(SVG_NS, "feColorMatrix");
  feMatrix.setAttribute("in", "blur");
  feMatrix.setAttribute("mode", "matrix");
  feMatrix.setAttribute("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10");
  feMatrix.setAttribute("result", "goo");
  const feComposite = document.createElementNS(SVG_NS, "feComposite");
  feComposite.setAttribute("in", "SourceGraphic");
  feComposite.setAttribute("in2", "goo");
  feComposite.setAttribute("operator", "atop");
  filter.append(feBlur, feMatrix, feComposite);
  defs.append(filter);
  return id;
}
function getFilterId(blur) {
  let id = cache.get(blur);
  if (id) return id;
  id = createFilter(blur);
  cache.set(blur, id);
  return id;
}

// src/toast.ts
var SVG_NS2 = "http://www.w3.org/2000/svg";
function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS2, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}
function setContent(container, content) {
  container.textContent = "";
  if (content == null) return;
  if (typeof content === "string") {
    container.textContent = content;
  } else {
    container.append(content.cloneNode(true));
  }
}
function setIcon(container, icon2, state) {
  var _a;
  container.textContent = "";
  if (icon2 === null || icon2 === void 0) {
    container.innerHTML = (_a = STATE_ICONS[state]) != null ? _a : "";
  } else if (typeof icon2 === "string") {
    container.textContent = icon2;
  } else {
    container.append(icon2.cloneNode(true));
  }
}
var SileoToast = class {
  constructor(config) {
    this.isExpanded = false;
    this.ready = false;
    this.pillWidth = 0;
    this.contentHeight = 0;
    this.exiting = false;
    this.canExpand = true;
    /* --- Pending refresh --- */
    this.pending = null;
    this.swapTimer = null;
    /* --- Timers --- */
    this.headerExitTimer = null;
    this.autoExpandTimer = null;
    this.autoCollapseTimer = null;
    /* --- Swipe --- */
    this.pointerStart = null;
    this.prevHeaderInner = null;
    this.contentDiv = null;
    this.descriptionDiv = null;
    this.buttonAnchor = null;
    /* --- Observers & cleanup --- */
    this.headerRO = null;
    this.contentRO = null;
    this.headerRafId = 0;
    this.contentRafId = 0;
    this.headerPad = null;
    this.abortController = new AbortController();
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    this.id = config.id;
    this.position = (_a = config.position) != null ? _a : "left";
    this.expand = (_b = config.expand) != null ? _b : "bottom";
    this.roundness = Math.max(0, (_c = config.roundness) != null ? _c : DEFAULT_ROUNDNESS);
    this.blur = this.roundness * BLUR_RATIO;
    this.filterId = getFilterId(this.blur);
    this.exiting = (_d = config.exiting) != null ? _d : false;
    this.canExpand = (_e = config.canExpand) != null ? _e : true;
    this.autoExpandDelayMs = config.autoExpandDelayMs;
    this.autoCollapseDelayMs = config.autoCollapseDelayMs;
    this.lastRefreshKey = config.refreshKey;
    this.applied = config.refreshKey;
    this.onMouseEnter = config.onMouseEnter;
    this.onMouseLeave = config.onMouseLeave;
    this.onDismiss = config.onDismiss;
    const state = (_f = config.state) != null ? _f : "success";
    this.view = {
      title: (_g = config.title) != null ? _g : state,
      description: config.description,
      state,
      icon: config.icon,
      styles: config.styles,
      button: config.button,
      fill: (_h = config.fill) != null ? _h : "#FFFFFF",
      darkFill: (_i = config.darkFill) != null ? _i : "#1C1C1E"
    };
    this.headerKey = `${this.view.state}-${this.view.title}`;
    this.frozenExpanded = HEIGHT * MIN_EXPAND_RATIO;
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
  get hasDesc() {
    return Boolean(this.view.description) || Boolean(this.view.button);
  }
  get isLoading() {
    return this.view.state === "loading";
  }
  get open() {
    return this.hasDesc && this.isExpanded && !this.isLoading;
  }
  get allowExpand() {
    return this.isLoading ? false : this.canExpand;
  }
  /* --- DOM creation --- */
  createRoot() {
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
  createSVG() {
    const minExpanded = HEIGHT * MIN_EXPAND_RATIO;
    const svgHeight = this.hasDesc ? Math.max(minExpanded, HEIGHT) : HEIGHT;
    const svg = createSvgElement("svg", {
      width: WIDTH,
      height: svgHeight,
      viewBox: `0 0 ${WIDTH} ${svgHeight}`
    });
    svg.dataset.sileoSvg = "";
    const titleEl = createSvgElement("title");
    titleEl.textContent = "Sileo Notification";
    const g = createSvgElement("g", { filter: `url(#${this.filterId})` });
    const pill = createSvgElement("rect", {
      x: 0,
      rx: this.roundness,
      ry: this.roundness
    });
    pill.dataset.sileoPill = "";
    const body = createSvgElement("rect", {
      y: HEIGHT,
      width: WIDTH,
      height: 0,
      rx: this.roundness,
      ry: this.roundness
    });
    body.dataset.sileoBody = "";
    g.append(pill, body);
    svg.append(titleEl, g);
    return { svg, pill, body };
  }
  createHeader() {
    var _a, _b;
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
    if ((_a = this.view.styles) == null ? void 0 : _a.badge) badge.className = this.view.styles.badge;
    setIcon(badge, this.view.icon, this.view.state);
    const title = document.createElement("span");
    title.dataset.sileoTitle = "";
    title.dataset.state = this.view.state;
    if ((_b = this.view.styles) == null ? void 0 : _b.title) title.className = this.view.styles.title;
    title.textContent = this.view.title;
    inner.append(badge, title);
    stack.append(inner);
    header.append(stack);
    return { header, stack, inner, badge, title };
  }
  createContentSection() {
    var _a;
    this.contentDiv = document.createElement("div");
    this.contentDiv.dataset.sileoContent = "";
    this.contentDiv.dataset.edge = this.expand;
    this.contentDiv.dataset.visible = String(this.open);
    this.descriptionDiv = document.createElement("div");
    this.descriptionDiv.dataset.sileoDescription = "";
    if ((_a = this.view.styles) == null ? void 0 : _a.description) {
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
  createButtonAnchor(btn) {
    var _a;
    const a = document.createElement("a");
    a.href = "#";
    a.dataset.sileoButton = "";
    a.dataset.state = this.view.state;
    if ((_a = this.view.styles) == null ? void 0 : _a.button) a.className = this.view.styles.button;
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
    const rawExpanded = this.hasDesc ? Math.max(minExpanded, HEIGHT + this.contentHeight) : minExpanded;
    if (this.open) this.frozenExpanded = rawExpanded;
    const expanded = this.open ? rawExpanded : this.frozenExpanded;
    const svgHeight = this.hasDesc ? Math.max(expanded, minExpanded) : HEIGHT;
    const expandedContent = Math.max(0, expanded - HEIGHT);
    const resolvedPillWidth = Math.max(this.pillWidth || HEIGHT, HEIGHT);
    const pillHeight = HEIGHT + this.blur * 3;
    const pillX = this.position === "right" ? WIDTH - resolvedPillWidth : this.position === "center" ? (WIDTH - resolvedPillWidth) / 2 : 0;
    const s = this.el.style;
    s.setProperty("--_h", `${this.open ? expanded : HEIGHT}px`);
    s.setProperty("--_pw", `${resolvedPillWidth}px`);
    s.setProperty("--_px", `${pillX}px`);
    s.setProperty("--_sy", `${this.open ? 1 : HEIGHT / pillHeight}`);
    s.setProperty("--_ph", `${pillHeight}px`);
    s.setProperty("--_by", `${this.open ? 1 : 0}`);
    s.setProperty(
      "--_ht",
      `translateY(${this.open ? this.expand === "bottom" ? 3 : -3 : 0}px) scale(${this.open ? 0.9 : 1})`
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
  setupResizeObservers() {
    const measureHeader = () => {
      if (!this.innerRef || !this.headerDiv) return;
      if (this.headerPad === null || Number.isNaN(this.headerPad)) {
        const cs = getComputedStyle(this.headerDiv);
        const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        if (Number.isNaN(pad)) return;
        this.headerPad = pad;
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
  setupSwipe() {
    const signal = this.abortController.signal;
    this.el.addEventListener("pointermove", (e) => {
      if (this.pointerStart === null) return;
      const dy = e.clientY - this.pointerStart;
      const sign = dy > 0 ? 1 : -1;
      const clamped = Math.min(Math.abs(dy), SWIPE_MAX) * sign;
      this.el.style.transform = `translateY(${clamped}px)`;
    }, { passive: true, signal });
    this.el.addEventListener("pointerup", (e) => {
      var _a;
      if (this.pointerStart === null) return;
      const dy = e.clientY - this.pointerStart;
      this.pointerStart = null;
      this.el.style.transform = "";
      if (Math.abs(dy) > SWIPE_DISMISS) {
        (_a = this.onDismiss) == null ? void 0 : _a.call(this);
      }
    }, { passive: true, signal });
    this.el.addEventListener("pointerdown", (e) => {
      if (this.exiting || !this.onDismiss) return;
      const target = e.target;
      if (target.closest("[data-sileo-button]")) return;
      this.pointerStart = e.clientY;
      this.el.setPointerCapture(e.pointerId);
    }, { signal });
  }
  /* --- Events (all use AbortController) --- */
  setupEvents() {
    const signal = this.abortController.signal;
    this.el.addEventListener("mouseenter", () => {
      var _a;
      (_a = this.onMouseEnter) == null ? void 0 : _a.call(this);
      if (this.hasDesc) this.setExpanded(true);
    }, { signal });
    this.el.addEventListener("mouseleave", () => {
      var _a;
      (_a = this.onMouseLeave) == null ? void 0 : _a.call(this);
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
  setExpanded(value) {
    if (this.isExpanded === value) return;
    this.isExpanded = value;
    this.applyCSS();
  }
  /* --- Auto expand/collapse --- */
  scheduleAutoExpandCollapse() {
    var _a, _b;
    if (!this.hasDesc) return;
    if (this.autoExpandTimer) clearTimeout(this.autoExpandTimer);
    if (this.autoCollapseTimer) clearTimeout(this.autoCollapseTimer);
    if (this.exiting || !this.allowExpand) {
      this.setExpanded(false);
      return;
    }
    if (this.autoExpandDelayMs == null && this.autoCollapseDelayMs == null) return;
    const expandDelay = (_a = this.autoExpandDelayMs) != null ? _a : 0;
    const collapseDelay = (_b = this.autoCollapseDelayMs) != null ? _b : 0;
    if (expandDelay > 0) {
      this.autoExpandTimer = window.setTimeout(
        () => this.setExpanded(true),
        expandDelay
      );
    } else {
      this.setExpanded(true);
    }
    if (collapseDelay > 0) {
      this.autoCollapseTimer = window.setTimeout(
        () => this.setExpanded(false),
        collapseDelay
      );
    }
  }
  /* --- Header layer transitions --- */
  updateHeaderLayer() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const newKey = `${this.view.state}-${this.view.title}`;
    if (this.headerKey === newKey) {
      this.badgeDiv.dataset.state = this.view.state;
      this.badgeDiv.className = (_b = (_a = this.view.styles) == null ? void 0 : _a.badge) != null ? _b : "";
      setIcon(this.badgeDiv, this.view.icon, this.view.state);
      this.titleSpan.dataset.state = this.view.state;
      this.titleSpan.className = (_d = (_c = this.view.styles) == null ? void 0 : _c.title) != null ? _d : "";
      this.titleSpan.textContent = this.view.title;
      return;
    }
    if (this.prevHeaderInner) this.prevHeaderInner.remove();
    const oldInner = this.headerInner;
    oldInner.dataset.layer = "prev";
    oldInner.dataset.exiting = "true";
    oldInner.style.position = "absolute";
    oldInner.style.left = "0";
    oldInner.style.top = "0";
    oldInner.style.pointerEvents = "none";
    this.prevHeaderInner = oldInner;
    const inner = document.createElement("div");
    inner.dataset.sileoHeaderInner = "";
    inner.dataset.layer = "current";
    const badge = document.createElement("div");
    badge.dataset.sileoBadge = "";
    badge.dataset.state = this.view.state;
    badge.className = (_f = (_e = this.view.styles) == null ? void 0 : _e.badge) != null ? _f : "";
    setIcon(badge, this.view.icon, this.view.state);
    const title = document.createElement("span");
    title.dataset.sileoTitle = "";
    title.dataset.state = this.view.state;
    title.className = (_h = (_g = this.view.styles) == null ? void 0 : _g.title) != null ? _h : "";
    title.textContent = this.view.title;
    inner.append(badge, title);
    this.headerStack.append(inner);
    this.headerInner = inner;
    this.innerRef = inner;
    this.badgeDiv = badge;
    this.titleSpan = title;
    this.headerKey = newKey;
    this.headerPad = null;
    if (this.headerRO) this.headerRO.disconnect();
    const measureHeader = () => {
      if (this.headerPad === null || Number.isNaN(this.headerPad)) {
        const cs = getComputedStyle(this.headerDiv);
        const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        if (Number.isNaN(pad)) return;
        this.headerPad = pad;
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
    if (this.headerExitTimer) clearTimeout(this.headerExitTimer);
    this.headerExitTimer = window.setTimeout(() => {
      var _a2;
      this.headerExitTimer = null;
      (_a2 = this.prevHeaderInner) == null ? void 0 : _a2.remove();
      this.prevHeaderInner = null;
    }, HEADER_EXIT_MS);
  }
  /* --- Apply a new View --- */
  applyView(v) {
    var _a, _b, _c;
    this.view = v;
    this.updateHeaderLayer();
    if (this.hasDesc && !this.contentDiv) {
      this.createContentSection();
    } else if (!this.hasDesc && this.contentDiv) {
      this.contentDiv.remove();
      (_a = this.contentRO) == null ? void 0 : _a.disconnect();
      this.contentDiv = null;
      this.descriptionDiv = null;
      this.buttonAnchor = null;
      this.contentHeight = 0;
    } else if (this.descriptionDiv) {
      this.descriptionDiv.className = (_c = (_b = this.view.styles) == null ? void 0 : _b.description) != null ? _c : "";
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
  update(config) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    this.onMouseEnter = config.onMouseEnter;
    this.onMouseLeave = config.onMouseLeave;
    this.onDismiss = config.onDismiss;
    this.canExpand = (_a = config.canExpand) != null ? _a : true;
    this.exiting = (_b = config.exiting) != null ? _b : false;
    this.position = (_c = config.position) != null ? _c : "left";
    this.expand = (_d = config.expand) != null ? _d : "bottom";
    this.el.dataset.position = this.position;
    this.el.dataset.edge = this.expand;
    this.canvasDiv.dataset.edge = this.expand;
    this.headerDiv.dataset.edge = this.expand;
    if (this.contentDiv) this.contentDiv.dataset.edge = this.expand;
    const state = (_e = config.state) != null ? _e : "success";
    const next = {
      title: (_f = config.title) != null ? _f : state,
      description: config.description,
      state,
      icon: config.icon,
      styles: config.styles,
      button: config.button,
      fill: (_g = config.fill) != null ? _g : "#FFFFFF",
      darkFill: (_h = config.darkFill) != null ? _h : "#1C1C1E"
    };
    const refreshKey = config.refreshKey;
    if (refreshKey === void 0) {
      this.applyView(next);
      this.applied = void 0;
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
    this.abortController.abort();
    if (this.headerRO) this.headerRO.disconnect();
    if (this.contentRO) this.contentRO.disconnect();
    cancelAnimationFrame(this.headerRafId);
    cancelAnimationFrame(this.contentRafId);
    if (this.headerExitTimer) clearTimeout(this.headerExitTimer);
    if (this.autoExpandTimer) clearTimeout(this.autoExpandTimer);
    if (this.autoCollapseTimer) clearTimeout(this.autoCollapseTimer);
    if (this.swapTimer) clearTimeout(this.swapTimer);
    this.el.remove();
  }
};

// src/toaster.ts
var Toaster = class {
  constructor(position = "top-right", offset) {
    this.viewports = /* @__PURE__ */ new Map();
    this.instances = /* @__PURE__ */ new Map();
    this.timers = /* @__PURE__ */ new Map();
    this.hovering = false;
    this.currentToasts = [];
    this.position = position;
    this.offset = offset;
  }
  /* --- Main sync --- */
  sync(toasts) {
    var _a;
    this.currentToasts = toasts;
    let latest;
    for (let i = toasts.length - 1; i >= 0; i--) {
      if (!toasts[i].exiting) {
        latest = toasts[i].id;
        break;
      }
    }
    this.latestId = latest;
    if (this.activeId === void 0 || !toasts.find((t) => t.id === this.activeId)) {
      this.activeId = latest;
    }
    const currentIds = new Set(toasts.map((t) => t.id));
    const currentKeys = new Set(toasts.map(timeoutKey));
    for (const [key, timer] of this.timers) {
      if (!currentKeys.has(key)) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }
    for (const [id, instance] of this.instances) {
      if (!currentIds.has(id)) {
        instance.destroy();
        this.instances.delete(id);
      }
    }
    const byPosition = /* @__PURE__ */ new Map();
    for (const t of toasts) {
      const pos = (_a = t.position) != null ? _a : this.position;
      let arr = byPosition.get(pos);
      if (!arr) {
        arr = [];
        byPosition.set(pos, arr);
      }
      arr.push(t);
    }
    for (const [pos, viewport] of this.viewports) {
      if (!byPosition.has(pos)) {
        viewport.remove();
        this.viewports.delete(pos);
      }
    }
    for (const pos of SILEO_POSITIONS) {
      const items = byPosition.get(pos);
      if (!(items == null ? void 0 : items.length)) continue;
      const viewport = this.ensureViewport(pos);
      for (const item of items) {
        const config = this.buildToastConfig(item);
        let instance = this.instances.get(item.id);
        if (instance && instance.el.parentElement !== viewport) {
          instance.destroy();
          instance = void 0;
        }
        if (instance) {
          instance.update(config);
        } else {
          instance = new SileoToast(config);
          this.instances.set(item.id, instance);
          viewport.append(instance.el);
        }
      }
    }
    this.scheduleTimers(toasts);
  }
  /* --- Viewport management --- */
  ensureViewport(pos) {
    let vp = this.viewports.get(pos);
    if (vp) return vp;
    vp = document.createElement("section");
    vp.dataset.sileoViewport = "";
    vp.dataset.position = pos;
    vp.setAttribute("aria-live", "polite");
    const style = this.getViewportStyle(pos);
    if (style) Object.assign(vp.style, style);
    document.body.append(vp);
    this.viewports.set(pos, vp);
    return vp;
  }
  getViewportStyle(pos) {
    if (this.offset === void 0) return null;
    const o = typeof this.offset === "object" && !Array.isArray(this.offset) ? this.offset : { top: this.offset, right: this.offset, bottom: this.offset, left: this.offset };
    const s = {};
    const px = (v) => typeof v === "number" ? `${v}px` : String(v);
    if (pos.startsWith("top") && o.top != null) s.top = px(o.top);
    if (pos.startsWith("bottom") && o.bottom != null) s.bottom = px(o.bottom);
    if (pos.endsWith("left") && o.left != null) s.left = px(o.left);
    if (pos.endsWith("right") && o.right != null) s.right = px(o.right);
    return Object.keys(s).length ? s : null;
  }
  /* --- Timer management --- */
  scheduleTimers(toasts) {
    var _a;
    if (this.hovering) return;
    for (const item of toasts) {
      if (item.exiting) continue;
      const key = timeoutKey(item);
      if (this.timers.has(key)) continue;
      const dur = (_a = item.duration) != null ? _a : DEFAULT_DURATION;
      if (dur === null || dur <= 0) continue;
      this.timers.set(
        key,
        window.setTimeout(() => dismissToast(item.id), dur)
      );
    }
  }
  clearAllTimers() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }
  /* --- Config builder --- */
  buildToastConfig(item) {
    return {
      id: item.id,
      state: item.state,
      title: item.title,
      description: item.description,
      position: pillAlign(item.position),
      expand: expandDir(item.position),
      icon: item.icon,
      fill: item.fill,
      darkFill: item.darkFill,
      styles: item.styles,
      button: item.button,
      roundness: item.roundness,
      exiting: item.exiting,
      autoExpandDelayMs: item.autoExpandDelayMs,
      autoCollapseDelayMs: item.autoCollapseDelayMs,
      refreshKey: item.instanceId,
      canExpand: this.activeId === void 0 || this.activeId === item.id,
      onMouseEnter: () => this.handleMouseEnter(item.id),
      onMouseLeave: () => this.handleMouseLeave(item.id),
      onDismiss: () => dismissToast(item.id)
    };
  }
  /* --- Hover management --- */
  handleMouseEnter(toastId) {
    this.activeId = toastId;
    if (this.hovering) return;
    this.hovering = true;
    this.clearAllTimers();
    this.refreshCanExpand();
  }
  handleMouseLeave(_toastId) {
    this.activeId = this.latestId;
    if (!this.hovering) return;
    this.hovering = false;
    this.scheduleTimers(this.currentToasts);
    this.refreshCanExpand();
  }
  refreshCanExpand() {
    for (const [id, instance] of this.instances) {
      const item = this.currentToasts.find((t) => t.id === id);
      if (!item) continue;
      instance.update(this.buildToastConfig(item));
    }
  }
  /* --- Cleanup --- */
  destroy() {
    this.clearAllTimers();
    for (const instance of this.instances.values()) instance.destroy();
    this.instances.clear();
    for (const vp of this.viewports.values()) vp.remove();
    this.viewports.clear();
  }
};

// src/api.ts
var ensureInit = () => {
  if (!store.toaster) sileo.init();
};
var sileo = {
  init: (opts = {}) => {
    var _a;
    if (store.toaster) return;
    store.position = (_a = opts.position) != null ? _a : "top-right";
    store.options = opts.options;
    const toaster = new Toaster(store.position, opts.offset);
    store.toaster = toaster;
  },
  show: (opts) => {
    var _a;
    ensureInit();
    return createToast(__spreadProps(__spreadValues({}, opts), { state: (_a = opts.state) != null ? _a : "success" })).id;
  },
  success: (opts) => {
    ensureInit();
    return createToast(__spreadProps(__spreadValues({}, opts), { state: "success" })).id;
  },
  error: (opts) => {
    ensureInit();
    return createToast(__spreadProps(__spreadValues({}, opts), { state: "error" })).id;
  },
  warning: (opts) => {
    ensureInit();
    return createToast(__spreadProps(__spreadValues({}, opts), { state: "warning" })).id;
  },
  info: (opts) => {
    ensureInit();
    return createToast(__spreadProps(__spreadValues({}, opts), { state: "info" })).id;
  },
  action: (opts) => {
    ensureInit();
    return createToast(__spreadProps(__spreadValues({}, opts), { state: "action" })).id;
  },
  promise: (promise, opts) => {
    ensureInit();
    const { id } = createToast(__spreadProps(__spreadValues({}, opts.loading), {
      state: "loading",
      duration: null,
      position: opts.position
    }));
    const p = typeof promise === "function" ? promise() : promise;
    p.then((data) => {
      if (opts.action) {
        const actionOpts = typeof opts.action === "function" ? opts.action(data) : opts.action;
        updateToast(id, __spreadProps(__spreadValues({}, actionOpts), { state: "action", id }));
      } else {
        const successOpts = typeof opts.success === "function" ? opts.success(data) : opts.success;
        updateToast(id, __spreadProps(__spreadValues({}, successOpts), { state: "success", id }));
      }
    }).catch((err) => {
      const errorOpts = typeof opts.error === "function" ? opts.error(err) : opts.error;
      updateToast(id, __spreadProps(__spreadValues({}, errorOpts), { state: "error", id }));
    });
    return p;
  },
  dismiss: dismissToast,
  clear: (position) => store.update(
    (prev) => position ? prev.filter((t) => t.position !== position) : []
  )
};
//# sourceMappingURL=sileo.cjs.map

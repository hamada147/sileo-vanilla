import {
  SILEO_POSITIONS,
  type SileoPosition,
} from "./types";
import {
  type SileoItem,
  type SileoOffsetConfig,
  type SileoOffsetValue,
  type ToasterLike,
  DEFAULT_DURATION,
  dismissToast,
  pillAlign,
  expandDir,
  timeoutKey,
} from "./store";
import { SileoToast } from "./toast";

export class Toaster implements ToasterLike {
  private position: SileoPosition;
  private offset?: SileoOffsetValue | SileoOffsetConfig;
  private viewports = new Map<SileoPosition, HTMLElement>();
  private instances = new Map<string, SileoToast>();
  private timers = new Map<string, number>();
  private hovering = false;
  private activeId: string | undefined;
  private latestId: string | undefined;
  private currentToasts: SileoItem[] = [];

  constructor(
    position: SileoPosition = "top-right",
    offset?: SileoOffsetValue | SileoOffsetConfig,
  ) {
    this.position = position;
    this.offset = offset;
  }

  /* --- Main sync --- */

  sync(toasts: SileoItem[]) {
    this.currentToasts = toasts;

    // Compute latest non-exiting toast
    let latest: string | undefined;
    for (let i = toasts.length - 1; i >= 0; i--) {
      if (!toasts[i].exiting) {
        latest = toasts[i].id;
        break;
      }
    }
    this.latestId = latest;
    if (this.activeId === undefined || !toasts.find((t) => t.id === this.activeId)) {
      this.activeId = latest;
    }

    const currentIds = new Set(toasts.map((t) => t.id));
    const currentKeys = new Set(toasts.map(timeoutKey));

    // Remove stale timers
    for (const [key, timer] of this.timers) {
      if (!currentKeys.has(key)) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }

    // Remove instances no longer in the list
    for (const [id, instance] of this.instances) {
      if (!currentIds.has(id)) {
        instance.destroy();
        this.instances.delete(id);
      }
    }

    // Group by position
    const byPosition = new Map<SileoPosition, SileoItem[]>();
    for (const t of toasts) {
      const pos = t.position ?? this.position;
      let arr = byPosition.get(pos);
      if (!arr) {
        arr = [];
        byPosition.set(pos, arr);
      }
      arr.push(t);
    }

    // Remove empty viewports
    for (const [pos, viewport] of this.viewports) {
      if (!byPosition.has(pos)) {
        viewport.remove();
        this.viewports.delete(pos);
      }
    }

    // Create/update toasts
    for (const pos of SILEO_POSITIONS) {
      const items = byPosition.get(pos);
      if (!items?.length) continue;

      const viewport = this.ensureViewport(pos);

      for (const item of items) {
        const config = this.buildToastConfig(item);
        let instance = this.instances.get(item.id);
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

  private ensureViewport(pos: SileoPosition): HTMLElement {
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

  private getViewportStyle(pos: SileoPosition): Record<string, string> | null {
    if (this.offset === undefined) return null;

    const o: SileoOffsetConfig =
      typeof this.offset === "object" && !Array.isArray(this.offset)
        ? this.offset
        : { top: this.offset as SileoOffsetValue, right: this.offset as SileoOffsetValue, bottom: this.offset as SileoOffsetValue, left: this.offset as SileoOffsetValue };

    const s: Record<string, string> = {};
    const px = (v: SileoOffsetValue) => (typeof v === "number" ? `${v}px` : String(v));

    if (pos.startsWith("top") && o.top != null) s.top = px(o.top);
    if (pos.startsWith("bottom") && o.bottom != null) s.bottom = px(o.bottom);
    if (pos.endsWith("left") && o.left != null) s.left = px(o.left);
    if (pos.endsWith("right") && o.right != null) s.right = px(o.right);

    return Object.keys(s).length ? s : null;
  }

  /* --- Timer management --- */

  private scheduleTimers(toasts: SileoItem[]) {
    if (this.hovering) return;

    for (const item of toasts) {
      if (item.exiting) continue;
      const key = timeoutKey(item);
      if (this.timers.has(key)) continue;

      const dur = item.duration ?? DEFAULT_DURATION;
      if (dur === null || dur <= 0) continue;

      this.timers.set(
        key,
        window.setTimeout(() => dismissToast(item.id), dur),
      );
    }
  }

  private clearAllTimers() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }

  /* --- Config builder --- */

  private buildToastConfig(item: SileoItem) {
    return {
      id: item.id,
      state: item.state,
      title: item.title,
      description: item.description,
      position: pillAlign(item.position),
      expand: expandDir(item.position),
      icon: item.icon,
      fill: item.fill,
      styles: item.styles,
      button: item.button,
      roundness: item.roundness,
      exiting: item.exiting,
      autoExpandDelayMs: item.autoExpandDelayMs,
      autoCollapseDelayMs: item.autoCollapseDelayMs,
      refreshKey: item.instanceId,
      canExpand: this.activeId === undefined || this.activeId === item.id,
      onMouseEnter: () => this.handleMouseEnter(item.id),
      onMouseLeave: () => this.handleMouseLeave(item.id),
      onDismiss: () => dismissToast(item.id),
    };
  }

  /* --- Hover management --- */

  private handleMouseEnter(toastId: string) {
    this.activeId = toastId;
    if (this.hovering) return;
    this.hovering = true;
    this.clearAllTimers();
    this.refreshCanExpand();
  }

  private handleMouseLeave(_toastId: string) {
    this.activeId = this.latestId;
    if (!this.hovering) return;
    this.hovering = false;
    this.scheduleTimers(this.currentToasts);
    this.refreshCanExpand();
  }

  private refreshCanExpand() {
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
}

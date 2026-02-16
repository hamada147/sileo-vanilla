import { type SileoPosition } from "./types";
import { type SileoItem, type SileoOffsetConfig, type SileoOffsetValue, type ToasterLike } from "./store";
export declare class Toaster implements ToasterLike {
    private position;
    private offset?;
    private viewports;
    private instances;
    private timers;
    private hovering;
    private activeId;
    private latestId;
    private currentToasts;
    constructor(position?: SileoPosition, offset?: SileoOffsetValue | SileoOffsetConfig);
    sync(toasts: SileoItem[]): void;
    private ensureViewport;
    private getViewportStyle;
    private scheduleTimers;
    private clearAllTimers;
    private buildToastConfig;
    private handleMouseEnter;
    private handleMouseLeave;
    private refreshCanExpand;
    destroy(): void;
}
//# sourceMappingURL=toaster.d.ts.map
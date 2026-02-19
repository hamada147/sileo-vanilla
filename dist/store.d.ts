import type { SileoOptions, SileoPosition } from "./types";
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
export type SileoOffsetConfig = Partial<Record<"top" | "right" | "bottom" | "left", SileoOffsetValue>>;
export interface ToasterLike {
    sync(toasts: SileoItem[]): void;
}
export declare const store: {
    toasts: SileoItem[];
    toaster: ToasterLike | null;
    position: SileoPosition;
    options: Partial<SileoOptions> | undefined;
    emit(): void;
    update(fn: (prev: SileoItem[]) => SileoItem[]): void;
};
export declare const timeoutKey: (t: SileoItem) => string;
export declare const dismissToast: (id: string) => void;
export declare const resolveAutopilot: (opts: InternalSileoOptions, duration: number | null) => {
    expandDelayMs?: number;
    collapseDelayMs?: number;
};
export declare const createToast: (options: InternalSileoOptions) => {
    id: string;
    duration: number;
};
export declare const updateToast: (id: string, options: InternalSileoOptions) => void;
//# sourceMappingURL=store.d.ts.map
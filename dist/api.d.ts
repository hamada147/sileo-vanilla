import type { SileoOptions, SileoPosition } from "./types";
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
export declare const sileo: {
    init: (opts?: SileoInitOptions) => void;
    show: (opts: SileoOptions) => string;
    success: (opts: SileoOptions) => string;
    error: (opts: SileoOptions) => string;
    warning: (opts: SileoOptions) => string;
    info: (opts: SileoOptions) => string;
    action: (opts: SileoOptions) => string;
    promise: <T>(promise: Promise<T> | (() => Promise<T>), opts: SileoPromiseOptions<T>) => Promise<T>;
    dismiss: (id: string) => void;
    clear: (position?: SileoPosition) => void;
};
//# sourceMappingURL=api.d.ts.map
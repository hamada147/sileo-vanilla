export type SileoState = "success" | "loading" | "error" | "warning" | "info" | "action";
export interface SileoStyles {
    title?: string;
    description?: string;
    badge?: string;
    button?: string;
}
export interface SileoButton {
    title: string;
    onClick: () => void;
}
export declare const SILEO_POSITIONS: readonly ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
export type SileoPosition = (typeof SILEO_POSITIONS)[number];
/**
 * Options for creating a toast notification.
 *
 * Content safety:
 * - `description` as `string` -> rendered via `textContent` (XSS-safe, auto-escaped)
 * - `description` as `HTMLElement` -> appended directly (developer controls content)
 * - `icon` as `string` -> rendered via `textContent` (plain text only)
 * - `icon` as `HTMLElement` -> appended directly (e.g. custom SVG element)
 */
export interface SileoOptions {
    title?: string;
    description?: string | HTMLElement;
    position?: SileoPosition;
    duration?: number | null;
    icon?: string | HTMLElement | null;
    styles?: SileoStyles;
    fill?: string;
    roundness?: number;
    autopilot?: boolean | {
        expand?: number;
        collapse?: number;
    };
    button?: SileoButton;
}
//# sourceMappingURL=types.d.ts.map
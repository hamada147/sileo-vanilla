const icon = (title: string, inner: string, extra = ""): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${extra}><title>${title}</title>${inner}</svg>`;

export const STATE_ICONS: Record<string, string> = {
  success: icon("Check", '<path d="M20 6 9 17l-5-5"/>'),
  loading: icon(
    "Loader Circle",
    '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    ' data-sileo-icon="spin" aria-hidden="true"',
  ),
  error: icon("X", '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  warning: icon(
    "Circle Alert",
    '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  ),
  info: icon(
    "Life Buoy",
    '<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/>',
  ),
  action: icon(
    "Arrow Right",
    '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  ),
};

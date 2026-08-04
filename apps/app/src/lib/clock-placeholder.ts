/**
 * Replace [[clock hour=H minute=M]] shortcodes with an <img> tag pointing to
 * the clock renderer. Used as a fallback during PDF/thumbnail generation when
 * the placeholder leaks into the serialized HTML.
 */
export function replaceClockPlaceholders(value: string) {
  return value.replace(
    /\[\[clock\s+hour=(\d+)\s+minute=(\d+)\s*\]\]/g,
    (_match, hour, minute) => (
      `<img alt="" aria-hidden="true" class="custom-block__clock" src="/api/time-clock?hour=${hour}&minute=${minute}" />`
    ),
  );
}

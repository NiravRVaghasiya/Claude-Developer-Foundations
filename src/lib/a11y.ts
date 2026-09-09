/**
 * Small accessibility helpers shared across interactive components.
 * SSR-safe: all guard `window`.
 */

/** True when the user has requested reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll to the top of the page, honoring the reduced-motion preference. */
export function scrollToTop(): void {
  if (typeof window === "undefined") return;
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}
